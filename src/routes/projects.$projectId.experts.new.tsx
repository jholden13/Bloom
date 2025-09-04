import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../convex/_generated/api.js";
import { z } from "zod";

export const Route = createFileRoute("/projects/$projectId/experts/new")({
  component: NewExpertPage,
  loader: async ({ context: { queryClient }, params }) => {
    const networksQuery = convexQuery(api.experts.getNetworks, {});
    await queryClient.ensureQueryData(networksQuery);
  },
});

const schema = z.object({
  name: z.string().min(1, "Expert name is required"),
  biography: z.string().optional(),
  network: z.string().min(1, "Network is required"),
  cost: z.number().optional(),
  costCurrency: z.string().optional(),
  status: z.enum(["rejected", "pending review", "maybe", "schedule call"]),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

function NewExpertPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const createExpert = useMutation(api.experts.create);

  const networksQuery = convexQuery(api.experts.getNetworks, {});
  const { data: networks } = useSuspenseQuery(networksQuery);

  const form = useForm({
    defaultValues: {
      name: "",
      biography: "",
      network: "",
      cost: "" as string,
      costCurrency: "USD",
      status: "pending review" as const,
      email: "",
      phone: "",
      notes: "",
    },
    validators: {
      onChange: schema.transform((data) => ({
        ...data,
        cost: data.cost ? Number(data.cost) : undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        biography: data.biography || undefined,
        notes: data.notes || undefined,
        costCurrency: data.costCurrency || undefined,
      })),
    },
    onSubmit: async ({ value }) => {
      await createExpert({
        projectId,
        name: value.name,
        biography: value.biography,
        network: value.network,
        cost: typeof value.cost === "string" && value.cost ? Number(value.cost) : undefined,
        costCurrency: value.costCurrency,
        status: value.status,
        email: value.email,
        phone: value.phone,
        notes: value.notes,
      });
      navigate({ to: `/projects/${projectId}` });
    },
  });

  const statusOptions = [
    { value: "rejected", label: "Rejected" },
    { value: "pending review", label: "Pending Review" },
    { value: "maybe", label: "Maybe" },
    { value: "schedule call", label: "Schedule Call" },
  ];

  const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD"];

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
        <h1 className="text-3xl font-bold mb-2">Add New Expert</h1>
        <p className="opacity-80">Add a new expert to your project</p>
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
          name="biography"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Biography</span>
                <span className="label-text-alt opacity-70">(optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-24"
                placeholder="Describe the expert's background and expertise"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </div>
          )}
        />

        <form.Field
          name="network"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Network</span>
              </label>
              <input
                type="text"
                list="networks"
                className={`input input-bordered w-full ${
                  !field.state.meta.isValid ? "input-error" : ""
                }`}
                placeholder="e.g., LinkedIn, GLG, AlphaSights, Third Bridge, etc."
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <datalist id="networks">
                {networks.map((network) => (
                  <option key={network} value={network} />
                ))}
                <option value="LinkedIn" />
                <option value="GLG" />
                <option value="AlphaSights" />
                <option value="Third Bridge" />
                <option value="Guidepoint" />
                <option value="Internal" />
              </datalist>
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

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="cost"
            children={(field) => (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Cost</span>
                  <span className="label-text-alt opacity-70">(optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered w-full"
                  placeholder="0.00"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          />

          <form.Field
            name="costCurrency"
            children={(field) => (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Currency</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="email"
            children={(field) => (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email</span>
                  <span className="label-text-alt opacity-70">(optional)</span>
                </label>
                <input
                  type="email"
                  className={`input input-bordered w-full ${
                    !field.state.meta.isValid ? "input-error" : ""
                  }`}
                  placeholder="expert@example.com"
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
            name="phone"
            children={(field) => (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Phone</span>
                  <span className="label-text-alt opacity-70">(optional)</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered w-full"
                  placeholder="+1 (555) 123-4567"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          />
        </div>

        <form.Field
          name="notes"
          children={(field) => (
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Notes</span>
                <span className="label-text-alt opacity-70">(optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-20"
                placeholder="Additional notes about this expert"
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
            {form.state.isSubmitting ? "Adding..." : "Add Expert"}
          </button>
        </div>
      </form>
    </div>
  );
}