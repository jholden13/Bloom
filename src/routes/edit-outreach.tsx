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
  const updateContact = useMutation(api.contacts.update);
  const updateOrganization = useMutation(api.organizations.update);

  const currentOutreach = outreach.find(item => item._id === id);

  if (!currentOutreach) {
    return <div>Outreach not found</div>;
  }

  const form = useForm({
    defaultValues: {
      // Organization fields
      organizationName: currentOutreach.organization?.name || "",
      organizationNotes: currentOutreach.organization?.notes || "",
      // Contact fields
      contactName: currentOutreach.contact?.name || "",
      contactEmail: currentOutreach.contact?.email || "",
      contactPhone: currentOutreach.contact?.phone || "",
      // Outreach fields
      notes: currentOutreach.notes || "",
      proposedStreetAddress: currentOutreach.proposedStreetAddress || "",
      proposedCity: currentOutreach.proposedCity || "",
      proposedState: currentOutreach.proposedState || "",
      proposedCountry: currentOutreach.proposedCountry || "",
      proposedZipCode: currentOutreach.proposedZipCode || "",
      proposedMeetingTime: currentOutreach.proposedMeetingTime || "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        // Update organization
        if (currentOutreach.organization) {
          await updateOrganization({
            id: currentOutreach.organizationId as any,
            name: value.organizationName || undefined,
            notes: value.organizationNotes || undefined,
          });
        }

        // Update contact
        if (currentOutreach.contact) {
          await updateContact({
            id: currentOutreach.contactId as any,
            name: value.contactName || undefined,
            email: value.contactEmail || undefined,
            phone: value.contactPhone || undefined,
          });
        }

        // Update outreach
        await updateOutreach({
          id: id as any,
          notes: value.notes || undefined,
          proposedStreetAddress: value.proposedStreetAddress || undefined,
          proposedCity: value.proposedCity || undefined,
          proposedState: value.proposedState || undefined,
          proposedCountry: value.proposedCountry || undefined,
          proposedZipCode: value.proposedZipCode || undefined,
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

        {/* Organization Section */}
        <div className="p-4 bg-base-100 rounded-lg">
          <h3 className="font-semibold mb-4">Organization Details</h3>
          
          <form.Field name="organizationName">
            {(field) => (
              <fieldset className="mb-4">
                <legend>Organization Name *</legend>
                <input
                  className="input w-full"
                  placeholder="Company or organization name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </fieldset>
            )}
          </form.Field>

          <form.Field name="organizationNotes">
            {(field) => (
              <fieldset>
                <legend>Organization Notes</legend>
                <textarea
                  className="textarea w-full"
                  placeholder="Notes about the organization..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </fieldset>
            )}
          </form.Field>
        </div>

        {/* Contact Section */}
        <div className="p-4 bg-base-100 rounded-lg">
          <h3 className="font-semibold mb-4">Contact Person</h3>
          
          <form.Field name="contactName">
            {(field) => (
              <fieldset className="mb-4">
                <legend>Contact Name *</legend>
                <input
                  className="input w-full"
                  placeholder="Full name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </fieldset>
            )}
          </form.Field>

          <div className="grid md:grid-cols-2 gap-4">
            <form.Field name="contactEmail">
              {(field) => (
                <fieldset>
                  <legend>Email Address *</legend>
                  <input
                    type="email"
                    className="input w-full"
                    placeholder="contact@company.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                </fieldset>
              )}
            </form.Field>

            <form.Field name="contactPhone">
              {(field) => (
                <fieldset>
                  <legend>Phone Number</legend>
                  <input
                    type="tel"
                    className="input w-full"
                    placeholder="+1 555-123-4567"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </fieldset>
              )}
            </form.Field>
          </div>
        </div>

        {/* Meeting Details Section */}
        <div className="p-4 bg-base-100 rounded-lg">
          <h3 className="font-semibold mb-4">Meeting Details</h3>
          
          <div className="mb-4">
            <h4 className="font-medium mb-3">Meeting Address</h4>
            
            <form.Field name="proposedStreetAddress">
              {(field) => (
                <fieldset className="mb-3">
                  <legend>Street Address</legend>
                  <input
                    className="input w-full"
                    placeholder="123 Main Street"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </fieldset>
              )}
            </form.Field>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <form.Field name="proposedCity">
                {(field) => (
                  <fieldset>
                    <legend>City</legend>
                    <input
                      className="input w-full"
                      placeholder="City"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </fieldset>
                )}
              </form.Field>

              <form.Field name="proposedState">
                {(field) => (
                  <fieldset>
                    <legend>State/Province</legend>
                    <input
                      className="input w-full"
                      placeholder="State"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </fieldset>
                )}
              </form.Field>

              <form.Field name="proposedZipCode">
                {(field) => (
                  <fieldset>
                    <legend>ZIP Code</legend>
                    <input
                      className="input w-full"
                      placeholder="12345"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </fieldset>
                )}
              </form.Field>
            </div>

            <form.Field name="proposedCountry">
              {(field) => (
                <fieldset className="mb-4">
                  <legend>Country</legend>
                  <input
                    className="input w-full"
                    placeholder="United States"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </fieldset>
              )}
            </form.Field>
          </div>

          <form.Field name="proposedMeetingTime">
            {(field) => (
              <fieldset className="mb-4">
                <legend>Meeting Time</legend>
                <input
                  type="datetime-local"
                  className="input w-full"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </fieldset>
            )}
          </form.Field>

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