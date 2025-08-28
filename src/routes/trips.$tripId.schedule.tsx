import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Calendar, MapPin, Clock, User, Building, CheckCircle, X } from "lucide-react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/trips/$tripId/schedule")({
  loader: async ({ context: { queryClient }, params: { tripId } }) => {
    await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.trips.get, { id: tripId })),
      queryClient.ensureQueryData(convexQuery(api.meetings.list, { tripId })),
    ]);
  },
  component: SchedulePage,
});

function SchedulePage() {
  const { tripId } = Route.useParams();
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId }));
  const updateMeetingStatus = useMutation(api.meetings.updateStatus);

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const groupedByDate = meetings.reduce((acc, meeting) => {
    if (meeting.status === 'cancelled') return acc;
    
    const date = meeting.scheduledDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(meeting);
    return acc;
  }, {} as Record<string, typeof meetings>);

  const sortedDates = Object.keys(groupedByDate).sort();

  const handleStatusUpdate = async (meetingId: string, status: "confirmed" | "completed" | "cancelled") => {
    await updateMeetingStatus({ id: meetingId, status });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1>Meeting Schedule</h1>
        <h2 className="text-xl opacity-80">{trip.name}</h2>
        {trip.startDate && (
          <div className="not-prose flex items-center justify-center gap-2 text-sm opacity-60 mt-2">
            <Calendar className="w-4 h-4" />
            {trip.startDate} {trip.endDate && `- ${trip.endDate}`}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl">{meetings.filter(m => m.status !== 'cancelled').length}</div>
          <div className="stat-title">Total Meetings</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-warning">{meetings.filter(m => m.status === 'scheduled').length}</div>
          <div className="stat-title">Scheduled</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-success">{meetings.filter(m => m.status === 'confirmed').length}</div>
          <div className="stat-title">Confirmed</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-info">{meetings.filter(m => m.status === 'completed').length}</div>
          <div className="stat-title">Completed</div>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="not-prose text-center">
          <div className="p-8 bg-base-200 rounded-lg">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg opacity-70 mb-4">No meetings scheduled yet.</p>
            <p className="opacity-60 mb-4">Start by adding outreach and scheduling meetings when contacts respond positively.</p>
            <Link to="/trips/$tripId" params={{ tripId }}>
              <button className="btn btn-primary">Back to Trip</button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date} className="not-prose">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              
              <div className="space-y-4">
                {groupedByDate[date].map((meeting) => (
                  <div key={meeting._id} className="card bg-base-100 shadow">
                    <div className="card-body">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="card-title text-lg">{meeting.title}</h4>
                          
                          <div className="grid md:grid-cols-2 gap-4 mt-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Building className="w-4 h-4 opacity-60" />
                                <span>{meeting.organization?.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 opacity-60" />
                                <span>{meeting.contact?.name}</span>
                                {meeting.contact?.title && (
                                  <span className="opacity-60">({meeting.contact.title})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 opacity-60" />
                                <span>{meeting.scheduledTime}</span>
                                {meeting.duration && (
                                  <span className="opacity-60">({meeting.duration} min)</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 opacity-60 mt-0.5" />
                                <span>{meeting.address}</span>
                              </div>
                              {meeting.notes && (
                                <div className="text-sm opacity-70">
                                  <strong>Notes:</strong> {meeting.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className={`badge ${
                            meeting.status === 'confirmed' ? 'badge-success' :
                            meeting.status === 'completed' ? 'badge-info' :
                            meeting.status === 'cancelled' ? 'badge-error' :
                            'badge-warning'
                          }`}>
                            {meeting.status}
                          </div>
                          
                          <div className="flex gap-1">
                            {meeting.status === 'scheduled' && (
                              <button
                                className="btn btn-xs btn-success"
                                onClick={() => handleStatusUpdate(meeting._id, 'confirmed')}
                              >
                                <CheckCircle className="w-3 h-3" />
                                Confirm
                              </button>
                            )}
                            {meeting.status === 'confirmed' && (
                              <button
                                className="btn btn-xs btn-info"
                                onClick={() => handleStatusUpdate(meeting._id, 'completed')}
                              >
                                <CheckCircle className="w-3 h-3" />
                                Complete
                              </button>
                            )}
                            {(meeting.status === 'scheduled' || meeting.status === 'confirmed') && (
                              <button
                                className="btn btn-xs btn-error"
                                onClick={() => handleStatusUpdate(meeting._id, 'cancelled')}
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="not-prose text-center">
        <Link to="/trips/$tripId" params={{ tripId }}>
          <button className="btn btn-ghost">Back to Trip Overview</button>
        </Link>
      </div>
    </div>
  );
}