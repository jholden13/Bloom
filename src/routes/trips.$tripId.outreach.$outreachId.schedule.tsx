import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Calendar, MapPin, Clock, User, Building } from "lucide-react";
import { api } from "../../convex/_generated/api";

const meetingSchema = z.object({
  title: z.string().min(1, "Meeting title is required"),
  scheduledDate: z.string().min(1, "Meeting date is required"),
  scheduledTime: z.string().min(1, "Meeting time is required"),
  duration: z.number().min(15, "Meeting must be at least 15 minutes").optional(),
  address: z.string().min(1, "Meeting address is required"),
  notes: z.string().optional(),
});

export const Route = createFileRoute("/trips/$tripId/outreach/$outreachId/schedule")({
  loader: async ({ context: { queryClient }, params: { outreachId } }) => {
    await queryClient.ensureQueryData(convexQuery(api.outreach.list, {}));
  },
  component: ScheduleMeetingPage,
});

function ScheduleMeetingPage() {
  const { tripId, outreachId } = Route.useParams();
  const navigate = useNavigate();
  
  const { data: allOutreach } = useSuspenseQuery(convexQuery(api.outreach.list, {}));
  const createMeeting = useMutation(api.meetings.create);

  const outreach = allOutreach.find(o => o._id === outreachId);

  const form = useForm({
    defaultValues: {
      title: outreach ? `Meeting with ${outreach.organization?.name}` : "",
      scheduledDate: "",
      scheduledTime: "",
      duration: 60,
      address: "",
      notes: "",
    },
    validators: {
      onChange: meetingSchema,
    },
    onSubmit: async ({ value }) => {
      if (!outreach) return;

      await createMeeting({
        tripId,
        outreachId,
        contactId: outreach.contactId,
        organizationId: outreach.organizationId,
        title: value.title,
        scheduledDate: value.scheduledDate,
        scheduledTime: value.scheduledTime,
        duration: value.duration,
        address: value.address,
        notes: value.notes || undefined,
      });
      
      void navigate({ to: "/trips/$tripId/schedule", params: { tripId } });
    },
  });

  if (!outreach) {
    return <div>Outreach record not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="not-prose flex justify-center mb-4">
          <Calendar className="w-12 h-12 text-primary" />
        </div>
        <h1>Schedule Meeting</h1>
        <p className="opacity-70">Create a meeting from successful outreach</p>
      </div>

      {/* Contact Information */}
      <div className="not-prose p-4 bg-base-100 rounded-lg mb-6">
        <h3 className="font-semibold mb-3">Contact Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 opacity-60" />
              <span className="font-medium">{outreach.organization?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 opacity-60" />
              {outreach.contact?.name}
              {outreach.contact?.title && <span className="opacity-60">({outreach.contact.title})</span>}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="opacity-60">Email:</span> {outreach.contact?.email}
            </div>
            {outreach.contact?.phone && (
              <div className="text-sm">
                <span className="opacity-60">Phone:</span> {outreach.contact.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="not-prose space-y-4"
      >
        <form.Field name="title">
          {(field) => (
            <fieldset>
              <legend>Meeting Title</legend>
              <input
                className="input w-full"
                placeholder="e.g., Business discussion with [Company]"
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

        <div className="grid md:grid-cols-3 gap-4">
          <form.Field name="scheduledDate">
            {(field) => (
              <fieldset>
                <legend>Date</legend>
                <input
                  type="date"
                  className="input w-full"
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

          <form.Field name="scheduledTime">
            {(field) => (
              <fieldset>
                <legend>Time</legend>
                <input
                  type="time"
                  className="input w-full"
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

          <form.Field name="duration">
            {(field) => (
              <fieldset>
                <legend>Duration (minutes)</legend>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="60"
                  min="15"
                  max="480"
                  value={field.state.value || ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.valueAsNumber || undefined)}
                />
                {!field.state.meta.isValid && (
                  <em className="text-error text-sm">
                    {field.state.meta.errors.map(e => e.message).join(", ")}
                  </em>
                )}
              </fieldset>
            )}
          </form.Field>
        </div>

        <form.Field name="address">
          {(field) => (
            <fieldset>
              <legend>Meeting Address</legend>
              <textarea
                className="textarea w-full"
                placeholder="Enter the full meeting address or location details"
                rows={3}
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
              <legend>Meeting Notes</legend>
              <textarea
                className="textarea w-full"
                placeholder="Any additional notes about the meeting..."
                rows={3}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </fieldset>
          )}
        </form.Field>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={!form.state.canSubmit || form.state.isSubmitting}
            className="btn btn-primary"
          >
            {form.state.isSubmitting ? "Scheduling..." : "Schedule Meeting"}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/trips/$tripId/outreach", params: { tripId } })}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}