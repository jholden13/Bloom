import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

const searchSchema = z.object({
  id: z.string(),
});

export const Route = createFileRoute("/edit-outreach")({
  validateSearch: searchSchema,
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(convexQuery(api.outreach.list, {}));
  },
  component: EditOutreachPage,
});

function EditOutreachPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, {}));
  const updateOutreach = useMutation(api.outreach.update);

  const currentOutreach = outreach.find(item => item._id === id);

  if (!currentOutreach) {
    return <div>Outreach not found</div>;
  }

  const form = useForm({
    defaultValues: {
      notes: currentOutreach.notes || "",
      proposedAddress: currentOutreach.proposedAddress || "",
      proposedMeetingTime: currentOutreach.proposedMeetingTime || "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await updateOutreach({
          id: id as any,
          notes: value.notes || undefined,
          proposedAddress: value.proposedAddress || undefined,
          proposedMeetingTime: value.proposedMeetingTime || undefined,
        });

        void navigate({ to: "/trips/$tripId", params: { tripId: currentOutreach.tripId } });
      } catch (error) {
        console.error("Error updating outreach:", error);
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1>Edit Outreach</h1>
      <p className="opacity-70 mb-6">
        Update outreach details for <strong>{currentOutreach.organization?.name}</strong>
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="not-prose space-y-6"
      >
        {/* Current Info Display */}
        <div className="p-4 bg-base-200 rounded-lg">
          <h3 className="font-semibold mb-2">Current Information</h3>
          <div className="text-sm space-y-1">
            <p><strong>Organization:</strong> {currentOutreach.organization?.name}</p>
            <p><strong>Contact:</strong> {currentOutreach.contact?.name}</p>
            <p><strong>Email:</strong> {currentOutreach.contact?.email}</p>
            <p><strong>Outreach Date:</strong> {currentOutreach.outreachDate}</p>
            <p><strong>Status:</strong> 
              <span className={`badge badge-sm ml-2 ${
                currentOutreach.response === 'meeting_scheduled' ? 'badge-success' :
                currentOutreach.response === 'interested' ? 'badge-info' :
                currentOutreach.response === 'pending' ? 'badge-warning' :
                'badge-error'
              }`}>
                {currentOutreach.response.replace('_', ' ')}
              </span>
            </p>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="p-4 bg-base-100 rounded-lg">
          <h3 className="font-semibold mb-4">Update Details</h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <form.Field name="proposedAddress">
              {(field) => (
                <fieldset>
                  <legend>Proposed Address</legend>
                  <input
                    className="input w-full"
                    placeholder="Meeting location or address"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </fieldset>
              )}
            </form.Field>

            <form.Field name="proposedMeetingTime">
              {(field) => (
                <fieldset>
                  <legend>Proposed Meeting Time</legend>
                  <input
                    className="input w-full"
                    placeholder="e.g., 2:00 PM or afternoon"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </fieldset>
              )}
            </form.Field>
          </div>

          <form.Field name="notes">
            {(field) => (
              <fieldset>
                <legend>Notes</legend>
                <textarea
                  className="textarea w-full"
                  placeholder="Any additional notes about the outreach..."
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
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/trips/$tripId", params: { tripId: currentOutreach.tripId } })}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}