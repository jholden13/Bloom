import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { ArrowLeft, Plus, User, Trash2, Edit3, Calendar, DollarSign } from "lucide-react";
import { api } from "../../convex/_generated/api.js";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetailPage,
  loader: async ({ context: { queryClient }, params }) => {
    const projectQuery = convexQuery(api.projects.get, { id: params.projectId });
    const expertsQuery = convexQuery(api.experts.listByProject, { projectId: params.projectId });
    await Promise.all([
      queryClient.ensureQueryData(projectQuery),
      queryClient.ensureQueryData(expertsQuery),
    ]);
  },
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const updateExpert = useMutation(api.experts.update);
  const deleteExpert = useMutation(api.experts.remove);

  const projectQuery = convexQuery(api.projects.get, { id: projectId });
  const expertsQuery = convexQuery(api.experts.listByProject, { projectId });

  const { data: project } = useSuspenseQuery(projectQuery);
  const { data: experts } = useSuspenseQuery(expertsQuery);

  if (!project) {
    return <div>Project not found</div>;
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "rejected":
        return "badge-error";
      case "pending review":
        return "badge-warning";
      case "maybe":
        return "badge-info";
      case "schedule call":
        return "badge-success";
      default:
        return "badge-ghost";
    }
  };

  const handleStatusChange = async (expertId: string, status: string) => {
    await updateExpert({
      id: expertId,
      status: status as any,
    });
  };

  const handleDeleteExpert = async (expertId: string) => {
    if (confirm("Are you sure you want to delete this expert?")) {
      await deleteExpert({ id: expertId });
    }
  };

  const statusOptions = ["rejected", "pending review", "maybe", "schedule call"];

  const groupedExperts = experts.reduce((acc, expert) => {
    if (!acc[expert.status]) {
      acc[expert.status] = [];
    }
    acc[expert.status].push(expert);
    return acc;
  }, {} as Record<string, typeof experts>);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate({ to: "/projects" })}
          className="btn btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </button>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            {project.description && (
              <p className="opacity-80 mb-3">{project.description}</p>
            )}
            <div className="flex gap-4 text-sm">
              {project.analyst && (
                <div className="badge badge-outline">
                  <span className="font-semibold mr-1">Analyst:</span>
                  {project.analyst}
                </div>
              )}
              {project.researchAssociate && (
                <div className="badge badge-outline">
                  <span className="font-semibold mr-1">Research Associate:</span>
                  {project.researchAssociate}
                </div>
              )}
            </div>
          </div>
          <Link to={`/projects/${projectId}/experts/new`}>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Expert
            </button>
          </Link>
        </div>
      </div>

      {experts.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No experts yet</h3>
          <p className="opacity-70 mb-6">Add your first expert to start managing consultations</p>
          <Link to={`/projects/${projectId}/experts/new`}>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Expert
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {statusOptions.map((status) => {
            const statusExperts = groupedExperts[status] || [];
            if (statusExperts.length === 0) return null;

            return (
              <div key={status} className="space-y-4">
                <h2 className="text-xl font-semibold capitalize flex items-center">
                  <span className={`badge ${getStatusBadgeClass(status)} mr-3`}>
                    {statusExperts.length}
                  </span>
                  {status}
                </h2>
                <div className="not-prose grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {statusExperts.map((expert) => (
                    <div key={expert._id} className="card bg-base-100 shadow-lg">
                      <div className="card-body">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="card-title text-lg">{expert.name}</h3>
                          <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                              <Edit3 className="w-4 h-4" />
                            </div>
                            <ul
                              tabIndex={0}
                              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                            >
                              {statusOptions.map((statusOption) => (
                                <li key={statusOption}>
                                  <a
                                    onClick={() => handleStatusChange(expert._id, statusOption)}
                                    className={statusOption === expert.status ? "active" : ""}
                                  >
                                    <span className={`badge ${getStatusBadgeClass(statusOption)} badge-sm mr-2`} />
                                    {statusOption}
                                  </a>
                                </li>
                              ))}
                              <div className="divider my-1"></div>
                              <li>
                                <a
                                  onClick={() => handleDeleteExpert(expert._id)}
                                  className="text-error"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Network:</strong> {expert.network}
                          </div>
                          
                          {expert.cost && (
                            <div className="text-sm flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {expert.cost} {expert.costCurrency || 'USD'}
                            </div>
                          )}

                          {expert.biography && (
                            <div className="text-sm">
                              <strong>Bio:</strong>{" "}
                              <span className="opacity-80">
                                {expert.biography.length > 100 
                                  ? `${expert.biography.substring(0, 100)}...`
                                  : expert.biography
                                }
                              </span>
                            </div>
                          )}

                          {expert.email && (
                            <div className="text-sm">
                              <strong>Email:</strong> {expert.email}
                            </div>
                          )}

                          {expert.phone && (
                            <div className="text-sm">
                              <strong>Phone:</strong> {expert.phone}
                            </div>
                          )}

                          {expert.notes && (
                            <div className="text-sm">
                              <strong>Notes:</strong>{" "}
                              <span className="opacity-80">{expert.notes}</span>
                            </div>
                          )}
                        </div>

                        {expert.status === "schedule call" && (
                          <div className="card-actions justify-end mt-4">
                            <button className="btn btn-sm btn-primary">
                              <Calendar className="w-4 h-4 mr-1" />
                              Schedule Call
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}