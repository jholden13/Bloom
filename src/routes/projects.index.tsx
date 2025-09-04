import { createFileRoute, Link } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Users, Calendar } from "lucide-react";
import { api } from "../../convex/_generated/api.js";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
  loader: async ({ context: { queryClient } }) => {
    const projectsQuery = convexQuery(api.projects.list, {});
    await queryClient.ensureQueryData(projectsQuery);
  },
});

function ProjectsPage() {
  const projectsQuery = convexQuery(api.projects.list, {});
  const { data: projects } = useSuspenseQuery(projectsQuery);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="opacity-80">Manage your expert consulting projects</p>
        </div>
        <Link to="/projects/new">
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="opacity-70 mb-6">Create your first project to start managing experts</p>
          <Link to="/projects/new">
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </button>
          </Link>
        </div>
      ) : (
        <div className="not-prose grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`}>
              <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="card-body">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="card-title text-xl mb-2">{project.name}</h2>
                  {project.description && (
                    <p className="opacity-70 mb-3">{project.description}</p>
                  )}
                  <div className="space-y-1 mb-4">
                    {project.analyst && (
                      <div className="text-sm">
                        <span className="font-semibold">Analyst:</span> {project.analyst}
                      </div>
                    )}
                    {project.researchAssociate && (
                      <div className="text-sm">
                        <span className="font-semibold">Research Associate:</span> {project.researchAssociate}
                      </div>
                    )}
                    {project.startDate && (
                      <div className="text-sm">
                        <span className="font-semibold">Start Date:</span> {new Date(project.startDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="card-actions justify-end">
                    <div className="badge badge-outline">
                      View Details
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}