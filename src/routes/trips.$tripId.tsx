import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Users, Plus, FileText, CheckCircle } from "lucide-react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/trips/$tripId")({
  loader: async ({ context: { queryClient }, params: { tripId } }) => {
    await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.trips.get, { id: tripId })),
      queryClient.ensureQueryData(convexQuery(api.outreach.list, { tripId })),
      queryClient.ensureQueryData(convexQuery(api.meetings.list, { tripId })),
      queryClient.ensureQueryData(convexQuery(api.outreach.getSummary, { tripId })),
    ]);
  },
  component: TripDetailsPage,
});

function TripDetailsPage() {
  const { tripId } = Route.useParams();
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId }));
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, { tripId }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId }));
  const { data: summary } = useSuspenseQuery(convexQuery(api.outreach.getSummary, { tripId }));

  if (!trip) {
    return <div>Trip not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1>{trip.name}</h1>
        {trip.description && <p className="text-lg opacity-80">{trip.description}</p>}
        {trip.startDate && (
          <div className="not-prose flex items-center justify-center gap-2 text-sm opacity-60 mt-2">
            <Calendar className="w-4 h-4" />
            {trip.startDate} {trip.endDate && `- ${trip.endDate}`}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="not-prose grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl">{summary.total}</div>
          <div className="stat-title">Total Outreach</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-warning">{summary.pending}</div>
          <div className="stat-title">Pending</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-success">{summary.interested}</div>
          <div className="stat-title">Interested</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-primary">{summary.meeting_scheduled}</div>
          <div className="stat-title">Meetings</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-error">{summary.not_interested + summary.no_response}</div>
          <div className="stat-title">No Interest</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="not-prose flex gap-2 justify-center">
        <Link to="/trips/$tripId/outreach/new" params={{ tripId }}>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Outreach
          </button>
        </Link>
        <Link to="/trips/$tripId/schedule" params={{ tripId }}>
          <button className="btn btn-secondary">
            <Calendar className="w-4 h-4" />
            View Schedule
          </button>
        </Link>
        <Link to="/trips/$tripId/summary" params={{ tripId }}>
          <button className="btn btn-outline">
            <FileText className="w-4 h-4" />
            Summary Report
          </button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Outreach */}
        <div className="not-prose">
          <h2 className="text-xl font-semibold mb-4">Recent Outreach</h2>
          {outreach.length === 0 ? (
            <div className="p-6 bg-base-200 rounded-lg text-center">
              <p className="opacity-70">No outreach recorded yet.</p>
              <Link to="/trips/$tripId/outreach/new" params={{ tripId }}>
                <button className="btn btn-primary btn-sm mt-2">Add First Outreach</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {outreach.slice(0, 5).map((item) => (
                <div key={item._id} className="p-4 bg-base-100 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.organization?.name}</h4>
                      <p className="text-sm opacity-70">{item.contact?.name}</p>
                      <p className="text-xs opacity-60">{item.outreachDate}</p>
                    </div>
                    <div className={`badge ${
                      item.response === 'meeting_scheduled' ? 'badge-success' :
                      item.response === 'interested' ? 'badge-info' :
                      item.response === 'pending' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {item.response.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
              {outreach.length > 5 && (
                <div className="text-center">
                  <Link to="/trips/$tripId/outreach" params={{ tripId }}>
                    <button className="btn btn-sm btn-ghost">View All Outreach</button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="not-prose">
          <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
          {meetings.length === 0 ? (
            <div className="p-6 bg-base-200 rounded-lg text-center">
              <p className="opacity-70">No meetings scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.filter(m => m.status !== 'cancelled').slice(0, 5).map((meeting) => (
                <div key={meeting._id} className="p-4 bg-base-100 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{meeting.title}</h4>
                      <p className="text-sm opacity-70">{meeting.organization?.name}</p>
                      <div className="flex items-center gap-1 text-xs opacity-60 mt-1">
                        <Calendar className="w-3 h-3" />
                        {meeting.scheduledDate} at {meeting.scheduledTime}
                      </div>
                      <div className="flex items-center gap-1 text-xs opacity-60">
                        <MapPin className="w-3 h-3" />
                        {meeting.address}
                      </div>
                    </div>
                    <div className={`badge ${
                      meeting.status === 'confirmed' ? 'badge-success' :
                      meeting.status === 'completed' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {meeting.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}