import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Building, User, Mail, Phone, Calendar, Plus, CheckCircle } from "lucide-react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/trips/$tripId/outreach")({
  loader: async ({ context: { queryClient }, params: { tripId } }) => {
    await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.trips.get, { id: tripId })),
      queryClient.ensureQueryData(convexQuery(api.outreach.list, { tripId })),
    ]);
  },
  component: OutreachPage,
});

function OutreachPage() {
  const { tripId } = Route.useParams();
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId }));
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, { tripId }));
  const updateResponse = useMutation(api.outreach.updateResponse);

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const handleResponseUpdate = async (outreachId: string, response: "interested" | "not_interested" | "no_response") => {
    await updateResponse({
      id: outreachId,
      response,
      responseDate: new Date().toISOString().split('T')[0],
    });
  };

  const groupedByResponse = outreach.reduce((acc, item) => {
    if (!acc[item.response]) acc[item.response] = [];
    acc[item.response].push(item);
    return acc;
  }, {} as Record<string, typeof outreach>);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1>Outreach Management</h1>
        <h2 className="text-xl opacity-80">{trip.name}</h2>
        <div className="not-prose mt-4">
          <Link to="/trips/$tripId/outreach/new" params={{ tripId }}>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Add New Outreach
            </button>
          </Link>
        </div>
      </div>

      {outreach.length === 0 ? (
        <div className="not-prose text-center">
          <div className="p-8 bg-base-200 rounded-lg">
            <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg opacity-70 mb-4">No outreach recorded yet.</p>
            <Link to="/trips/$tripId/outreach/new" params={{ tripId }}>
              <button className="btn btn-primary">Record First Outreach</button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Responses */}
          {groupedByResponse.pending && (
            <OutreachSection
              title="Pending Responses"
              items={groupedByResponse.pending}
              color="warning"
              icon={<Calendar className="w-5 h-5" />}
              showActions
              onResponseUpdate={handleResponseUpdate}
            />
          )}

          {/* Interested */}
          {groupedByResponse.interested && (
            <OutreachSection
              title="Interested Contacts"
              items={groupedByResponse.interested}
              color="info"
              icon={<CheckCircle className="w-5 h-5" />}
              showScheduleButton
              tripId={tripId}
            />
          )}

          {/* Meeting Scheduled */}
          {groupedByResponse.meeting_scheduled && (
            <OutreachSection
              title="Meetings Scheduled"
              items={groupedByResponse.meeting_scheduled}
              color="success"
              icon={<Calendar className="w-5 h-5" />}
            />
          )}

          {/* Not Interested */}
          {groupedByResponse.not_interested && (
            <OutreachSection
              title="Not Interested"
              items={groupedByResponse.not_interested}
              color="error"
              icon={<CheckCircle className="w-5 h-5" />}
            />
          )}

          {/* No Response */}
          {groupedByResponse.no_response && (
            <OutreachSection
              title="No Response"
              items={groupedByResponse.no_response}
              color="neutral"
              icon={<Calendar className="w-5 h-5" />}
            />
          )}
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

interface OutreachSectionProps {
  title: string;
  items: Array<{
    _id: string;
    outreachDate: string;
    response: string;
    notes?: string;
    organization?: { name: string; website?: string };
    contact?: { name: string; email: string; title?: string; phone?: string };
  }>;
  color: "warning" | "info" | "success" | "error" | "neutral";
  icon: React.ReactNode;
  showActions?: boolean;
  showScheduleButton?: boolean;
  tripId?: string;
  onResponseUpdate?: (outreachId: string, response: "interested" | "not_interested" | "no_response") => void;
}

function OutreachSection({ 
  title, 
  items, 
  color, 
  icon, 
  showActions, 
  showScheduleButton,
  tripId, 
  onResponseUpdate 
}: OutreachSectionProps) {
  return (
    <div className="not-prose">
      <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 text-${color}`}>
        {icon}
        {title} ({items.length})
      </h3>
      
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item._id} className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{item.organization?.name}</h4>
                  <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 opacity-60" />
                        {item.contact?.name}
                        {item.contact?.title && <span className="opacity-60">({item.contact.title})</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 opacity-60" />
                        {item.contact?.email}
                      </div>
                      {item.contact?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 opacity-60" />
                          {item.contact.phone}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 opacity-60" />
                        Contacted: {item.outreachDate}
                      </div>
                      {item.organization?.website && (
                        <div className="text-sm opacity-60">
                          {item.organization.website}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-sm opacity-70">
                          <strong>Notes:</strong> {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className={`badge badge-${color}`}>
                    {item.response.replace('_', ' ')}
                  </div>
                  
                  {showActions && onResponseUpdate && (
                    <div className="flex gap-1">
                      <button
                        className="btn btn-xs btn-success"
                        onClick={() => onResponseUpdate(item._id, 'interested')}
                      >
                        Interested
                      </button>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => onResponseUpdate(item._id, 'not_interested')}
                      >
                        Not Interested
                      </button>
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => onResponseUpdate(item._id, 'no_response')}
                      >
                        No Response
                      </button>
                    </div>
                  )}

                  {showScheduleButton && tripId && (
                    <Link to="/trips/$tripId/outreach/$outreachId/schedule" params={{ tripId, outreachId: item._id }}>
                      <button className="btn btn-xs btn-primary">
                        Schedule Meeting
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}