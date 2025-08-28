import { useMutation } from "convex/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

const outreachSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  organizationWebsite: z.string().optional(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactTitle: z.string().optional(),
  contactPhone: z.string().optional(),
  outreachDate: z.string().min(1, "Outreach date is required"),
  notes: z.string().optional(),
});

export const Route = createFileRoute("/trips/$tripId/outreach/new")({
  component: NewOutreachPage,
});

function NewOutreachPage() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createOrganization = useMutation(api.organizations.create);
  const createContact = useMutation(api.contacts.create);
  const createOutreach = useMutation(api.outreach.create);

  const form = useForm({
    defaultValues: {
      organizationName: "",
      organizationWebsite: "",
      contactName: "",
      contactEmail: "",
      contactTitle: "",
      contactPhone: "",
      outreachDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
    validators: {
      onChange: outreachSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        // Create organization first
        const organizationId = await createOrganization({
          name: value.organizationName,
          website: value.organizationWebsite || undefined,
        });

        // Create contact
        const contactId = await createContact({
          organizationId,
          name: value.contactName,
          email: value.contactEmail,
          title: value.contactTitle || undefined,
          phone: value.contactPhone || undefined,
        });

        // Create outreach record
        await createOutreach({
          tripId,
          contactId,
          organizationId,
          outreachDate: value.outreachDate,
          notes: value.notes || undefined,
        });

        void navigate({ to: "/trips/$tripId", params: { tripId } });
      } catch (error) {
        console.error("Error creating outreach:", error);
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1>Add New Outreach</h1>
      <p className="opacity-70 mb-6">Record a new outreach attempt for this trip.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="not-prose space-y-6"
      >
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
                />
                {!field.state.meta.isValid && (
                  <em className="text-error text-sm">
                    {field.state.meta.errors.map(e => e.message).join(", ")}
                  </em>
                )}
              </fieldset>
            )}
          </form.Field>

          <form.Field name="organizationWebsite">
            {(field) => (
              <fieldset>
                <legend>Website</legend>
                <input
                  className="input w-full"
                  placeholder="https://company.com"
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
          
          <div className="grid md:grid-cols-2 gap-4">
            <form.Field name="contactName">
              {(field) => (
                <fieldset>
                  <legend>Contact Name *</legend>
                  <input
                    className="input w-full"
                    placeholder="Full name"
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

            <form.Field name="contactTitle">
              {(field) => (
                <fieldset>
                  <legend>Title/Position</legend>
                  <input
                    className="input w-full"
                    placeholder="e.g., CEO, Manager"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </fieldset>
              )}
            </form.Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
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
                  />
                  {!field.state.meta.isValid && (
                    <em className="text-error text-sm">
                      {field.state.meta.errors.map(e => e.message).join(", ")}
                    </em>
                  )}
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

        {/* Outreach Details */}
        <div className="p-4 bg-base-100 rounded-lg">
          <h3 className="font-semibold mb-4">Outreach Details</h3>
          
          <form.Field name="outreachDate">
            {(field) => (
              <fieldset className="mb-4">
                <legend>Outreach Date *</legend>
                <input
                  type="date"
                  className="input w-full md:w-auto"
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
            disabled={!form.state.canSubmit || isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? "Creating..." : "Record Outreach"}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/trips/$tripId", params: { tripId } })}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}