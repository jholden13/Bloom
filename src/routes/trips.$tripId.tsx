import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Calendar, MapPin, Users, Plus, FileText, CheckCircle, Trash2, ChevronDown, Edit, Pencil } from "lucide-react";
import { api } from "../../convex/_generated/api";

// Helper function to format address for Google Maps and display
const formatAddress = (item: any) => {
  // Check for new structured address fields first
  if (item.proposedStreetAddress || item.streetAddress) {
    const parts = [
      item.proposedStreetAddress || item.streetAddress,
      item.proposedCity || item.city,
      item.proposedState || item.state,
      item.proposedZipCode || item.zipCode,
      item.proposedCountry || item.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  // Fall back to legacy single address field
  return item.proposedAddress || item.address || null;
};

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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId }));
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, { tripId }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId }));
  const { data: summary } = useSuspenseQuery(convexQuery(api.outreach.getSummary, { tripId }));
  
  const deleteOutreach = useMutation(api.outreach.deleteOutreach);
  const updateOutreachResponse = useMutation(api.outreach.updateResponse);
  const updateTrip = useMutation(api.trips.update);

  // Initialize edit values when trip data loads
  if (trip && !isEditing && !editName) {
    setEditName(trip.name || "");
    setEditDescription(trip.description || "");
    setEditStartDate(trip.startDate || "");
    setEditEndDate(trip.endDate || "");
  }

  const handleDeleteOutreach = async (outreachId: string, organizationName: string) => {
    if (confirm(`Are you sure you want to delete the outreach to "${organizationName}"?`)) {
      await deleteOutreach({ id: outreachId as any });
    }
  };

  const handleStatusChange = async (outreachId: string, newStatus: string) => {
    await updateOutreachResponse({
      id: outreachId as any,
      response: newStatus as any,
      responseDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleSaveTrip = async () => {
    await updateTrip({
      id: tripId as any,
      name: editName || undefined,
      description: editDescription || undefined,
      startDate: editStartDate || undefined,
      endDate: editEndDate || undefined,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(trip?.name || "");
    setEditDescription(trip?.description || "");
    setEditStartDate(trip?.startDate || "");
    setEditEndDate(trip?.endDate || "");
    setIsEditing(false);
  };

  if (!trip) {
    return <div>Trip not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {isEditing ? (
          <div className="not-prose space-y-4 max-w-2xl mx-auto">
            <div className="space-y-2">
              <input
                className="input w-full text-center text-3xl font-bold"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Trip name"
              />
              <textarea
                className="textarea w-full text-center text-lg"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Trip description (optional)"
                rows={2}
              />
            </div>
            
            <div className="flex gap-4 justify-center">
              <div className="flex flex-col">
                <label className="text-sm opacity-70 mb-1">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm opacity-70 mb-1">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <button onClick={handleSaveTrip} className="btn btn-primary btn-sm">
                <CheckCircle className="w-4 h-4" />
                Save
              </button>
              <button onClick={handleCancelEdit} className="btn btn-ghost btn-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <h1>{trip.name}</h1>
            {trip.description && <p className="text-lg opacity-80">{trip.description}</p>}
            {trip.startDate && (
              <div className="not-prose flex items-center justify-center gap-2 text-sm opacity-60 mt-2">
                <Calendar className="w-4 h-4" />
                {trip.startDate} {trip.endDate && `- ${trip.endDate}`}
              </div>
            )}
            
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-0 right-0 btn btn-ghost btn-sm"
              title="Edit trip details"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl">{summary.total}</div>
          <div className="stat-title">Total Outreach</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-warning">{summary.pending}</div>
          <div className="stat-title">Pending</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-primary">{summary.meeting_scheduled}</div>
          <div className="stat-title">Meetings</div>
        </div>
        <div className="stat bg-base-100 rounded-lg">
          <div className="stat-value text-2xl text-error">{summary.not_interested + summary.no_response + summary.interested}</div>
          <div className="stat-title">No Interest</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="not-prose flex gap-2 justify-center">
        <Link to="/add-outreach" search={{ tripId }}>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Outreach
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
              <Link to="/add-outreach" search={{ tripId }}>
                <button className="btn btn-primary btn-sm mt-2">Add First Outreach</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {outreach
                .sort((a, b) => {
                  // Define priority order for response types
                  const responsePriority = {
                    'meeting_scheduled': 1,
                    'pending': 2,
                    'no_response': 3,
                    'not_interested': 4,
                    'interested': 5 // Still handle existing data
                  };
                  
                  // First sort by response type priority
                  const aPriority = responsePriority[a.response] || 999;
                  const bPriority = responsePriority[b.response] || 999;
                  
                  if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                  }
                  
                  // Then by outreach date (newest first)
                  const dateComparison = new Date(b.outreachDate).getTime() - new Date(a.outreachDate).getTime();
                  if (dateComparison !== 0) {
                    return dateComparison;
                  }
                  
                  // Finally by organization name (alphabetical)
                  const aName = a.organization?.name || '';
                  const bName = b.organization?.name || '';
                  return aName.localeCompare(bName);
                })
                .slice(0, 5)
                .map((item) => (
                <div key={item._id} className="p-4 bg-base-100 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.organization?.name}</h4>
                      <p className="text-sm opacity-70">{item.contact?.name}</p>
                      <p className="text-xs opacity-60">{item.outreachDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status Dropdown */}
                      <div className="dropdown dropdown-end">
                        <div 
                          tabIndex={0} 
                          role="button" 
                          className={`badge cursor-pointer ${
                            item.response === 'meeting_scheduled' ? 'badge-success' :
                            item.response === 'pending' ? 'badge-warning' :
                            item.response === 'no_response' ? 'badge-neutral' :
                            'badge-error'
                          }`}
                        >
                          {item.response.replace('_', ' ')}
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                          <li>
                            <a onClick={() => handleStatusChange(item._id, 'pending')} 
                               className={item.response === 'pending' ? 'active' : ''}>
                              <span className="badge badge-warning badge-sm">pending</span>
                            </a>
                          </li>
                          <li>
                            <a onClick={() => handleStatusChange(item._id, 'not_interested')} 
                               className={item.response === 'not_interested' ? 'active' : ''}>
                              <span className="badge badge-error badge-sm">not interested</span>
                            </a>
                          </li>
                          <li>
                            <a onClick={() => handleStatusChange(item._id, 'no_response')} 
                               className={item.response === 'no_response' ? 'active' : ''}>
                              <span className="badge badge-neutral badge-sm">no response</span>
                            </a>
                          </li>
                          <li>
                            <a onClick={() => handleStatusChange(item._id, 'meeting_scheduled')} 
                               className={item.response === 'meeting_scheduled' ? 'active' : ''}>
                              <span className="badge badge-success badge-sm">meeting scheduled</span>
                            </a>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Edit Button */}
                      <Link to="/edit-outreach" search={{ id: item._id }}>
                        <button
                          className="btn btn-ghost btn-xs text-info hover:bg-info hover:text-info-content"
                          title="Edit outreach"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </Link>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteOutreach(item._id, item.organization?.name || 'this organization')}
                        className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                        title="Delete outreach"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {outreach.length > 5 && (
                <div className="text-center">
                  <button className="btn btn-sm btn-ghost">View All Outreach ({outreach.length})</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="not-prose">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
            <Link to="/print-meetings" search={{ tripId }}>
              <button className="btn btn-outline btn-sm">
                <FileText className="w-4 h-4" />
                Print Schedule
              </button>
            </Link>
          </div>
          {(() => {
            const scheduledMeetings = meetings.filter(m => m.status !== 'cancelled');
            const scheduledOutreach = outreach.filter(o => o.response === 'meeting_scheduled');
            
            // Create combined list with proper date handling
            const allMeetingItems = [
              ...scheduledMeetings.map(meeting => ({
                type: 'formal',
                date: meeting.scheduledDate,
                time: meeting.scheduledTime,
                sortDateTime: new Date(`${meeting.scheduledDate}T${meeting.scheduledTime}`),
                ...meeting
              })),
              ...scheduledOutreach.map(item => ({
                type: 'scheduled',
                date: item.proposedMeetingTime ? new Date(item.proposedMeetingTime).toISOString().split('T')[0] : item.responseDate || item.outreachDate,
                time: item.proposedMeetingTime ? new Date(item.proposedMeetingTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'TBD',
                sortDateTime: item.proposedMeetingTime ? new Date(item.proposedMeetingTime) : new Date(item.responseDate || item.outreachDate),
                ...item
              }))
            ];

            // Sort chronologically
            allMeetingItems.sort((a, b) => a.sortDateTime - b.sortDateTime);

            // Group by date
            const groupedByDate = allMeetingItems.reduce((groups, item) => {
              const dateKey = item.date;
              if (!groups[dateKey]) {
                groups[dateKey] = [];
              }
              groups[dateKey].push(item);
              return groups;
            }, {});

            const totalMeetingItems = allMeetingItems.length;
            
            return totalMeetingItems === 0 ? (
              <div className="p-6 bg-base-200 rounded-lg text-center">
                <p className="opacity-70">No meetings scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([date, dayMeetings]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-base-300">
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    
                    {/* Meetings for this day */}
                    <div className="space-y-3">
                      {dayMeetings.map((item) => (
                        <div 
                          key={item.type === 'formal' ? item._id : `outreach-${item._id}`} 
                          className={`p-5 rounded-lg ${
                            item.type === 'formal' ? 'bg-base-100' : 'bg-base-100 border border-success border-dashed'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-2">
                                {item.type === 'formal' ? item.title : item.organization?.name}
                                {item.type === 'scheduled' && (!formatAddress(item) || !item.proposedMeetingTime) && (
                                  <span className="text-sm font-normal opacity-60 ml-2">(pending details)</span>
                                )}
                              </h4>
                              
                              <p className="text-base opacity-80 mb-3">{item.organization?.name || item.contact?.name}</p>
                              
                              {/* Large formatted date/time/address */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-5 h-5 text-primary" />
                                  <span className="text-lg font-medium">{item.time}</span>
                                </div>
                                
                                {formatAddress(item) && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    <a
                                      href={`https://maps.google.com/maps?q=${encodeURIComponent(formatAddress(item))}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-lg font-medium text-primary hover:text-primary-focus underline"
                                    >
                                      {formatAddress(item)}
                                    </a>
                                  </div>
                                )}
                              </div>
                              
                              {item.type === 'scheduled' && !item.proposedMeetingTime && (
                                <p className="text-sm opacity-60 mt-2">
                                  Meeting scheduled but time/details pending
                                </p>
                              )}
                            </div>
                            
                            <div className={`badge badge-lg ${
                              item.type === 'formal' ? (
                                item.status === 'confirmed' ? 'badge-success' :
                                item.status === 'completed' ? 'badge-info' :
                                'badge-warning'
                              ) : 'badge-success'
                            }`}>
                              {item.type === 'formal' ? item.status : 'meeting scheduled'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}