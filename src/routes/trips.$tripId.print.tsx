import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Calendar, MapPin, Plane, Train, Car, Bus, Ship, Hotel, Clock, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";

const transportationIcons: Record<string, React.ComponentType<any>> = {
  flight: Plane,
  train: Train,
  car: Car,
  bus: Bus,
  boat: Ship,
  other: MapPin,
};

export const Route = createFileRoute("/trips/$tripId/print")({
  loader: async ({ context: { queryClient }, params: { tripId } }) => {
    await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.trips.get, { id: tripId as any })),
      queryClient.ensureQueryData(convexQuery(api.tripLegs.list, { tripId: tripId as any })),
      queryClient.ensureQueryData(convexQuery(api.lodging.list, { tripId: tripId as any })),
      queryClient.ensureQueryData(convexQuery(api.meetings.list, { tripId: tripId as any })),
    ]);
  },
  component: TripPrintView,
});

function TripPrintView() {
  const { tripId } = Route.useParams();
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId as any }));
  const { data: tripLegs } = useSuspenseQuery(convexQuery(api.tripLegs.list, { tripId: tripId as any }));
  const { data: lodging } = useSuspenseQuery(convexQuery(api.lodging.list, { tripId: tripId as any }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId: tripId as any }));

  // Auto-trigger print dialog when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500); // Small delay to ensure page is fully rendered

    return () => clearTimeout(timer);
  }, []);

  if (!trip) {
    return <div>Loading...</div>;
  }

  return (
    <div className="print-view min-h-screen bg-white text-black p-8">
      <style>{`
        @media print {
          @page {
            margin: 0.5in;
            size: auto;
          }
          
          .print-view {
            background: white !important;
            color: black !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-break {
            page-break-before: always;
          }
        }
        
        @media screen {
          .print-view {
            max-width: 8.5in;
            margin: 0 auto;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          }
        }
      `}</style>
      
      {/* Print Header */}
      <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
        <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
        {trip.description && (
          <p className="text-lg text-gray-600 mb-4">{trip.description}</p>
        )}
        {(trip.startDate || trip.endDate) && (
          <div className="text-base font-semibold">
            {trip.startDate && <span>{trip.startDate}</span>}
            {trip.startDate && trip.endDate && <span> to </span>}
            {trip.endDate && <span>{trip.endDate}</span>}
          </div>
        )}
        <p className="text-sm text-gray-500 mt-2">
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Close button - only visible on screen */}
      <div className="no-print fixed top-4 right-4">
        <button
          onClick={() => window.close()}
          className="btn btn-sm btn-ghost"
        >
          ✕ Close
        </button>
      </div>

      <TripItineraryPrint
        tripId={tripId}
        legs={tripLegs}
        lodging={lodging}
        meetings={meetings}
        tripStartDate={trip.startDate}
        tripEndDate={trip.endDate}
      />
    </div>
  );
}

function TripItineraryPrint({ tripId, legs, lodging, meetings, tripStartDate, tripEndDate }: { 
  tripId: string; 
  legs: any[]; 
  lodging: any[]; 
  meetings: any[];
  tripStartDate?: string; 
  tripEndDate?: string; 
}) {
  // Helper function to generate Google Maps URL
  const generateGoogleMapsUrl = (address: string, city?: string) => {
    const fullAddress = [address, city].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
  };

  const getTripDays = () => {
    if (!tripStartDate || !tripEndDate) return [];
    
    const start = new Date(tripStartDate);
    const end = new Date(tripEndDate);
    const days = [];
    
    const current = new Date(start);
    while (current <= end) {
      days.push({
        date: current.toISOString().split('T')[0],
        dayNumber: Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const tripDays = getTripDays();

  const organizeByDays = () => {
    // Helper function to check if lodging covers a specific date
    const lodgingCoversDate = (stay: any, date: string) => {
      if (stay.date && !stay.startDate) {
        return stay.date === date;
      }
      
      if (!stay.startDate) return false;
      const stayStart = new Date(stay.startDate);
      const stayEnd = stay.endDate ? new Date(stay.endDate) : stayStart;
      const checkDate = new Date(date);
      return checkDate >= stayStart && checkDate <= stayEnd;
    };

    if (tripDays.length === 0) {
      const legDates = legs.map(l => l.date).filter(Boolean);
      const meetingDates = meetings.map(m => m.scheduledDate).filter(Boolean);
      
      const lodgingDates: string[] = [];
      lodging.forEach(stay => {
        if (stay.date && !stay.startDate) {
          lodgingDates.push(stay.date);
        }
        else if (stay.startDate) {
          const startDate = new Date(stay.startDate);
          const endDate = stay.endDate ? new Date(stay.endDate) : startDate;
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            lodgingDates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      });
      
      const allDates = [...legDates, ...lodgingDates, ...meetingDates];
      const uniqueDates = [...new Set(allDates)].sort();
      
      return uniqueDates.map(date => ({
        date,
        dayNumber: null,
        items: [
          ...legs.filter(l => l.date === date).map(l => ({ ...l, type: 'leg' })),
          ...lodging.filter(stay => lodgingCoversDate(stay, date)).map(stay => ({ ...stay, type: 'lodging' })),
          ...meetings.filter(m => m.scheduledDate === date).map(m => ({ ...m, type: 'meeting' }))
        ]
      }));
    }

    const meetingDates = meetings.map(m => m.scheduledDate).filter(Boolean);
    const allTripDays = [...tripDays];
    
    meetingDates.forEach(meetingDate => {
      const meetingDateObj = new Date(meetingDate);
      const tripStart = new Date(tripStartDate);
      const tripEnd = new Date(tripEndDate);
      
      if (meetingDateObj < tripStart || meetingDateObj > tripEnd) {
        const existingDay = allTripDays.find(d => d.date === meetingDate);
        if (!existingDay) {
          allTripDays.push({
            date: meetingDate,
            dayNumber: null,
          });
        }
      }
    });
    
    allTripDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return allTripDays.map(day => {
      const dayLegs = legs.filter(leg => leg.date === day.date);
      const dayLodging = lodging.filter(stay => lodgingCoversDate(stay, day.date));
      const dayMeetings = meetings.filter(meeting => meeting.scheduledDate === day.date);
      
      const items = [
        ...dayLegs.map(leg => ({ ...leg, type: 'leg' })),
        ...dayLodging.map(stay => ({ ...stay, type: 'lodging' })),
        ...dayMeetings.map(meeting => ({ ...meeting, type: 'meeting' }))
      ];
      
      return {
        ...day,
        items
      };
    });
  };

  const organizedDays = organizeByDays();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Trip Itinerary</h2>

      <div className="space-y-6">
        {organizedDays.map((day, dayIndex) => (
          <div key={day.date} className={dayIndex > 0 && dayIndex % 2 === 0 ? "print-break" : ""}>
            {/* Day Header */}
            <div className="flex items-center gap-4 mb-4 border-b border-gray-200 pb-2">
              <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {day.dayNumber || '•'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{day.date}</h3>
                <div className="text-sm text-gray-600">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* Day Items */}
            <div className="ml-12 space-y-3">
              {day.items.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>No travel, lodging, or meetings planned for this day</p>
                </div>
              ) : (
                day.items.map((item) => (
                  <div key={`${item.type}-${item._id}`}>
                    {item.type === 'leg' ? (
                      <TravelLegPrintCard leg={item} />
                    ) : item.type === 'lodging' ? (
                      <LodgingPrintCard lodging={item} generateGoogleMapsUrl={generateGoogleMapsUrl} />
                    ) : (
                      <MeetingPrintCard meeting={item} generateGoogleMapsUrl={generateGoogleMapsUrl} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {organizedDays.length === 0 && (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No itinerary items</h3>
            <p className="text-gray-600">No travel, lodging, or meetings have been added to this trip.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingPrintCard({ meeting, generateGoogleMapsUrl }: { meeting: any; generateGoogleMapsUrl: (address: string, city?: string) => string }) {
  return (
    <div className="p-4 border-l-4 border-l-blue-500 bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium">Meeting</span>
        <span className={`px-2 py-1 text-xs rounded ${
          meeting.status === 'scheduled' ? 'bg-green-100 text-green-800' :
          meeting.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
          meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {meeting.status}
        </span>
      </div>
      <h4 className="font-medium text-lg mb-1">{meeting.title}</h4>
      <div className="space-y-1 text-sm text-gray-700">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {meeting.scheduledTime}
          {meeting.duration && ` (${meeting.duration} min)`}
        </div>
        {meeting.address && meeting.address !== 'TBD' && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>
              {meeting.address}
              {meeting.city && `, ${meeting.city}`}
            </span>
          </div>
        )}
        {meeting.contact && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {meeting.contact.name} ({meeting.contact.email})
            {meeting.organization && ` • ${meeting.organization.name}`}
          </div>
        )}
      </div>
      {meeting.notes && (
        <p className="text-sm text-gray-700 mt-2">{meeting.notes}</p>
      )}
    </div>
  );
}

function TravelLegPrintCard({ leg }: { leg: any }) {
  const IconComponent = transportationIcons[leg.transportation] || MapPin;

  return (
    <div className="p-4 bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <IconComponent className="w-4 h-4 text-blue-600" />
        <span className="text-sm capitalize font-medium">{leg.transportation}</span>
      </div>
      <h4 className="font-medium text-lg">
        {leg.startCity} → {leg.endCity}
      </h4>
      <div className="space-y-1 text-sm text-gray-700 mt-1">
        {leg.time && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {leg.time}
          </div>
        )}
        {leg.reservationNumber && (
          <div className="flex items-center gap-1">
            <span className="text-xs">🎫</span>
            {leg.reservationNumber}
          </div>
        )}
      </div>
      {leg.notes && (
        <p className="text-sm text-gray-700 mt-1">{leg.notes}</p>
      )}
    </div>
  );
}

function LodgingPrintCard({ lodging, generateGoogleMapsUrl }: { lodging: any; generateGoogleMapsUrl: (address: string, city?: string) => string }) {
  return (
    <div className="p-4 bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Hotel className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium">Lodging</span>
      </div>
      <h4 className="font-medium text-lg">{lodging.name}</h4>
      {(lodging.address || lodging.city) && (
        <div className="flex items-center gap-1 text-sm text-gray-700 mt-1">
          <MapPin className="w-3 h-3" />
          <span>
            {lodging.address}{lodging.city && `, ${lodging.city}`}
          </span>
        </div>
      )}
      {(lodging.startDate || lodging.endDate || lodging.date) && (
        <div className="flex items-center gap-1 text-sm text-gray-700 mt-1">
          <Calendar className="w-3 h-3" />
          {lodging.startDate ? (
            <>
              {new Date(lodging.startDate).toLocaleDateString()}
              {lodging.endDate && lodging.startDate !== lodging.endDate && 
                ` - ${new Date(lodging.endDate).toLocaleDateString()}`}
            </>
          ) : lodging.date ? (
            new Date(lodging.date).toLocaleDateString()
          ) : null}
        </div>
      )}
      {lodging.notes && (
        <p className="text-sm text-gray-700 mt-1">{lodging.notes}</p>
      )}
    </div>
  );
}