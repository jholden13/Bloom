import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Calendar, MapPin, Plus, Pencil, Users, ArrowLeft } from "lucide-react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/trips/$tripId/meetings")({
  component: TripMeetingsPage,
  loader: async ({ context: { queryClient }, params }) => {
    const tripId = params.tripId as any;
    
    const [trip, meetings, outreach] = await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.trips.get, { id: tripId })),
      queryClient.ensureQueryData(convexQuery(api.meetings.list, { tripId })),
      queryClient.ensureQueryData(convexQuery(api.outreach.list, { tripId })),
    ]);

    return { trip, meetings, outreach };
  },
});

function TripMeetingsPage() {
  const { tripId } = Route.useParams();
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId as any }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId: tripId as any }));
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, { tripId: tripId as any }));

  if (!trip) {
    return <div>Loading...</div>;
  }

  return (
    <div className="prose prose-invert max-w-none">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          to="/trips/$tripId" 
          params={{ tripId }}
          className="btn btn-ghost btn-sm no-underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trip
        </Link>
        <div>
          <h1 className="text-2xl font-bold mb-1">{trip.name}</h1>
          <h2 className="text-xl text-base-content/70 mt-0">Meetings & Outreach</h2>
        </div>
      </div>

      <MeetingsSection tripId={tripId} meetings={meetings} outreach={outreach} />
    </div>
  );
}

function MeetingEditCard({ meeting, onSave, onCancel, updateMeeting }: any) {
  const [editData, setEditData] = useState({
    title: meeting.title,
    scheduledDate: meeting.scheduledDate,
    scheduledTime: meeting.scheduledTime,
    duration: meeting.duration || "",
    address: meeting.address,
    notes: meeting.notes || "",
  });

  const handleSave = async () => {
    await updateMeeting({
      id: meeting._id,
      title: editData.title,
      scheduledDate: editData.scheduledDate,
      scheduledTime: editData.scheduledTime,
      duration: editData.duration ? parseInt(editData.duration) : undefined,
      address: editData.address,
      notes: editData.notes,
    });
    onSave();
  };

  return (
    <div className="space-y-3">
      <input
        className="input input-sm w-full"
        placeholder="Meeting title"
        value={editData.title}
        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          className="input input-sm"
          value={editData.scheduledDate}
          onChange={(e) => setEditData({ ...editData, scheduledDate: e.target.value })}
        />
        <input
          type="time"
          className="input input-sm"
          value={editData.scheduledTime}
          onChange={(e) => setEditData({ ...editData, scheduledTime: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          className="input input-sm"
          placeholder="Duration (minutes)"
          value={editData.duration}
          onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
        />
        <input
          className="input input-sm"
          placeholder="Address"
          value={editData.address}
          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
        />
      </div>
      <textarea
        className="textarea textarea-sm"
        placeholder="Notes (optional)"
        value={editData.notes}
        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
        rows={2}
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="btn btn-ghost btn-xs">
          Cancel
        </button>
        <button onClick={() => void handleSave()} className="btn btn-primary btn-xs">
          Save
        </button>
      </div>
    </div>
  );
}

function MeetingsSection({ tripId, meetings, outreach }: { tripId: string; meetings: any[]; outreach: any[] }) {
  const [editingMeeting, setEditingMeeting] = useState<string | null>(null);
  const [showAddMeetingForm, setShowAddMeetingForm] = useState(false);

  const updateMeeting = useMutation(api.meetings.update);

  const outreachCounts = {
    pending: outreach.filter(o => o.response === "pending").length,
    interested: outreach.filter(o => o.response === "interested").length,
    not_interested: outreach.filter(o => o.response === "not_interested").length,
    no_response: outreach.filter(o => o.response === "no_response").length,
    meeting_scheduled: outreach.filter(o => o.response === "meeting_scheduled").length,
  };

  return (
    <div className="not-prose">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <button
            onClick={() => setShowAddMeetingForm(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Add Meeting
          </button>
          <Link 
            to="/add-outreach" 
            search={{ tripId }} 
            className="btn btn-outline btn-sm no-underline"
          >
            <Plus className="w-4 h-4" />
            Add Outreach
          </Link>
        </div>
      </div>

      {/* Add Meeting Form */}
      {showAddMeetingForm && (
        <div className="card bg-base-100 shadow mb-4">
          <div className="card-body">
            <h3 className="card-title">Add Meeting</h3>
            <div className="alert alert-info mb-4">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <h3 className="font-bold">How to add meetings</h3>
                  <div className="text-sm">
                    Meetings are created through the outreach process:
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Create outreach to contacts/organizations</li>
                      <li>When they respond positively, schedule a meeting</li>
                      <li>The meeting will appear here automatically</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-actions justify-end">
              <button onClick={() => setShowAddMeetingForm(false)} className="btn btn-ghost btn-sm">
                Got it
              </button>
              <Link to="/add-outreach" search={{ tripId }} className="btn btn-primary btn-sm no-underline">
                Create Outreach
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Outreach Status Bar */}
      {outreach.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Outreach Status</h3>
          <div className="flex rounded-lg overflow-hidden h-2">
            {outreachCounts.pending > 0 && (
              <div 
                className="bg-warning" 
                style={{ width: `${(outreachCounts.pending / outreach.length) * 100}%` }}
                title={`${outreachCounts.pending} pending`}
              />
            )}
            {outreachCounts.interested > 0 && (
              <div 
                className="bg-info" 
                style={{ width: `${(outreachCounts.interested / outreach.length) * 100}%` }}
                title={`${outreachCounts.interested} interested`}
              />
            )}
            {outreachCounts.not_interested > 0 && (
              <div 
                className="bg-neutral" 
                style={{ width: `${(outreachCounts.not_interested / outreach.length) * 100}%` }}
                title={`${outreachCounts.not_interested} not interested`}
              />
            )}
            {outreachCounts.no_response > 0 && (
              <div 
                className="bg-error" 
                style={{ width: `${(outreachCounts.no_response / outreach.length) * 100}%` }}
                title={`${outreachCounts.no_response} no response`}
              />
            )}
            {outreachCounts.meeting_scheduled > 0 && (
              <div 
                className="bg-success" 
                style={{ width: `${(outreachCounts.meeting_scheduled / outreach.length) * 100}%` }}
                title={`${outreachCounts.meeting_scheduled} meeting scheduled`}
              />
            )}
          </div>
          <div className="flex justify-between text-xs mt-1 opacity-70">
            <span>Pending: {outreachCounts.pending}</span>
            <span>Interested: {outreachCounts.interested}</span>
            <span>Not Interested: {outreachCounts.not_interested}</span>
            <span>No Response: {outreachCounts.no_response}</span>
            <span>Meeting Scheduled: {outreachCounts.meeting_scheduled}</span>
          </div>
        </div>
      )}

      {/* Meetings List */}
      {meetings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Meetings</h3>
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <div key={meeting._id} className="p-4 bg-base-100 rounded-lg">
                {editingMeeting === meeting._id ? (
                  <MeetingEditCard 
                    meeting={meeting} 
                    onSave={() => setEditingMeeting(null)}
                    onCancel={() => setEditingMeeting(null)}
                    updateMeeting={updateMeeting}
                  />
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        <h4 className="font-medium text-lg">{meeting.title}</h4>
                        <div className={`badge badge-sm ${
                          meeting.status === 'scheduled' ? 'badge-warning' :
                          meeting.status === 'confirmed' ? 'badge-info' :
                          meeting.status === 'completed' ? 'badge-success' :
                          'badge-error'
                        }`}>
                          {meeting.status}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm opacity-70">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {meeting.scheduledDate} at {meeting.scheduledTime}
                          {meeting.duration && ` (${meeting.duration} min)`}
                        </div>
                        {meeting.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {meeting.address}
                            {meeting.city && `, ${meeting.city}`}
                          </div>
                        )}
                        {meeting.contact && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {meeting.contact.name} ({meeting.contact.email})
                            {meeting.organization && ` • ${meeting.organization.name}`}
                          </div>
                        )}
                        {meeting.notes && <p className="mt-1">{meeting.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingMeeting(meeting._id)}
                        className="btn btn-ghost btn-xs"
                        title="Edit meeting"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outreach List */}
      {outreach.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Outreach</h3>
          <div className="space-y-3">
            {outreach.map((item) => (
              <div key={item._id} className="p-4 bg-base-100 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`badge badge-sm ${
                        item.response === 'pending' ? 'badge-warning' :
                        item.response === 'interested' ? 'badge-info' :
                        item.response === 'not_interested' ? 'badge-neutral' :
                        item.response === 'no_response' ? 'badge-error' :
                        'badge-success'
                      }`}>
                        {item.response.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm opacity-70">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Reached out on {item.outreachDate}
                      </div>
                      {item.contact && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {item.contact.name} ({item.contact.email})
                          {item.organization && ` • ${item.organization.name}`}
                        </div>
                      )}
                      {item.proposedAddress && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.proposedAddress}
                          {item.proposedCity && `, ${item.proposedCity}`}
                        </div>
                      )}
                      {item.notes && <p className="mt-1">{item.notes}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {meetings.length === 0 && outreach.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No meetings or outreach yet</h3>
          <p className="text-base-content/70 mb-4">
            Start by creating outreach to contacts and organizations for this trip.
          </p>
          <Link 
            to="/add-outreach" 
            search={{ tripId }} 
            className="btn btn-primary no-underline"
          >
            <Plus className="w-4 h-4" />
            Create Outreach
          </Link>
        </div>
      )}
    </div>
  );
}