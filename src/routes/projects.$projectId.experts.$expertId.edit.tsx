import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/../convex/_generated/api.js";
import { z } from "zod";

export const Route = createFileRoute("/projects/$projectId/experts/$expertId/edit")({
  component: EditExpertPage,
  loader: async ({ context: { queryClient }, params }) => {
    const expertQuery = convexQuery(api.experts.get, { id: params.expertId as any });
    const networkGroupsQuery = convexQuery(api.expertNetworkGroups.listByProject, { projectId: params.projectId as any });
    await Promise.all([
      queryClient.ensureQueryData(expertQuery),
      queryClient.ensureQueryData(networkGroupsQuery),
    ]);
  },
});

const schema = z.object({
  name: z.string().min(1, "Expert name is required"),
  biography: z.string().optional(),
  networkGroupId: z.string().optional(),
  cost: z.string().min(1, "Cost is required").refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Cost must be a valid number"),
  status: z.enum(["rejected", "pending review", "maybe", "schedule call"]),
  screeningQuestions: z.string().optional(),
});

function EditExpertPage() {
  const { projectId, expertId } = Route.useParams();
  const navigate = useNavigate();
  const updateExpert = useMutation(api.experts.update);

  const expertQuery = convexQuery(api.experts.get, { id: expertId as any });
  const networkGroupsQuery = convexQuery(api.expertNetworkGroups.listByProject, { projectId: projectId as any });
  const { data: expert } = useSuspenseQuery(expertQuery);
  const { data: networkGroups } = useSuspenseQuery(networkGroupsQuery);

  if (!expert) {
    return <div>Expert not found</div>;
  }

  const form = useForm({
    defaultValues: {
      name: expert.name,
      biography: expert.biography || "",
      networkGroupId: expert.networkGroupId || "",
      cost: expert.cost ? expert.cost.toString() : "",
      status: expert.status,
      screeningQuestions: expert.screeningQuestions || "",
    },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      try {
        console.log('Updating expert with value:', value);
        await updateExpert({
          id: expertId as any,
          networkGroupId: value.networkGroupId || undefined as any,
          name: value.name,
          biography: value.biography || undefined,
          cost: Number(value.cost),
          status: value.status,
          screeningQuestions: value.screeningQuestions || undefined,
        });
        console.log('Expert updated successfully, navigating...');
        navigate({ to: `/projects/${projectId}` });
      } catch (error) {
        console.error('Error updating expert:', error);
      }
    },
  });

  const statusOptions = [
    { value: "rejected", label: "Rejected" },
    { value: "pending review", label: "Pending Review" },
    { value: "maybe", label: "Maybe" },
    { value: "schedule call", label: "Schedule Call" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate({ to: `/projects/${projectId}` })}
          className="btn btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </button>
        <h1 className="text-3xl font-bold mb-2">Edit Expert</h1>
        <p className="opacity-80">Update expert information</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field
          name="name"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Expert Name</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${
                  !field.state.meta.isValid ? "input-error" : ""
                }`}
                placeholder="Enter expert name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {!field.state.meta.isValid && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {field.state.meta.errors.map((e) => e.message).join(", ")}
                  </span>
                </label>
              )}
            </div>
          )}
        />

        <form.Field
          name="networkGroupId"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Network Group</span>
                <span className="label-text-alt opacity-70">(optional)</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              >
                <option value="">No network group</option>
                {networkGroups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Choose a network group to organize this expert
                </span>
              </label>
            </div>
          )}
        />

        <form.Field
          name="biography"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Biography</span>
                <span className="label-text-alt opacity-70">(optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-32 text-black bg-white"
                placeholder="Describe the expert's background and expertise..."
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                style={{ color: '#000000', backgroundColor: '#ffffff' }}
              />
            </div>
          )}
        />

        <form.Field
          name="cost"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Cost (credits)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                className={`input input-bordered w-full ${
                  !field.state.meta.isValid ? "input-error" : ""
                }`}
                placeholder="0.0"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {!field.state.meta.isValid && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {field.state.meta.errors.map((e) => e.message).join(", ")}
                  </span>
                </label>
              )}
            </div>
          )}
        />

        <form.Field
          name="status"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Status</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as any)}
                onBlur={field.handleBlur}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        />

        <form.Field
          name="screeningQuestions"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Screening Questions</span>
                <span className="label-text-alt opacity-70">(optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-48 text-black bg-white"
                placeholder="Questions to ask during screening or initial contact..."
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                style={{ color: '#000000', backgroundColor: '#ffffff' }}
              />
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Questions to evaluate this expert's fit for the project
                </span>
              </label>
            </div>
          )}
        />

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate({ to: `/projects/${projectId}` })}
            className="btn btn-ghost"
            disabled={form.state.isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!form.state.canSubmit || form.state.isSubmitting}
          >
            {form.state.isSubmitting ? "Updating..." : "Update Expert"}
          </button>
        </div>
      </form>
    </div>
  );
}