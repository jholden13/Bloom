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
    const projectQuery = convexQuery(api.projects.get, { id: params.projectId as any });
    await queryClient.ensureQueryData(projectQuery);
  },
});

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Project description is required"),
  analyst: z.string().min(1, "Analyst is required"),
  analystEmail: z.string().email("Please enter a valid email").min(1, "Analyst email is required"),
  researchAssociate: z.string().min(1, "Research associate is required"),
  researchAssociateEmail: z.string().email("Please enter a valid email").min(1, "Research associate email is required"),
  startDate: z.string().min(1, "Start date is required"),
});

function EditProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const updateProject = useMutation(api.projects.update);

  const projectQuery = convexQuery(api.projects.get, { id: projectId as any });
  const { data: project } = useSuspenseQuery(projectQuery);

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <button
            onClick={() => navigate({ to: "/projects" })}
            className="btn btn-primary"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
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
      analystEmail: project.analystEmail || "",
      researchAssociate: project.researchAssociate || "",
      researchAssociateEmail: project.researchAssociateEmail || "",
      startDate: project.startDate || "",
    },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProject({
          id: projectId as any,
          name: value.name,
          description: value.description,
          analyst: value.analyst,
          analystEmail: value.analystEmail,
          researchAssociate: value.researchAssociate,
          researchAssociateEmail: value.researchAssociateEmail,
          startDate: value.startDate,
        });
        navigate({ to: `/projects/${projectId}` });
      } catch (error) {
        console.error('Error updating project:', error);
        alert('Failed to update project. Please try again.');
      }
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

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="analystEmail"
            children={(field) => (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Analyst Email</span>
                  </label>
                <input
                  type="email"
                  className={`input input-bordered w-full ${
                    !field.state.meta.isValid ? "input-error" : ""
                  }`}
                  placeholder="analyst@company.com"
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
            name="researchAssociateEmail"
            children={(field) => (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Research Associate Email</span>
                  </label>
                <input
                  type="email"
                  className={`input input-bordered w-full ${
                    !field.state.meta.isValid ? "input-error" : ""
                  }`}
                  placeholder="associate@company.com"
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
        </div>

        <form.Field
          name="startDate"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Start Date</span>
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
            onClick={() => {
              console.log('Button clicked, canSubmit:', form.state.canSubmit, 'isSubmitting:', form.state.isSubmitting);
              console.log('Form values:', form.state.values);
              console.log('Form errors:', form.state.errors);
            }}
          >
            {form.state.isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}