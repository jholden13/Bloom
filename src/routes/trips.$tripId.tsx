import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Calendar, MapPin, Plane, Train, Car, Bus, Ship, Plus, CheckCircle, Trash2, Pencil, Hotel, Clock, Users, Printer } from "lucide-react";
import { api } from "../../convex/_generated/api";

const transportationIcons: Record<string, React.ComponentType<any>> = {
  flight: Plane,
  train: Train,
  car: Car,
  bus: Bus,
  boat: Ship,
  other: MapPin,
};

export const Route = createFileRoute("/trips/$tripId")({
  loader: async ({ context: { queryClient }, params: { tripId } }) => {
    await Promise.all([
      queryClient.ensureQueryData(convexQuery(api.trips.get, { id: tripId as any })),
      queryClient.ensureQueryData(convexQuery(api.tripLegs.list, { tripId: tripId as any })),
      queryClient.ensureQueryData(convexQuery(api.lodging.list, { tripId: tripId as any })),
      queryClient.ensureQueryData(convexQuery(api.meetings.list, { tripId: tripId as any })),
      queryClient.ensureQueryData(convexQuery(api.outreach.list, { tripId: tripId as any })),
    ]);
  },
  component: TripDetailsPage,
});

function TripDetailsPage() {
  const { tripId } = Route.useParams();
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId as any }));
  const { data: tripLegs } = useSuspenseQuery(convexQuery(api.tripLegs.list, { tripId: tripId as any }));
  const { data: lodging } = useSuspenseQuery(convexQuery(api.lodging.list, { tripId: tripId as any }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId: tripId as any }));
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, { tripId: tripId as any }));

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(trip?.name || "");
  const [editDescription, setEditDescription] = useState(trip?.description || "");
  const [editStartDate, setEditStartDate] = useState(trip?.startDate || "");
  const [editEndDate, setEditEndDate] = useState(trip?.endDate || "");

  const updateTrip = useMutation(api.trips.update);
  const navigate = useNavigate();

  const handleSaveTrip = async () => {
    await updateTrip({
      id: tripId as any,
      name: editName,
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
    return <div>Loading...</div>;
  }

  return (
    <div className="prose prose-invert max-w-7xl mx-auto">
      <div className="text-center mb-8">
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
          <div>
            <h1 className="text-4xl font-bold mb-2">{trip.name}</h1>
            {trip.description && (
              <p className="text-xl text-base-content/70 mb-4">{trip.description}</p>
            )}
            {(trip.startDate || trip.endDate) && (
              <div className="text-lg mb-4 space-x-2">
                {trip.startDate && <span className="bg-red-600 text-white px-3 py-1 rounded-full text-lg font-bold">{trip.startDate}</span>}
                {trip.startDate && trip.endDate && <span>to</span>}
                {trip.endDate && <span className="bg-red-600 text-white px-3 py-1 rounded-full text-lg font-bold">{trip.endDate}</span>}
              </div>
            )}
          </div>
        )}
        
        {!isEditing && (
          <div className="flex justify-center no-print">
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-ghost btn-sm"
              title="Edit trip details"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <TripItinerarySection tripId={tripId} legs={tripLegs} lodging={lodging} meetings={meetings} tripStartDate={trip.startDate} tripEndDate={trip.endDate} tripName={trip.name} tripDescription={trip.description} />
        </div>
        <div className="lg:col-span-1 no-print">
          <div className="not-prose">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title text-lg">Meetings & Outreach</h3>
                <div className="space-y-3">
                  <div className="stats stats-vertical text-xs">
                    <div className="stat py-2">
                      <div className="stat-title text-xs">Meetings</div>
                      <div className="stat-value text-lg">{meetings.length}</div>
                    </div>
                    <div className="stat py-2">
                      <div className="stat-title text-xs">Outreach</div>
                      <div className="stat-value text-lg">{outreach.length}</div>
                    </div>
                  </div>
                  <Link 
                    to="/add-outreach" 
                    search={{ tripId }} 
                    className="btn btn-primary btn-sm w-full no-underline"
                  >
                    <Plus className="w-4 h-4" />
                    Add Outreach
                  </Link>
                  <button 
                    onClick={() => navigate({ to: "/meetings", search: { tripId } })}
                    className="btn btn-outline btn-sm w-full"
                  >
                    <Users className="w-4 h-4" />
                    Manage Outreach
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripItinerarySection({ tripId, legs, lodging, meetings, tripStartDate, tripEndDate, tripName, tripDescription }: { 
  tripId: string; 
  legs: any[]; 
  lodging: any[]; 
  meetings: any[];
  tripStartDate?: string; 
  tripEndDate?: string; 
  tripName?: string;
  tripDescription?: string;
}) {
  const [editingLeg, setEditingLeg] = useState<string | null>(null);
  const [editingLodging, setEditingLodging] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<string | null>(null);
  const [showAddLegForm, setShowAddLegForm] = useState(false);
  const [showAddLodgingForm, setShowAddLodgingForm] = useState(false);

  // Helper function to generate Google Maps URL for addresses
  const generateGoogleMapsUrl = (address: string, city?: string) => {
    const fullAddress = [address, city].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
  };
  
  const [newLeg, setNewLeg] = useState({
    startCity: "",
    endCity: "",
    transportation: "flight" as const,
    date: "",
    time: "",
    reservationNumber: "",
    notes: "",
    status: "tentative" as const,
  });

  const [newLodging, setNewLodging] = useState({
    startDate: "",
    endDate: "",
    name: "",
    address: "",
    city: "",
    notes: "",
    status: "tentative" as const,
  });

  const createLeg = useMutation(api.tripLegs.create);
  const updateLeg = useMutation(api.tripLegs.update);
  const deleteLeg = useMutation(api.tripLegs.remove);
  const createLodging = useMutation(api.lodging.create);
  const updateLodging = useMutation(api.lodging.update);
  const deleteLodging = useMutation(api.lodging.remove);
  const updateMeeting = useMutation(api.meetings.update);

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
      // Handle legacy data format
      if (stay.date && !stay.startDate) {
        return stay.date === date;
      }
      
      // Handle new date range format
      if (!stay.startDate) return false;
      const stayStart = new Date(stay.startDate);
      const stayEnd = stay.endDate ? new Date(stay.endDate) : stayStart;
      const checkDate = new Date(date);
      return checkDate >= stayStart && checkDate <= stayEnd;
    };

    if (tripDays.length === 0) {
      // Collect all dates from legs, lodging date ranges, and meetings
      const legDates = legs.map(l => l.date).filter(Boolean);
      const meetingDates = meetings.map(m => m.scheduledDate).filter(Boolean);
      
      // For lodging, collect all dates in the range
      const lodgingDates: string[] = [];
      lodging.forEach(stay => {
        // Handle legacy data format
        if (stay.date && !stay.startDate) {
          lodgingDates.push(stay.date);
        }
        // Handle new date range format
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

    // Get all meeting dates to include additional days if needed
    const meetingDates = meetings.map(m => m.scheduledDate).filter(Boolean);
    const allTripDays = [...tripDays];
    
    // Add additional days for meetings outside the trip range
    meetingDates.forEach(meetingDate => {
      const meetingDateObj = new Date(meetingDate);
      const tripStart = tripStartDate ? new Date(tripStartDate) : new Date();
      const tripEnd = tripEndDate ? new Date(tripEndDate) : new Date();
      
      if (meetingDateObj < tripStart || meetingDateObj > tripEnd) {
        // Check if this date is already in our days
        const existingDay = allTripDays.find(d => d.date === meetingDate);
        if (!existingDay) {
          allTripDays.push({
            date: meetingDate,
            dayNumber: 0, // No day number for dates outside trip range
          });
        }
      }
    });
    
    // Sort all days by date
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

  const handleAddLeg = async () => {
    await createLeg({
      tripId: tripId as any,
      startCity: newLeg.startCity,
      endCity: newLeg.endCity,
      transportation: newLeg.transportation,
      date: newLeg.date || undefined,
      time: newLeg.time || undefined,
      reservationNumber: newLeg.reservationNumber || undefined,
      notes: newLeg.notes || undefined,
      status: newLeg.status || undefined,
    });
    setNewLeg({ 
      startCity: "", 
      endCity: "", 
      transportation: "flight", 
      date: "", 
      time: "", 
      reservationNumber: "", 
      notes: "",
      status: "tentative"
    });
    setShowAddLegForm(false);
  };

  const handleAddLodging = async () => {
    await createLodging({
      tripId: tripId as any,
      startDate: newLodging.startDate,
      endDate: newLodging.endDate,
      name: newLodging.name,
      address: newLodging.address || undefined,
      city: newLodging.city || undefined,
      notes: newLodging.notes || undefined,
      status: newLodging.status || undefined,
    });
    setNewLodging({ 
      startDate: "", 
      endDate: "", 
      name: "", 
      address: "", 
      city: "", 
      notes: "",
      status: "tentative"
    });
    setShowAddLodgingForm(false);
  };

  return (
    <div className="not-prose">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Trip Itinerary</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Add print styles to hide interactive elements
              const printStyle = document.createElement('style');
              printStyle.innerHTML = `
                @media print {
                  .no-print, nav, header, footer, .btn, button, .sidebar {
                    display: none !important;
                  }
                  .print-header {
                    display: block !important;
                    text-align: center;
                    margin-bottom: 2rem;
                    border-bottom: 2px solid #ccc;
                    padding-bottom: 1rem;
                  }
                  body {
                    background: white !important;
                    color: black !important;
                  }
                  .prose {
                    color: black !important;
                  }
                }
              `;
              document.head.appendChild(printStyle);
              
              // Add print header
              const printHeader = document.createElement('div');
              printHeader.className = 'print-header';
              printHeader.style.display = 'none';
              printHeader.innerHTML = `
                <h1>${tripName || 'Trip Itinerary'}</h1>
                ${tripDescription ? `<p>${tripDescription}</p>` : ''}
                <p><strong>${tripStartDate || ''} ${tripStartDate && tripEndDate ? 'to' : ''} ${tripEndDate || ''}</strong></p>
                <p><em>Generated on ${new Date().toLocaleDateString()}</em></p>
              `;
              document.body.insertBefore(printHeader, document.body.firstChild);
              
              // Open print dialog
              window.print();
              
              // Clean up after print
              setTimeout(() => {
                document.head.removeChild(printStyle);
                document.body.removeChild(printHeader);
              }, 1000);
            }}
            className="btn btn-ghost btn-sm no-print"
            title="Print Itinerary"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => setShowAddLegForm(true)}
            className="btn btn-primary btn-sm no-print"
          >
            <Plus className="w-4 h-4" />
            Add Travel
          </button>
          <button
            onClick={() => setShowAddLodgingForm(true)}
            className="btn btn-outline btn-sm no-print"
          >
            <Plus className="w-4 h-4" />
            Add Lodging
          </button>
        </div>
      </div>

      {/* Add Travel Form */}
      {showAddLegForm && (
        <div className="card bg-base-100 shadow mb-6">
          <div className="card-body">
            <h3 className="card-title">Add Travel Leg</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input input-sm"
                placeholder="From city"
                value={newLeg.startCity}
                onChange={(e) => setNewLeg({ ...newLeg, startCity: e.target.value })}
              />
              <input
                className="input input-sm"
                placeholder="To city"
                value={newLeg.endCity}
                onChange={(e) => setNewLeg({ ...newLeg, endCity: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <select
                className="select select-sm"
                value={newLeg.transportation}
                onChange={(e) => setNewLeg({ ...newLeg, transportation: e.target.value as any })}
              >
                <option value="flight">Flight</option>
                <option value="train">Train</option>
                <option value="car">Car</option>
                <option value="bus">Bus</option>
                <option value="boat">Boat</option>
                <option value="other">Other</option>
              </select>
              <select
                className="select select-sm"
                value={newLeg.status}
                onChange={(e) => setNewLeg({ ...newLeg, status: e.target.value as any })}
              >
                <option value="tentative">Tentative</option>
                <option value="confirmed">Confirmed</option>
              </select>
              <input
                type="date"
                className="input input-sm"
                placeholder="Date"
                value={newLeg.date}
                onChange={(e) => setNewLeg({ ...newLeg, date: e.target.value })}
              />
              <input
                type="time"
                className="input input-sm"
                placeholder="Time"
                value={newLeg.time}
                onChange={(e) => setNewLeg({ ...newLeg, time: e.target.value })}
              />
            </div>
            <input
              className="input input-sm"
              placeholder="Reservation Number (optional)"
              value={newLeg.reservationNumber}
              onChange={(e) => setNewLeg({ ...newLeg, reservationNumber: e.target.value })}
            />
            <textarea
              className="textarea textarea-sm"
              placeholder="Notes (optional)"
              value={newLeg.notes}
              onChange={(e) => setNewLeg({ ...newLeg, notes: e.target.value })}
              rows={2}
            />
            <div className="card-actions justify-end">
              <button onClick={() => setShowAddLegForm(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={() => void handleAddLeg()} className="btn btn-primary btn-sm">
                Add Travel Leg
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lodging Form */}
      {showAddLodgingForm && (
        <div className="card bg-base-100 shadow mb-6">
          <div className="card-body">
            <h3 className="card-title">Add Lodging</h3>
            <input
              className="input input-sm w-full mb-3"
              placeholder="Hotel/Place name"
              value={newLodging.name}
              onChange={(e) => setNewLodging({ ...newLodging, name: e.target.value })}
            />
            <div className="mb-3">
              <label className="text-sm font-medium text-base-content/70 mb-1 block">Status</label>
              <select
                className="select select-sm w-full"
                value={newLodging.status}
                onChange={(e) => setNewLodging({ ...newLodging, status: e.target.value as any })}
              >
                <option value="tentative">Tentative</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-base-content/70">Check-in Date</label>
                <input
                  type="date"
                  className="input input-sm w-full"
                  value={newLodging.startDate}
                  onChange={(e) => setNewLodging({ ...newLodging, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-base-content/70">Check-out Date</label>
                <input
                  type="date"
                  className="input input-sm w-full"
                  value={newLodging.endDate}
                  onChange={(e) => setNewLodging({ ...newLodging, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input input-sm"
                placeholder="Address (optional)"
                value={newLodging.address}
                onChange={(e) => setNewLodging({ ...newLodging, address: e.target.value })}
              />
              <input
                className="input input-sm"
                placeholder="City (optional)"
                value={newLodging.city}
                onChange={(e) => setNewLodging({ ...newLodging, city: e.target.value })}
              />
            </div>
            <textarea
              className="textarea textarea-sm"
              placeholder="Notes (optional)"
              value={newLodging.notes}
              onChange={(e) => setNewLodging({ ...newLodging, notes: e.target.value })}
              rows={2}
            />
            <div className="card-actions justify-end">
              <button onClick={() => setShowAddLodgingForm(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={() => void handleAddLodging()} className="btn btn-primary btn-sm">
                Add Lodging
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {organizedDays.map((day) => (
          <div key={day.date} className="relative">
            {/* Day Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {day.dayNumber || '•'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold">{day.date}</h3>
                <div className="text-sm opacity-70">
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
                <div className="text-center py-4 opacity-50">
                  <p>No travel, lodging, or meetings planned for this day</p>
                </div>
              ) : (
                day.items.map((item) => (
                  <div key={`${item.type}-${item._id}`}>
                    {item.type === 'leg' ? (
                      <TravelLegCard
                        leg={item}
                        isEditing={editingLeg === item._id}
                        onEdit={() => setEditingLeg(item._id)}
                        onSave={() => setEditingLeg(null)}
                        onCancel={() => setEditingLeg(null)}
                        onDelete={() => void deleteLeg({ id: item._id })}
                        updateLeg={updateLeg}
                      />
                    ) : item.type === 'lodging' ? (
                      <LodgingCard
                        lodging={item}
                        isEditing={editingLodging === item._id}
                        onEdit={() => setEditingLodging(item._id)}
                        onSave={() => setEditingLodging(null)}
                        onCancel={() => setEditingLodging(null)}
                        onDelete={() => void deleteLodging({ id: item._id })}
                        updateLodging={updateLodging}
                        generateGoogleMapsUrl={generateGoogleMapsUrl}
                      />
                    ) : (
                      <MeetingCard 
                        meeting={item} 
                        generateGoogleMapsUrl={generateGoogleMapsUrl}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {organizedDays.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No itinerary items yet</h3>
            <p className="text-base-content/70 mb-4">
              Start by adding travel legs and lodging for your trip.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowAddLegForm(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                Add Travel
              </button>
              <button
                onClick={() => setShowAddLodgingForm(true)}
                className="btn btn-outline btn-sm"
              >
                <Plus className="w-4 h-4" />
                Add Lodging
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingCard({ meeting, generateGoogleMapsUrl, isEditing, onEdit, onSave, onCancel, updateMeeting }: { 
  meeting: any; 
  generateGoogleMapsUrl: (address: string, city?: string) => string;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  updateMeeting?: any;
}) {
  const [editData, setEditData] = useState({
    title: meeting.title,
    scheduledDate: meeting.scheduledDate || "",
    scheduledTime: meeting.scheduledTime || "",
    duration: meeting.duration || 60,
    address: meeting.address || "",
    notes: meeting.notes || "",
  });

  const handleSave = async () => {
    if (updateMeeting) {
      await updateMeeting({
        id: meeting._id,
        title: editData.title,
        scheduledDate: editData.scheduledDate || undefined,
        scheduledTime: editData.scheduledTime || undefined,
        duration: editData.duration || undefined,
        address: editData.address || undefined,
        notes: editData.notes || undefined,
      });
      onSave?.();
    }
  };

  if (isEditing && onEdit) {
    return (
      <div className="p-4 bg-base-100 rounded-lg border-2 border-info">
        <div className="space-y-3">
          <input
            className="input input-sm w-full"
            placeholder="Meeting title"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
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
            <input
              type="number"
              className="input input-sm"
              placeholder="Duration (min)"
              value={editData.duration}
              onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) || 60 })}
            />
          </div>
          <input
            className="input input-sm w-full"
            placeholder="Address"
            value={editData.address}
            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
          />
          <textarea
            className="textarea textarea-sm"
            placeholder="Notes (optional)"
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            rows={2}
          />
        </div>
        <div className="flex gap-2 justify-end mt-3">
          <button onClick={onCancel} className="btn btn-ghost btn-xs">
            Cancel
          </button>
          <button onClick={() => void handleSave()} className="btn btn-info btn-xs">
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-base-100 rounded-lg border-l-4 border-l-info">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-info" />
            <span className="text-sm font-medium">Meeting</span>
            <div className={`badge badge-sm ${
              meeting.status === 'scheduled' ? 'badge-success' :
              meeting.status === 'confirmed' ? 'badge-info' :
              meeting.status === 'completed' ? 'badge-success' :
              'badge-error'
            }`}>
              {meeting.status}
            </div>
          </div>
          <h4 className="font-medium text-lg mb-1">{meeting.title}</h4>
          <div className="space-y-1 text-sm opacity-70">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {meeting.scheduledTime}
              {meeting.duration && ` (${meeting.duration} min)`}
            </div>
            {meeting.address && meeting.address !== 'TBD' && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <a 
                  href={generateGoogleMapsUrl(meeting.address, meeting.city)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {meeting.address}
                  {meeting.city && `, ${meeting.city}`}
                </a>
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
            <p className="text-sm opacity-70 mt-2">{meeting.notes}</p>
          )}
        </div>
        {onEdit && (
          <div className="flex gap-1 no-print">
            <button
              onClick={onEdit}
              className="btn btn-ghost btn-xs"
              title="Edit meeting"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TravelLegCard({ leg, isEditing, onEdit, onSave, onCancel, onDelete, updateLeg }: any) {
  const [editData, setEditData] = useState({
    startCity: leg.startCity,
    endCity: leg.endCity,
    transportation: leg.transportation,
    date: leg.date || "",
    time: leg.time || "",
    reservationNumber: leg.reservationNumber || "",
    notes: leg.notes || "",
    status: leg.status || "tentative",
  });

  const handleSave = async () => {
    await updateLeg({
      id: leg._id,
      startCity: editData.startCity,
      endCity: editData.endCity,
      transportation: editData.transportation,
      date: editData.date || undefined,
      time: editData.time || undefined,
      reservationNumber: editData.reservationNumber || undefined,
      notes: editData.notes || undefined,
      status: editData.status || undefined,
    });
    onSave();
  };

  const IconComponent = transportationIcons[leg.transportation] || MapPin;

  if (isEditing) {
    return (
      <div className="p-4 bg-base-100 rounded-lg border-2 border-primary">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input input-sm"
              placeholder="From city"
              value={editData.startCity}
              onChange={(e) => setEditData({ ...editData, startCity: e.target.value })}
            />
            <input
              className="input input-sm"
              placeholder="To city"
              value={editData.endCity}
              onChange={(e) => setEditData({ ...editData, endCity: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <select
              className="select select-sm"
              value={editData.transportation}
              onChange={(e) => setEditData({ ...editData, transportation: e.target.value as any })}
            >
              <option value="flight">Flight</option>
              <option value="train">Train</option>
              <option value="car">Car</option>
              <option value="bus">Bus</option>
              <option value="boat">Boat</option>
              <option value="other">Other</option>
            </select>
            <select
              className="select select-sm"
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
            >
              <option value="tentative">Tentative</option>
              <option value="confirmed">Confirmed</option>
            </select>
            <input
              type="date"
              className="input input-sm"
              value={editData.date}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
            />
            <input
              type="time"
              className="input input-sm"
              placeholder="Time"
              value={editData.time}
              onChange={(e) => setEditData({ ...editData, time: e.target.value })}
            />
          </div>
          <input
            className="input input-sm"
            placeholder="Reservation Number (optional)"
            value={editData.reservationNumber}
            onChange={(e) => setEditData({ ...editData, reservationNumber: e.target.value })}
          />
          <textarea
            className="textarea textarea-sm"
            placeholder="Notes (optional)"
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            rows={2}
          />
        </div>
        <div className="flex gap-2 justify-end mt-3">
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

  return (
    <div className="p-4 bg-base-100 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className="w-4 h-4 text-primary" />
            <span className="text-sm capitalize font-medium">{leg.transportation}</span>
            {leg.status && (
              <span className={`badge badge-sm ${leg.status === 'confirmed' ? 'badge-warning' : 'badge-neutral'}`}>
                {leg.status}
              </span>
            )}
          </div>
          <h4 className="font-medium text-lg">
            {leg.startCity} → {leg.endCity}
          </h4>
          <div className="space-y-1 text-sm opacity-70 mt-1">
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
            <p className="text-sm opacity-70 mt-1">{leg.notes}</p>
          )}
        </div>
        <div className="flex gap-1 no-print">
          <button
            onClick={onEdit}
            className="btn btn-ghost btn-xs"
            title="Edit leg"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
            title="Delete leg"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LodgingCard({ lodging, isEditing, onEdit, onSave, onCancel, onDelete, updateLodging, generateGoogleMapsUrl }: any) {
  const [editData, setEditData] = useState({
    name: lodging.name,
    address: lodging.address || "",
    city: lodging.city || "",
    notes: lodging.notes || "",
    startDate: lodging.startDate || lodging.date || "",
    endDate: lodging.endDate || lodging.date || "",
    status: lodging.status || "tentative",
  });

  const handleSave = async () => {
    await updateLodging({
      id: lodging._id,
      name: editData.name,
      address: editData.address || undefined,
      city: editData.city || undefined,
      startDate: editData.startDate || undefined,
      endDate: editData.endDate || undefined,
      notes: editData.notes || undefined,
      status: editData.status || undefined,
    });
    onSave();
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-base-100 rounded-lg border-2 border-primary">
        <div className="space-y-3">
          <input
            className="input input-sm w-full"
            placeholder="Hotel/Place name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
          <div>
            <label className="text-sm font-medium text-base-content/70 mb-1 block">Status</label>
            <select
              className="select select-sm w-full"
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
            >
              <option value="tentative">Tentative</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input input-sm"
              placeholder="Address (optional)"
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
            />
            <input
              className="input input-sm"
              placeholder="City (optional)"
              value={editData.city}
              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-base-content/70">Check-in Date</label>
              <input
                type="date"
                className="input input-sm w-full"
                value={editData.startDate}
                onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-base-content/70">Check-out Date</label>
              <input
                type="date"
                className="input input-sm w-full"
                value={editData.endDate}
                onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
              />
            </div>
          </div>
          <textarea
            className="textarea textarea-sm"
            placeholder="Notes (optional)"
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            rows={2}
          />
        </div>
        <div className="flex gap-2 justify-end mt-3">
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

  return (
    <div className="p-4 bg-base-100 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Hotel className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Lodging</span>
            {lodging.status && (
              <span className={`badge badge-sm ${lodging.status === 'confirmed' ? 'badge-warning' : 'badge-neutral'}`}>
                {lodging.status}
              </span>
            )}
          </div>
          <h4 className="font-medium text-lg">{lodging.name}</h4>
          {(lodging.address || lodging.city) && (
            <div className="flex items-center gap-1 text-sm opacity-70 mt-1">
              <MapPin className="w-3 h-3" />
              {lodging.address ? (
                <a 
                  href={generateGoogleMapsUrl(lodging.address, lodging.city)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {lodging.address}{lodging.city && `, ${lodging.city}`}
                </a>
              ) : lodging.city ? (
                <a 
                  href={generateGoogleMapsUrl(lodging.city)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {lodging.city}
                </a>
              ) : null}
            </div>
          )}
          {(lodging.startDate || lodging.endDate || lodging.date) && (
            <div className="flex items-center gap-1 text-sm opacity-70 mt-1">
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
            <p className="text-sm opacity-70 mt-1">{lodging.notes}</p>
          )}
        </div>
        <div className="flex gap-1 no-print">
          <button
            onClick={onEdit}
            className="btn btn-ghost btn-xs"
            title="Edit lodging"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
            title="Delete lodging"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}