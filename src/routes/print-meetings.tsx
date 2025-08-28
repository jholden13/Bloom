import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Calendar, MapPin, Printer } from "lucide-react";
import { z } from "zod";
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

const searchSchema = z.object({
  tripId: z.string(),
});

export const Route = createFileRoute("/print-meetings")({
  validateSearch: searchSchema,
  loader: async ({ context: { queryClient }, search: { tripId } }) => {
    await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.trips.get, { id: tripId })),
      queryClient.ensureQueryData(convexQuery(api.outreach.list, { tripId })),
      queryClient.ensureQueryData(convexQuery(api.meetings.list, { tripId })),
    ]);
  },
  component: MeetingsPrintPage,
});

function MeetingsPrintPage() {
  const { tripId } = Route.useSearch();
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId }));
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, { tripId }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId }));

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  // Prepare meetings data (same logic as in trip detail page)
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

  return (
    <>
      <style>
        {`
          @media print {
            body { font-family: 'Times New Roman', serif; }
            .no-print { display: none !important; }
            .print-page { 
              max-width: none !important; 
              margin: 0 !important; 
              padding: 20px !important;
            }
            h1 { font-size: 24px; margin-bottom: 20px; }
            h2 { font-size: 20px; margin: 20px 0 15px 0; }
            h3 { font-size: 18px; margin: 15px 0 10px 0; }
            .meeting-item { 
              margin-bottom: 20px; 
              padding: 15px;
              border: 1px solid #ccc;
              break-inside: avoid;
            }
            .meeting-time { font-size: 16px; font-weight: bold; }
            .meeting-address { font-size: 16px; }
            .meeting-status { 
              float: right; 
              font-size: 12px; 
              padding: 4px 8px; 
              border: 1px solid #000;
              border-radius: 4px;
            }
          }
        `}
      </style>
      
      <div className="print-page max-w-4xl mx-auto p-6">
        {/* Header - hidden on print */}
        <div className="no-print mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{trip.name} - Meeting Schedule</h1>
            <p className="opacity-70">Printable meeting schedule</p>
          </div>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
          >
            <Printer className="w-4 h-4" />
            Print Schedule
          </button>
        </div>

        {/* Print content */}
        <div className="print-content">
          <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
          <h2 className="text-xl opacity-70 mb-6">Meeting Schedule</h2>
          
          {trip.startDate && (
            <p className="mb-4 text-sm opacity-60">
              Trip Dates: {trip.startDate} {trip.endDate && `- ${trip.endDate}`}
            </p>
          )}
          
          {trip.description && (
            <p className="mb-6 text-sm opacity-80">{trip.description}</p>
          )}

          {allMeetingItems.length === 0 ? (
            <p className="text-center py-8 opacity-70">No meetings scheduled.</p>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByDate).map(([date, dayMeetings]) => (
                <div key={date}>
                  {/* Date Header */}
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-gray-300">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  
                  {/* Meetings for this day */}
                  <div className="space-y-4">
                    {dayMeetings.map((item, index) => (
                      <div 
                        key={item.type === 'formal' ? item._id : `outreach-${item._id}`}
                        className="meeting-item border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">
                              {item.type === 'formal' ? item.title : item.organization?.name}
                              {item.type === 'scheduled' && (
                                <span className="text-sm font-normal opacity-60 ml-2">(details pending)</span>
                              )}
                            </h3>
                            
                            <p className="text-base mb-3 opacity-80">
                              {item.organization?.name || item.contact?.name}
                            </p>
                            
                            {/* Meeting details - large font */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 no-print" />
                                <span className="meeting-time text-lg font-bold">
                                  {item.time}
                                </span>
                              </div>
                              
                              {formatAddress(item) && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-5 h-5 no-print" />
                                  <a
                                    href={`https://maps.google.com/maps?q=${encodeURIComponent(formatAddress(item))}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="meeting-address text-lg text-primary hover:text-primary-focus underline"
                                  >
                                    {formatAddress(item)}
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            {/* Contact info for print */}
                            {item.contact && (
                              <div className="mt-3 text-sm">
                                <p><strong>Contact:</strong> {item.contact.name}</p>
                                <p><strong>Email:</strong> {item.contact.email}</p>
                                {item.contact.phone && (
                                  <p><strong>Phone:</strong> {item.contact.phone}</p>
                                )}
                              </div>
                            )}
                            
                            {item.notes && (
                              <div className="mt-3 text-sm">
                                <p><strong>Notes:</strong> {item.notes}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="meeting-status">
                            {item.type === 'formal' ? item.status : 'scheduled'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm opacity-60">
            <p>Generated on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>
    </>
  );
}