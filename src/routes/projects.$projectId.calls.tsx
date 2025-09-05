import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, User, DollarSign, Printer } from "lucide-react";
import { api } from "@/../convex/_generated/api.js";

export const Route = createFileRoute("/projects/$projectId/calls")({
  component: CallsPage,
  loader: async ({ context: { queryClient }, params }) => {
    const projectQuery = convexQuery(api.projects.get, { id: params.projectId as any });
    const expertsQuery = convexQuery(api.experts.listByProject, { projectId: params.projectId as any });
    const networkGroupsQuery = convexQuery(api.expertNetworkGroups.listByProject, { projectId: params.projectId as any });
    await Promise.all([
      queryClient.ensureQueryData(projectQuery),
      queryClient.ensureQueryData(expertsQuery),
      queryClient.ensureQueryData(networkGroupsQuery),
    ]);
  },
});

function CallsPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const projectQuery = convexQuery(api.projects.get, { id: projectId as any });
  const expertsQuery = convexQuery(api.experts.listByProject, { projectId: projectId as any });
  const networkGroupsQuery = convexQuery(api.expertNetworkGroups.listByProject, { projectId: projectId as any });

  const { data: project } = useSuspenseQuery(projectQuery);
  const { data: experts } = useSuspenseQuery(expertsQuery);
  const { data: networkGroups } = useSuspenseQuery(networkGroupsQuery);

  if (!project) {
    return <div>Project not found</div>;
  }

  // Filter experts to show only those with "schedule call" status
  const expertsToSchedule = experts.filter(expert => expert.status === "schedule call");

  const formatCost = (cost: number) => {
    return cost % 1 === 0 ? cost.toString() : cost.toFixed(1);
  };

  const handleScheduleCall = (expert: any, networkGroup: any) => {
    if (!networkGroup?.email) {
      alert("No contact email found for this network group. Please add an email to the network group.");
      return;
    }

    const subject = `Schedule call - ${expert.name}`;
    const body = `Dear ${networkGroup.name},

I would like to schedule a call with ${expert.name} for our project "${project.name}".

Expert Details:
- Name: ${expert.name}
${expert.biography ? `- Biography: ${expert.biography}` : ''}
${expert.cost ? `- Cost: ${formatCost(expert.cost)} credits` : ''}

Please let me know your availability for scheduling this call.

Best regards`;

    const mailtoUrl = `mailto:${encodeURIComponent(networkGroup.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.location.href = mailtoUrl;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate({ to: `/projects/${projectId}` })}
          className="btn btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </button>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Schedule Calls - {project.name}</h1>
            <p className="opacity-80">Experts ready to schedule calls</p>
          </div>
          {expertsToSchedule.length > 0 && (
            <button
              onClick={handlePrint}
              className="btn btn-outline print:hidden"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print List
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm opacity-70 print:mb-8">
        {expertsToSchedule.length} expert{expertsToSchedule.length !== 1 ? 's' : ''} ready to schedule
      </div>

      {/* Experts List */}
      {expertsToSchedule.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No experts ready to schedule</h3>
          <p className="opacity-70">
            No experts currently have "schedule call" status in this project.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {expertsToSchedule.map((expert) => {
            const networkGroup = expert.networkGroupId 
              ? networkGroups.find(g => g._id === expert.networkGroupId)
              : null;

            return (
              <div key={expert._id} className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="card-title text-lg mb-2">{expert.name}</h3>
                      
                      <div className="flex flex-wrap gap-4 text-sm mb-3">
                        {networkGroup && (
                          <div className="flex items-center opacity-70">
                            <User className="w-4 h-4 mr-1" />
                            {networkGroup.name}
                          </div>
                        )}

                        {expert.cost && (
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {formatCost(expert.cost)} credits
                          </div>
                        )}
                      </div>

                      {expert.biography && (
                        <div className="mb-3">
                          <strong className="text-sm">Bio:</strong>
                          <div className="text-sm opacity-80 mt-1 whitespace-pre-wrap border-l-2 border-base-300 pl-3">
                            {expert.biography}
                          </div>
                        </div>
                      )}

                      {expert.screeningQuestions && (
                        <div className="mb-3">
                          <strong className="text-sm">Screening Questions:</strong>
                          <div className="text-sm opacity-80 mt-1 whitespace-pre-wrap border-l-2 border-base-300 pl-3">
                            {expert.screeningQuestions}
                          </div>
                        </div>
                      )}


                      {expert.notes && (
                        <div className="mb-3">
                          <strong className="text-sm">Notes:</strong>{" "}
                          <span className="text-sm opacity-80">{expert.notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="badge badge-success">
                        Schedule Call
                      </div>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleScheduleCall(expert, networkGroup)}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}