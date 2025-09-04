import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Calendar, MapPin, Plus, Pencil, Users, ArrowLeft, Trash2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { z } from "zod";

const meetingsSearchSchema = z.object({
  tripId: z.string(),
});

export const Route = createFileRoute("/meetings")({
  component: MeetingsPage,
  validateSearch: meetingsSearchSchema,
  loaderDeps: ({ search }) => ({ tripId: search?.tripId }),
  loader: async ({ context: { queryClient }, deps }) => {
    const tripId = deps?.tripId;
    
    if (!tripId) {
      throw new Error("Trip ID is required");
    }
    
    try {
      const [trip, meetings, outreach, contacts, organizations] = await Promise.all([
        queryClient.ensureQueryData(convexQuery(api.trips.get, { id: tripId as any })),
        queryClient.ensureQueryData(convexQuery(api.meetings.list, { tripId: tripId as any })),
        queryClient.ensureQueryData(convexQuery(api.outreach.list, { tripId: tripId as any })),
        queryClient.ensureQueryData(convexQuery(api.contacts.list, {})),
        queryClient.ensureQueryData(convexQuery(api.organizations.list, {})),
      ]);

      return { trip, meetings, outreach, contacts, organizations };
    } catch (error) {
      console.error("Error loading meetings data:", error);
      throw error;
    }
  },
});

function MeetingsPage() {
  const search = Route.useSearch();
  const tripId = search.tripId;
  
  if (!tripId) {
    return (
      <div className="prose prose-invert max-w-none">
        <div className="alert alert-error">
          <h3>Missing Trip ID</h3>
          <p>No trip ID provided. Please navigate from a specific trip page.</p>
          <Link to="/" className="btn btn-primary">Go to Home</Link>
        </div>
      </div>
    );
  }

  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId as any }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId: tripId as any }));
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, { tripId: tripId as any }));
  const { data: contacts } = useSuspenseQuery(convexQuery(api.contacts.list, {}));
  const { data: organizations } = useSuspenseQuery(convexQuery(api.organizations.list, {}));

  if (!trip) {
    return <div>Trip not found...</div>;
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

      <MeetingsSection tripId={tripId} meetings={meetings} outreach={outreach} contacts={contacts} organizations={organizations} />
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

function OutreachEditCard({ outreach, onSave, onCancel, updateOutreach, contacts, organizations }: any) {
  const [editData, setEditData] = useState({
    companyName: outreach.organization?.name || "",
    personName: outreach.contact?.name || "",
    personEmail: outreach.contact?.email || "",
    meetingDate: outreach.proposedMeetingTime ? outreach.proposedMeetingTime.split('T')[0] : "",
    meetingTime: outreach.proposedMeetingTime ? new Date(outreach.proposedMeetingTime).toTimeString().split(' ')[0].slice(0, 5) : "",
    notes: outreach.notes || "",
    proposedAddress: outreach.proposedAddress || "",
    proposedStreetAddress: outreach.proposedStreetAddress || "",
    proposedCity: outreach.proposedCity || "",
    proposedState: outreach.proposedState || "",
    proposedCountry: outreach.proposedCountry || "",
    proposedZipCode: outreach.proposedZipCode || "",
  });

  const updateContact = useMutation(api.contacts.update);
  const updateOrganization = useMutation(api.organizations.update);



  const handleSave = async () => {
    // Update the organization name if changed
    if (editData.companyName && editData.companyName !== outreach.organization?.name) {
      await updateOrganization({
        id: outreach.organizationId,
        name: editData.companyName,
      });
    }

    // Update the contact name and email if changed
    if (editData.personName !== outreach.contact?.name || editData.personEmail !== outreach.contact?.email) {
      await updateContact({
        id: outreach.contactId,
        name: editData.personName || undefined,
        email: editData.personEmail || undefined,
      });
    }

    // Combine date and time into proposedMeetingTime if both are provided
    let proposedMeetingTime;
    if (editData.meetingDate && editData.meetingTime) {
      proposedMeetingTime = `${editData.meetingDate}T${editData.meetingTime}:00`;
    }

    // Update the outreach record
    await updateOutreach({
      id: outreach._id,
      notes: editData.notes || undefined,
      proposedAddress: editData.proposedAddress || undefined,
      proposedStreetAddress: editData.proposedStreetAddress || undefined,
      proposedCity: editData.proposedCity || undefined,
      proposedState: editData.proposedState || undefined,
      proposedCountry: editData.proposedCountry || undefined,
      proposedZipCode: editData.proposedZipCode || undefined,
      proposedMeetingTime: proposedMeetingTime || undefined,
    });
    onSave();
  };

  return (
    <div className="space-y-3">
      {/* Company and Person Information */}
      <div className="space-y-2">
        <input
          className="input input-sm w-full"
          placeholder="Company Name"
          value={editData.companyName}
          onChange={(e) => setEditData({ ...editData, companyName: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input input-sm"
            placeholder="Person Name"
            value={editData.personName}
            onChange={(e) => setEditData({ ...editData, personName: e.target.value })}
          />
          <input
            className="input input-sm"
            placeholder="Email Address"
            value={editData.personEmail}
            onChange={(e) => setEditData({ ...editData, personEmail: e.target.value })}
          />
        </div>
      </div>

      {/* Meeting Date and Time */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium text-base-content/70">Meeting Date</label>
          <input
            type="date"
            className="input input-sm w-full"
            value={editData.meetingDate}
            onChange={(e) => setEditData({ ...editData, meetingDate: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-base-content/70">Meeting Time</label>
          <input
            type="time"
            className="input input-sm w-full"
            value={editData.meetingTime}
            onChange={(e) => setEditData({ ...editData, meetingTime: e.target.value })}
          />
        </div>
      </div>

      {/* Address Fields */}
      <div className="space-y-2">
        <input
          className="input input-sm w-full"
          placeholder="Address"
          value={editData.proposedAddress}
          onChange={(e) => setEditData({ ...editData, proposedAddress: e.target.value })}
        />
        <input
          className="input input-sm w-full"
          placeholder="Street Address"
          value={editData.proposedStreetAddress}
          onChange={(e) => setEditData({ ...editData, proposedStreetAddress: e.target.value })}
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            className="input input-sm"
            placeholder="City"
            value={editData.proposedCity}
            onChange={(e) => setEditData({ ...editData, proposedCity: e.target.value })}
          />
          <input
            className="input input-sm"
            placeholder="State"
            value={editData.proposedState}
            onChange={(e) => setEditData({ ...editData, proposedState: e.target.value })}
          />
          <input
            className="input input-sm"
            placeholder="ZIP Code"
            value={editData.proposedZipCode}
            onChange={(e) => setEditData({ ...editData, proposedZipCode: e.target.value })}
          />
        </div>
        <input
          className="input input-sm w-full"
          placeholder="Country"
          value={editData.proposedCountry}
          onChange={(e) => setEditData({ ...editData, proposedCountry: e.target.value })}
        />
      </div>


      {/* Notes */}
      <textarea
        className="textarea textarea-sm"
        placeholder="Notes"
        value={editData.notes}
        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
        rows={3}
      />

      {/* Action Buttons */}
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

function MeetingsSection({ tripId, meetings, outreach, contacts, organizations }: { tripId: string; meetings: any[]; outreach: any[]; contacts: any[]; organizations: any[] }) {
  const [editingMeeting, setEditingMeeting] = useState<string | null>(null);
  const [editingOutreach, setEditingOutreach] = useState<string | null>(null);

  // Helper function to generate Google Maps URL
  const generateGoogleMapsUrl = (address: string, city?: string, state?: string, country?: string) => {
    const fullAddress = [address, city, state, country].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
  };

  const updateMeeting = useMutation(api.meetings.update);
  const updateOutreach = useMutation(api.outreach.update);
  const updateOutreachResponse = useMutation(api.outreach.updateResponse);
  const deleteOutreach = useMutation(api.outreach.deleteOutreach);
  const syncMeetingsFromOutreach = useMutation(api.meetings.syncMeetingsFromOutreach);
  const deleteMeetingsByOutreach = useMutation(api.meetings.deleteByOutreach);

  const outreachCounts = {
    pending: outreach.filter(o => o.response === "pending").length,
    interested: outreach.filter(o => o.response === "interested").length,
    not_interested: outreach.filter(o => o.response === "not_interested").length,
    no_response: outreach.filter(o => o.response === "no_response").length,
    meeting_scheduled: outreach.filter(o => o.response === "meeting_scheduled").length,
  };

  const handleSyncMeetings = async () => {
    try {
      const createdMeetings = await syncMeetingsFromOutreach({ tripId: tripId as any });
      if (createdMeetings.length > 0) {
        alert(`Successfully created ${createdMeetings.length} meetings in your trip itinerary!`);
      } else {
        alert("No new meetings to sync - all meeting_scheduled outreach items already have meetings.");
      }
    } catch (error) {
      console.error("Failed to sync meetings:", error);
      alert("Failed to sync meetings. Please try again.");
    }
  };

  const handleStatusChange = async (outreachId: string, newStatus: string) => {
    try {
      // Find the current outreach item to check its current status
      const currentOutreach = outreach.find(o => o._id === outreachId);
      const wasScheduled = currentOutreach?.response === "meeting_scheduled";
      const isScheduled = newStatus === "meeting_scheduled";
      
      // If changing FROM "meeting_scheduled" TO something else, delete associated meeting
      if (wasScheduled && !isScheduled) {
        await deleteMeetingsByOutreach({ outreachId: outreachId as any });
        console.log("Deleted meeting associated with outreach");
      }
      
      // Update the outreach status
      await updateOutreachResponse({
        id: outreachId as any,
        response: newStatus as any,
        responseDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error("Failed to update outreach status:", error);
    }
  };

  return (
    <div className="not-prose">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
          <Link 
            to="/add-outreach" 
            search={{ tripId }} 
            className="btn btn-primary btn-sm no-underline"
          >
            <Plus className="w-4 h-4" />
            Add Outreach
          </Link>
          <button
            onClick={() => void handleSyncMeetings()}
            className="btn btn-secondary btn-sm"
            title="Sync meetings from meeting_scheduled outreach"
          >
            <Calendar className="w-4 h-4" />
            Sync Meetings
          </button>
        </div>
      </div>


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


      {/* Outreach List */}
      {outreach.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Outreach</h3>
          <div className="space-y-3">
            {outreach.map((item) => (
              <div key={item._id} className="p-4 bg-base-100 rounded-lg">
                {editingOutreach === item._id ? (
                  <OutreachEditCard 
                    outreach={item} 
                    onSave={() => setEditingOutreach(null)}
                    onCancel={() => setEditingOutreach(null)}
                    updateOutreach={updateOutreach}
                    contacts={contacts}
                    organizations={organizations}
                  />
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={item.response}
                          onChange={(e) => void handleStatusChange(item._id, e.target.value)}
                          className={`select select-xs ${
                            item.response === 'pending' ? 'select-warning' :
                            item.response === 'interested' ? 'select-info' :
                            item.response === 'not_interested' ? 'select-neutral' :
                            item.response === 'no_response' ? 'select-error' :
                            'select-success'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="interested">Interested</option>
                          <option value="not_interested">Not Interested</option>
                          <option value="no_response">No Response</option>
                          <option value="meeting_scheduled">Meeting Scheduled</option>
                        </select>
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
                        {(item.proposedAddress || item.proposedStreetAddress) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <a 
                              href={generateGoogleMapsUrl(
                                item.proposedStreetAddress || item.proposedAddress, 
                                item.proposedCity, 
                                item.proposedState, 
                                item.proposedCountry
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {item.proposedStreetAddress || item.proposedAddress}
                              {item.proposedCity && `, ${item.proposedCity}`}
                              {item.proposedState && `, ${item.proposedState}`}
                              {item.proposedZipCode && ` ${item.proposedZipCode}`}
                            </a>
                          </div>
                        )}
                        {item.proposedMeetingTime && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Proposed time: {item.proposedMeetingTime}
                          </div>
                        )}
                        {item.notes && <p className="mt-1">{item.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingOutreach(item._id)}
                        className="btn btn-ghost btn-xs"
                        title="Edit outreach"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => void deleteOutreach({ id: item._id })}
                        className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                        title="Delete outreach"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
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