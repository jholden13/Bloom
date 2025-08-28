import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Calendar, MapPin, Users, Plus, FileText, CheckCircle, Trash2, ChevronDown, Edit } from "lucide-react";
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
  
  const deleteOutreach = useMutation(api.outreach.deleteOutreach);
  const updateOutreachResponse = useMutation(api.outreach.updateResponse);

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
              {outreach.slice(0, 5).map((item) => (
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
                            item.response === 'interested' ? 'badge-info' :
                            item.response === 'pending' ? 'badge-warning' :
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
                            <a onClick={() => handleStatusChange(item._id, 'interested')} 
                               className={item.response === 'interested' ? 'active' : ''}>
                              <span className="badge badge-info badge-sm">interested</span>
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
          <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
          {(() => {
            const scheduledMeetings = meetings.filter(m => m.status !== 'cancelled');
            const scheduledOutreach = outreach.filter(o => o.response === 'meeting_scheduled');
            const totalMeetingItems = scheduledMeetings.length + scheduledOutreach.length;
            
            return totalMeetingItems === 0 ? (
              <div className="p-6 bg-base-200 rounded-lg text-center">
                <p className="opacity-70">No meetings scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Formal Meetings */}
                {scheduledMeetings.slice(0, 5).map((meeting) => (
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
                
                {/* Scheduled Outreach (awaiting formal meeting) */}
                {scheduledOutreach.map((item) => (
                  <div key={`outreach-${item._id}`} className="p-4 bg-base-100 rounded-lg border border-success border-dashed">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{item.organization?.name} <span className="text-xs opacity-60">(pending meeting details)</span></h4>
                        <p className="text-sm opacity-70">{item.contact?.name}</p>
                        <div className="flex items-center gap-1 text-xs opacity-60 mt-1">
                          <Calendar className="w-3 h-3" />
                          Outreach: {item.outreachDate}
                          {item.responseDate && ` • Response: ${item.responseDate}`}
                        </div>
                        {item.proposedAddress && (
                          <div className="flex items-center gap-1 text-xs opacity-60">
                            <MapPin className="w-3 h-3" />
                            Proposed: {item.proposedAddress}
                          </div>
                        )}
                        {item.proposedMeetingTime && (
                          <div className="flex items-center gap-1 text-xs opacity-60">
                            <Calendar className="w-3 h-3" />
                            Proposed time: {item.proposedMeetingTime}
                          </div>
                        )}
                      </div>
                      <div className="badge badge-success">
                        meeting scheduled
                      </div>
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