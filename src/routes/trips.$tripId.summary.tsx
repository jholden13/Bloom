import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Calendar, MapPin, Building, User, Mail, Phone, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/trips/$tripId/summary")({
  loader: async ({ context: { queryClient }, params: { tripId } }) => {
    await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.trips.get, { id: tripId })),
      queryClient.ensureQueryData(convexQuery(api.outreach.list, { tripId })),
      queryClient.ensureQueryData(convexQuery(api.meetings.list, { tripId })),
      queryClient.ensureQueryData(convexQuery(api.outreach.getSummary, { tripId })),
    ]);
  },
  component: SummaryPage,
});

function SummaryPage() {
  const { tripId } = Route.useParams();
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId }));
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, { tripId }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId }));
  const { data: summary } = useSuspenseQuery(convexQuery(api.outreach.getSummary, { tripId }));

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const confirmedMeetings = meetings.filter(m => m.status !== 'cancelled');
  const completedMeetings = meetings.filter(m => m.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="not-prose flex justify-center mb-4">
          <FileText className="w-16 h-16 text-primary" />
        </div>
        <h1>Trip Summary Report</h1>
        <h2 className="text-xl opacity-80">{trip.name}</h2>
        {trip.description && <p className="opacity-70">{trip.description}</p>}
        {trip.startDate && (
          <div className="not-prose flex items-center justify-center gap-2 text-sm opacity-60 mt-2">
            <Calendar className="w-4 h-4" />
            {trip.startDate} {trip.endDate && `- ${trip.endDate}`}
          </div>
        )}
      </div>

      {/* Executive Summary */}
      <div className="not-prose p-6 bg-base-100 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Executive Summary</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{summary.total}</div>
            <div className="text-sm opacity-70">Total Outreach Attempts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success">{confirmedMeetings.length}</div>
            <div className="text-sm opacity-70">Meetings Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-info">{completedMeetings.length}</div>
            <div className="text-sm opacity-70">Meetings Completed</div>
          </div>
        </div>
        
        {summary.total > 0 && (
          <div className="mt-4 p-4 bg-base-200 rounded">
            <div className="text-sm">
              <strong>Success Rate:</strong> {((confirmedMeetings.length / summary.total) * 100).toFixed(1)}% meeting conversion rate
            </div>
          </div>
        )}
      </div>

      {/* Outreach Breakdown */}
      <div className="not-prose">
        <h3 className="text-xl font-semibold mb-4">Outreach Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="stat bg-base-100 rounded-lg">
            <div className="stat-value text-lg text-warning">{summary.pending}</div>
            <div className="stat-title">Pending</div>
          </div>
          <div className="stat bg-base-100 rounded-lg">
            <div className="stat-value text-lg text-info">{summary.interested}</div>
            <div className="stat-title">Interested</div>
          </div>
          <div className="stat bg-base-100 rounded-lg">
            <div className="stat-value text-lg text-success">{summary.meeting_scheduled}</div>
            <div className="stat-title">Meetings</div>
          </div>
          <div className="stat bg-base-100 rounded-lg">
            <div className="stat-value text-lg text-error">{summary.not_interested}</div>
            <div className="stat-title">Not Interested</div>
          </div>
          <div className="stat bg-base-100 rounded-lg">
            <div className="stat-value text-lg text-neutral">{summary.no_response}</div>
            <div className="stat-title">No Response</div>
          </div>
        </div>

        {/* Detailed Outreach List */}
        {outreach.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Contact</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {outreach.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="font-medium">{item.organization?.name}</div>
                      {item.organization?.website && (
                        <div className="text-xs opacity-60">{item.organization.website}</div>
                      )}
                    </td>
                    <td>
                      <div>{item.contact?.name}</div>
                      {item.contact?.title && (
                        <div className="text-xs opacity-60">{item.contact.title}</div>
                      )}
                      <div className="text-xs opacity-60">{item.contact?.email}</div>
                    </td>
                    <td className="text-sm">{item.outreachDate}</td>
                    <td>
                      <div className={`badge badge-sm ${
                        item.response === 'meeting_scheduled' ? 'badge-success' :
                        item.response === 'interested' ? 'badge-info' :
                        item.response === 'pending' ? 'badge-warning' :
                        item.response === 'not_interested' ? 'badge-error' :
                        'badge-neutral'
                      }`}>
                        {item.response.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="text-sm max-w-xs truncate">
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Meeting Schedule */}
      {confirmedMeetings.length > 0 && (
        <div className="not-prose">
          <h3 className="text-xl font-semibold mb-4">Final Meeting Schedule</h3>
          <div className="space-y-4">
            {confirmedMeetings
              .sort((a, b) => `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(`${b.scheduledDate} ${b.scheduledTime}`))
              .map((meeting) => (
                <div key={meeting._id} className="p-4 bg-base-100 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{meeting.title}</h4>
                      <div className="grid md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="w-4 h-4 opacity-60" />
                            {meeting.organization?.name}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 opacity-60" />
                            {meeting.contact?.name}
                            {meeting.contact?.title && ` (${meeting.contact.title})`}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 opacity-60" />
                            {meeting.scheduledDate} at {meeting.scheduledTime}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 opacity-60 mt-0.5" />
                            {meeting.address}
                          </div>
                          {meeting.contact?.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 opacity-60" />
                              {meeting.contact.phone}
                            </div>
                          )}
                          {meeting.contact?.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 opacity-60" />
                              {meeting.contact.email}
                            </div>
                          )}
                        </div>
                      </div>
                      {meeting.notes && (
                        <div className="mt-2 text-sm opacity-70">
                          <strong>Notes:</strong> {meeting.notes}
                        </div>
                      )}
                    </div>
                    <div className={`badge ${
                      meeting.status === 'completed' ? 'badge-info' :
                      meeting.status === 'confirmed' ? 'badge-success' :
                      'badge-warning'
                    }`}>
                      {meeting.status}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="not-prose p-4 bg-warning/10 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Follow-up Actions
        </h3>
        <ul className="space-y-1 text-sm">
          {summary.pending > 0 && (
            <li>• Follow up with {summary.pending} pending outreach attempts</li>
          )}
          {meetings.filter(m => m.status === 'scheduled').length > 0 && (
            <li>• Confirm {meetings.filter(m => m.status === 'scheduled').length} scheduled meetings</li>
          )}
          {meetings.filter(m => m.status === 'confirmed').length > 0 && (
            <li>• Attend {meetings.filter(m => m.status === 'confirmed').length} confirmed meetings</li>
          )}
        </ul>
      </div>

      <div className="not-prose text-center space-x-2">
        <Link to="/trips/$tripId" params={{ tripId }}>
          <button className="btn btn-primary">Back to Trip</button>
        </Link>
        <Link to="/trips/$tripId/schedule" params={{ tripId }}>
          <button className="btn btn-outline">View Schedule</button>
        </Link>
      </div>
    </div>
  );
}