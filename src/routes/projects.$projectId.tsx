import { createFileRoute, Link, useNavigate, Outlet } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { ArrowLeft, Plus, User, Trash2, Edit3, Calendar, DollarSign, Edit } from "lucide-react";
import { api } from "../../convex/_generated/api.js";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetailPage,
  loader: async ({ context: { queryClient }, params }) => {
    const projectQuery = convexQuery(api.projects.get, { id: params.projectId as any });
    const expertsQuery = convexQuery(api.experts.listByProject, { projectId: params.projectId as any });
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

  const projectQuery = convexQuery(api.projects.get, { id: projectId as any });
  const expertsQuery = convexQuery(api.experts.listByProject, { projectId: projectId as any });

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
      id: expertId as any,
      status: status as any,
    });
  };

  const handleDeleteExpert = async (expertId: string) => {
    if (confirm("Are you sure you want to delete this expert?")) {
      await deleteExpert({ id: expertId as any });
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
      <Outlet />
    </div>
  );
}