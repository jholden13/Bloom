import { useMutation } from "convex/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { api } from "../../convex/_generated/api";

const tripSchema = z.object({
  name: z.string().min(1, "Trip name is required"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const Route = createFileRoute("/trips/new")({
  component: NewTripPage,
});

function NewTripPage() {
  const navigate = useNavigate();
  const createTrip = useMutation(api.trips.create);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    },
    validators: {
      onChange: tripSchema,
    },
    onSubmit: async ({ value }) => {
      const tripId = await createTrip({
        name: value.name,
        description: value.description || undefined,
        startDate: value.startDate || undefined,
        endDate: value.endDate || undefined,
      });
      
      void navigate({ to: "/trips/$tripId", params: { tripId } });
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1>Create New Trip</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="not-prose space-y-4"
      >
        <form.Field name="name">
          {(field) => (
            <fieldset>
              <legend>Trip Name</legend>
              <input
                className="input w-full"
                placeholder="Enter trip name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {!field.state.meta.isValid && (
                <em className="text-error text-sm">
                  {field.state.meta.errors.map(e => e.message).join(", ")}
                </em>
              )}
            </fieldset>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <fieldset>
              <legend>Description</legend>
              <textarea
                className="textarea w-full"
                placeholder="Optional description"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </fieldset>
          )}
        </form.Field>

        <div className="grid md:grid-cols-2 gap-4">
          <form.Field name="startDate">
            {(field) => (
              <fieldset>
                <legend>Start Date</legend>
                <input
                  type="date"
                  className="input w-full"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </fieldset>
            )}
          </form.Field>

          <form.Field name="endDate">
            {(field) => (
              <fieldset>
                <legend>End Date</legend>
                <input
                  type="date"
                  className="input w-full"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </fieldset>
            )}
          </form.Field>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!form.state.canSubmit || form.state.isSubmitting}
            className="btn btn-primary"
          >
            {form.state.isSubmitting ? "Creating..." : "Create Trip"}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}