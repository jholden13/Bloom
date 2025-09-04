import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "../../convex/_generated/api.js";
import { z } from "zod";

export const Route = createFileRoute("/projects/$projectId/edit")({
  component: EditProjectPage,
  loader: async ({ context: { queryClient }, params }) => {
    const projectQuery = convexQuery(api.projects.get, { id: params.projectId });
    await queryClient.ensureQueryData(projectQuery);
  },
});

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  analyst: z.string().optional(),
  researchAssociate: z.string().optional(),
  startDate: z.string().optional(),
});

function EditProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const updateProject = useMutation(api.projects.update);

  const projectQuery = convexQuery(api.projects.get, { id: projectId });
  const { data: project } = useSuspenseQuery(projectQuery);

  if (!project) {
    return <div>Project not found</div>;
  }

  const analystOptions = [
    "John Smith",
    "Sarah Johnson", 
    "Michael Chen",
    "Emily Davis",
    "David Wilson",
    "Jessica Brown",
    "Robert Taylor",
    "Lisa Anderson"
  ];

  const researchAssociateOptions = [
    "Alex Thompson",
    "Maria Garcia",
    "James Rodriguez",
    "Anna Lee",
    "Kevin Martinez",
    "Sophie Clark",
    "Daniel Lewis",
    "Rachel Green"
  ];

  const form = useForm({
    defaultValues: {
      name: project.name || "",
      description: project.description || "",
      analyst: project.analyst || "",
      researchAssociate: project.researchAssociate || "",
      startDate: project.startDate || "",
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      await updateProject({
        id: projectId,
        name: value.name,
        description: value.description || undefined,
        analyst: value.analyst || undefined,
        researchAssociate: value.researchAssociate || undefined,
        startDate: value.startDate || undefined,
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
        <h1 className="text-3xl font-bold mb-2">Edit Project</h1>
        <p className="opacity-80">Update project details and assignments</p>
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
                <span className="label-text font-semibold">Project Name</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${
                  !field.state.meta.isValid ? "input-error" : ""
                }`}
                placeholder="Enter project name"
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
          name="description"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description</span>
                <span className="label-text-alt opacity-70">(optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-24"
                placeholder="Describe the project"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="analyst"
            children={(field) => (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Analyst</span>
                  <span className="label-text-alt opacity-70">(optional)</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                >
                  <option value="">Select an analyst</option>
                  {analystOptions.map((analyst) => (
                    <option key={analyst} value={analyst}>
                      {analyst}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />

          <form.Field
            name="researchAssociate"
            children={(field) => (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Research Associate</span>
                  <span className="label-text-alt opacity-70">(optional)</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                >
                  <option value="">Select a research associate</option>
                  {researchAssociateOptions.map((associate) => (
                    <option key={associate} value={associate}>
                      {associate}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />
        </div>

        <form.Field
          name="startDate"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Start Date</span>
                <span className="label-text-alt opacity-70">(optional)</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
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