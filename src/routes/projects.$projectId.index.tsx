import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { ArrowLeft, Plus, User, Trash2, Edit3, Calendar, DollarSign, Edit, Network, Users, Settings } from "lucide-react";
import { api } from "@/../convex/_generated/api.js";

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectDetailIndexPage,
  loader: async ({ context: { queryClient }, params }) => {
    const projectQuery = convexQuery(api.projects.get, { id: params.projectId });
    const expertsQuery = convexQuery(api.experts.listByProject, { projectId: params.projectId });
    const networkGroupsQuery = convexQuery(api.expertNetworkGroups.listByProject, { projectId: params.projectId });
    await Promise.all([
      queryClient.ensureQueryData(projectQuery),
      queryClient.ensureQueryData(expertsQuery),
      queryClient.ensureQueryData(networkGroupsQuery),
    ]);
  },
});

function ProjectDetailIndexPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const updateExpert = useMutation(api.experts.update);
  const deleteExpert = useMutation(api.experts.remove);

  const projectQuery = convexQuery(api.projects.get, { id: projectId });
  const expertsQuery = convexQuery(api.experts.listByProject, { projectId });
  const networkGroupsQuery = convexQuery(api.expertNetworkGroups.listByProject, { projectId });

  const { data: project } = useSuspenseQuery(projectQuery);
  const { data: experts } = useSuspenseQuery(expertsQuery);
  const { data: networkGroups } = useSuspenseQuery(networkGroupsQuery);

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

  const formatCost = (cost: number) => {
    return cost % 1 === 0 ? cost.toString() : cost.toFixed(1);
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

  // Group experts by network group
  const expertsWithoutGroup = experts.filter(expert => !expert.networkGroupId);
  const groupedByNetworkGroup = networkGroups.map(group => ({
    group,
    experts: experts.filter(expert => expert.networkGroupId === group._id),
  }));

  return (
    <>
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
            <div className="flex flex-wrap gap-2 text-sm">
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
              {project.startDate && (
                <div className="badge badge-outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span className="font-semibold mr-1">Start:</span>
                  {new Date(project.startDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/projects/${projectId}/edit`}>
              <button className="btn btn-outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Project
              </button>
            </Link>
            <Link to={`/projects/${projectId}/calls`}>
              <button className="btn btn-outline">
                <Calendar className="w-4 h-4 mr-2" />
                View Calls
              </button>
            </Link>
            <Link to={`/projects/${projectId}/network-groups/new`}>
              <button className="btn btn-outline">
                <Network className="w-4 h-4 mr-2" />
                Add Network Group
              </button>
            </Link>
            <Link to={`/projects/${projectId}/experts/new`}>
              <button className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Expert
              </button>
            </Link>
          </div>
        </div>
      </div>

      {networkGroups.length === 0 && experts.length === 0 ? (
        <div className="text-center py-12">
          <Network className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No network groups yet</h3>
          <p className="opacity-70 mb-6">Create your first network group to organize experts</p>
          <Link to={`/projects/${projectId}/network-groups/new`}>
            <button className="btn btn-primary">
              <Network className="w-4 h-4 mr-2" />
              Add Network Group
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Network Groups */}
          {groupedByNetworkGroup.map(({ group, experts: groupExperts }) => (
            <div key={group._id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center">
                  <Network className="w-5 h-5 mr-2" />
                  {group.name}
                  <span className="badge badge-outline ml-3">
                    {groupExperts.length} expert{groupExperts.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <Link to={`/projects/${projectId}/experts/new?networkGroupId=${group._id}`}>
                  <button className="btn btn-sm btn-outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Expert
                  </button>
                </Link>
              </div>
              
              {group.description && (
                <p className="text-sm opacity-70">{group.description}</p>
              )}

              {groupExperts.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-base-300 rounded-lg">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm opacity-70">No experts in this group yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {statusOptions.map((status) => {
                    const statusExperts = groupExperts.filter(expert => expert.status === status);
                    if (statusExperts.length === 0) return null;

                    return (
                      <div key={status} className="space-y-3">
                        <h3 className="font-medium capitalize flex items-center">
                          <span className={`badge ${getStatusBadgeClass(status)} badge-sm mr-2`}>
                            {statusExperts.length}
                          </span>
                          {status}
                        </h3>
                        <div className="not-prose grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {statusExperts.map((expert) => (
                            <div key={expert._id} className="card bg-base-100 shadow-md border">
                              <div className="card-body">
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="card-title text-base">{expert.name}</h4>
                                  <div className="flex gap-2">
                                    <Link to={`/projects/${projectId}/experts/${expert._id}/edit`}>
                                      <button className="btn btn-ghost btn-sm" title="Edit Expert">
                                        <Edit className="w-4 h-4" />
                                      </button>
                                    </Link>
                                    <div className="dropdown dropdown-end">
                                      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                                        <Settings className="w-4 h-4" />
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
                                </div>

                                <div className="mb-3">
                                  <div className="dropdown">
                                    <div 
                                      tabIndex={0} 
                                      role="button" 
                                      className={`badge ${getStatusBadgeClass(expert.status)} cursor-pointer hover:opacity-80`}
                                      title="Click to change status"
                                    >
                                      {expert.status}
                                    </div>
                                    <ul
                                      tabIndex={0}
                                      className="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow mt-1"
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
                                    </ul>
                                  </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                  {expert.cost && (
                                    <div className="flex items-center">
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      {formatCost(expert.cost)} credits
                                    </div>
                                  )}

                                  {expert.biography && (
                                    <div>
                                      <strong>Bio:</strong>{" "}
                                      <span className="opacity-80">
                                        {expert.biography.length > 80 
                                          ? `${expert.biography.substring(0, 80)}...`
                                          : expert.biography
                                        }
                                      </span>
                                    </div>
                                  )}

                                  {expert.notes && (
                                    <div>
                                      <strong>Notes:</strong>{" "}
                                      <span className="opacity-80">{expert.notes}</span>
                                    </div>
                                  )}
                                </div>

                                {expert.status === "schedule call" && (
                                  <div className="card-actions justify-end mt-3">
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
          ))}

          {/* Ungrouped Experts */}
          {expertsWithoutGroup.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Ungrouped Experts
                <span className="badge badge-outline ml-3">
                  {expertsWithoutGroup.length} expert{expertsWithoutGroup.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <div className="space-y-6">
                {statusOptions.map((status) => {
                  const statusExperts = expertsWithoutGroup.filter(expert => expert.status === status);
                  if (statusExperts.length === 0) return null;

                  return (
                    <div key={status} className="space-y-3">
                      <h3 className="font-medium capitalize flex items-center">
                        <span className={`badge ${getStatusBadgeClass(status)} badge-sm mr-2`}>
                          {statusExperts.length}
                        </span>
                        {status}
                      </h3>
                      <div className="not-prose grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {statusExperts.map((expert) => (
                          <div key={expert._id} className="card bg-base-100 shadow-md border">
                            <div className="card-body">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="card-title text-base">{expert.name}</h4>
                                <div className="flex gap-2">
                                  <Link to={`/projects/${projectId}/experts/${expert._id}/edit`}>
                                    <button className="btn btn-ghost btn-sm" title="Edit Expert">
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </Link>
                                  <div className="dropdown dropdown-end">
                                    <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                                      <Settings className="w-4 h-4" />
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
                              </div>

                              <div className="mb-3">
                                <div className="dropdown">
                                  <div 
                                    tabIndex={0} 
                                    role="button" 
                                    className={`badge ${getStatusBadgeClass(expert.status)} cursor-pointer hover:opacity-80`}
                                    title="Click to change status"
                                  >
                                    {expert.status}
                                  </div>
                                  <ul
                                    tabIndex={0}
                                    className="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow mt-1"
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
                                  </ul>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm">
                                {expert.cost && (
                                  <div className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {formatCost(expert.cost)} credits
                                  </div>
                                )}

                                {expert.biography && (
                                  <div>
                                    <strong>Bio:</strong>{" "}
                                    <span className="opacity-80">
                                      {expert.biography.length > 80 
                                        ? `${expert.biography.substring(0, 80)}...`
                                        : expert.biography
                                      }
                                    </span>
                                  </div>
                                )}

                                {expert.email && (
                                  <div>
                                    <strong>Email:</strong> {expert.email}
                                  </div>
                                )}

                                {expert.phone && (
                                  <div>
                                    <strong>Phone:</strong> {expert.phone}
                                  </div>
                                )}

                                {expert.notes && (
                                  <div>
                                    <strong>Notes:</strong>{" "}
                                    <span className="opacity-80">{expert.notes}</span>
                                  </div>
                                )}
                              </div>

                              {expert.status === "schedule call" && (
                                <div className="card-actions justify-end mt-3">
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
            </div>
          )}
        </div>
      )}
    </>
  );
}