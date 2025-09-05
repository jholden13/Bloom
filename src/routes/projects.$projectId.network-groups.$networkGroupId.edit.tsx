import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "@/../convex/_generated/api.js";
import { z } from "zod";

export const Route = createFileRoute("/projects/$projectId/network-groups/$networkGroupId/edit")({
  component: EditNetworkGroupPage,
  loader: async ({ context: { queryClient }, params }) => {
    const networkGroupQuery = convexQuery(api.expertNetworkGroups.get, { id: params.networkGroupId as any });
    await queryClient.ensureQueryData(networkGroupQuery);
  },
});

const schema = z.object({
  name: z.string().min(1, "Network group name is required"),
  description: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
});

function EditNetworkGroupPage() {
  const { projectId, networkGroupId } = Route.useParams();
  const navigate = useNavigate();
  const updateNetworkGroup = useMutation(api.expertNetworkGroups.update);

  const networkGroupQuery = convexQuery(api.expertNetworkGroups.get, { id: networkGroupId as any });
  const { data: networkGroup } = useSuspenseQuery(networkGroupQuery);

  if (!networkGroup) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Network group not found</h1>
          <button
            onClick={() => navigate({ to: `/projects/${projectId}` })}
            className="btn btn-primary"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  const form = useForm({
    defaultValues: {
      name: networkGroup.name || "",
      description: networkGroup.description || "",
      email: networkGroup.email || "",
    },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      await updateNetworkGroup({
        id: networkGroupId as any,
        name: value.name,
        description: value.description || undefined,
        email: value.email || undefined,
      });
      navigate({ to: `/projects/${projectId}` });
    },
  });

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
        <h1 className="text-3xl font-bold mb-2">Edit Network Group</h1>
        <p className="opacity-80">Update the network group details</p>
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
                <span className="label-text font-semibold">Network Group Name</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${
                  !field.state.meta.isValid ? "input-error" : ""
                }`}
                placeholder="e.g., GLG, AlphaSights, Guidepoint"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {!field.state.meta.isValid && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {field.state.meta.errors.map((e: any) => e.message).join(", ")}
                  </span>
                </label>
              )}
            </div>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description</span>
                <span className="label-text-alt opacity-70">(optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-24"
                placeholder="Describe this network group"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </div>
          )}
        />

        <form.Field
          name="email"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Contact Email</span>
                <span className="label-text-alt opacity-70">(required for scheduling calls)</span>
              </label>
              <input
                type="email"
                className={`input input-bordered w-full ${
                  !field.state.meta.isValid ? "input-error" : ""
                }`}
                placeholder="contact@networkgroup.com"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {!field.state.meta.isValid && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {field.state.meta.errors.map((e: any) => e.message).join(", ")}
                  </span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Email address for scheduling calls with experts
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
            {form.state.isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}