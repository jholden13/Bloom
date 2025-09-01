import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Calendar, MapPin, Plane, Train, Car, Bus, Ship, Plus, CheckCircle, Trash2, Pencil, Hotel, Clock, Users } from "lucide-react";
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
    <div className="prose prose-invert max-w-none">
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
          <div className="flex justify-center">
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
          <TripItinerarySection tripId={tripId} legs={tripLegs} lodging={lodging} tripStartDate={trip.startDate} tripEndDate={trip.endDate} />
        </div>
        <div className="lg:col-span-1">
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
                    to="/trips/$tripId/meetings" 
                    params={{ tripId }}
                    className="btn btn-primary btn-sm w-full no-underline"
                  >
                    <Users className="w-4 h-4" />
                    Manage Meetings
                  </Link>
                  <Link 
                    to="/add-outreach" 
                    search={{ tripId }} 
                    className="btn btn-outline btn-sm w-full no-underline"
                  >
                    <Plus className="w-4 h-4" />
                    Add Outreach
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TripItinerarySection({ tripId, legs, lodging, tripStartDate, tripEndDate }: { 
  tripId: string; 
  legs: any[]; 
  lodging: any[]; 
  tripStartDate?: string; 
  tripEndDate?: string; 
}) {
  const [editingLeg, setEditingLeg] = useState<string | null>(null);
  const [editingLodging, setEditingLodging] = useState<string | null>(null);
  const [showAddLegForm, setShowAddLegForm] = useState(false);
  const [showAddLodgingForm, setShowAddLodgingForm] = useState(false);
  
  const [newLeg, setNewLeg] = useState({
    startCity: "",
    endCity: "",
    transportation: "flight" as const,
    date: "",
    time: "",
    reservationNumber: "",
    notes: "",
  });

  const [newLodging, setNewLodging] = useState({
    date: "",
    name: "",
    address: "",
    city: "",
    checkIn: "",
    checkOut: "",
    notes: "",
  });

  const createLeg = useMutation(api.tripLegs.create);
  const updateLeg = useMutation(api.tripLegs.update);
  const deleteLeg = useMutation(api.tripLegs.remove);
  const createLodging = useMutation(api.lodging.create);
  const updateLodging = useMutation(api.lodging.update);
  const deleteLodging = useMutation(api.lodging.remove);

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
    if (tripDays.length === 0) {
      const allDates = [
        ...legs.map(l => l.date).filter(Boolean),
        ...lodging.map(l => l.date).filter(Boolean)
      ];
      const uniqueDates = [...new Set(allDates)].sort();
      
      return uniqueDates.map(date => ({
        date,
        dayNumber: null,
        items: [
          ...legs.filter(l => l.date === date).map(l => ({ ...l, type: 'leg' })),
          ...lodging.filter(l => l.date === date).map(l => ({ ...l, type: 'lodging' }))
        ]
      }));
    }

    return tripDays.map(day => {
      const dayLegs = legs.filter(leg => leg.date === day.date);
      const dayLodging = lodging.filter(stay => stay.date === day.date);
      
      const items = [
        ...dayLegs.map(leg => ({ ...leg, type: 'leg' })),
        ...dayLodging.map(stay => ({ ...stay, type: 'lodging' }))
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
    });
    setNewLeg({ 
      startCity: "", 
      endCity: "", 
      transportation: "flight", 
      date: "", 
      time: "", 
      reservationNumber: "", 
      notes: "" 
    });
    setShowAddLegForm(false);
  };

  const handleAddLodging = async () => {
    await createLodging({
      tripId: tripId as any,
      date: newLodging.date,
      name: newLodging.name,
      address: newLodging.address || undefined,
      city: newLodging.city || undefined,
      checkIn: newLodging.checkIn || undefined,
      checkOut: newLodging.checkOut || undefined,
      notes: newLodging.notes || undefined,
    });
    setNewLodging({ 
      date: "", 
      name: "", 
      address: "", 
      city: "", 
      checkIn: "", 
      checkOut: "", 
      notes: "" 
    });
    setShowAddLodgingForm(false);
  };

  return (
    <div className="not-prose">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Trip Itinerary</h2>
        <div className="flex gap-2">
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
            <div className="grid grid-cols-3 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="input input-sm"
                placeholder="Date"
                value={newLodging.date}
                onChange={(e) => setNewLodging({ ...newLodging, date: e.target.value })}
              />
              <input
                className="input input-sm"
                placeholder="Hotel/Place name"
                value={newLodging.name}
                onChange={(e) => setNewLodging({ ...newLodging, name: e.target.value })}
              />
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
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                className="input input-sm"
                placeholder="Check-in time"
                value={newLodging.checkIn}
                onChange={(e) => setNewLodging({ ...newLodging, checkIn: e.target.value })}
              />
              <input
                type="time"
                className="input input-sm"
                placeholder="Check-out time"
                value={newLodging.checkOut}
                onChange={(e) => setNewLodging({ ...newLodging, checkOut: e.target.value })}
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
                  <p>No travel or lodging planned for this day</p>
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
                    ) : (
                      <LodgingCard
                        lodging={item}
                        isEditing={editingLodging === item._id}
                        onEdit={() => setEditingLodging(item._id)}
                        onSave={() => setEditingLodging(null)}
                        onCancel={() => setEditingLodging(null)}
                        onDelete={() => void deleteLodging({ id: item._id })}
                        updateLodging={updateLodging}
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

function TravelLegCard({ leg, isEditing, onEdit, onSave, onCancel, onDelete, updateLeg }: any) {
  const [editData, setEditData] = useState({
    startCity: leg.startCity,
    endCity: leg.endCity,
    transportation: leg.transportation,
    date: leg.date || "",
    time: leg.time || "",
    reservationNumber: leg.reservationNumber || "",
    notes: leg.notes || "",
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
          <div className="grid grid-cols-3 gap-2">
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
        <div className="flex gap-1">
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

function LodgingCard({ lodging, isEditing, onEdit, onSave, onCancel, onDelete, updateLodging }: any) {
  const [editData, setEditData] = useState({
    name: lodging.name,
    address: lodging.address || "",
    city: lodging.city || "",
    checkIn: lodging.checkIn || "",
    checkOut: lodging.checkOut || "",
    notes: lodging.notes || "",
    date: lodging.date,
  });

  const handleSave = async () => {
    await updateLodging({
      id: lodging._id,
      name: editData.name,
      address: editData.address || undefined,
      city: editData.city || undefined,
      checkIn: editData.checkIn || undefined,
      checkOut: editData.checkOut || undefined,
      notes: editData.notes || undefined,
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
            <input
              type="time"
              className="input input-sm"
              placeholder="Check-in time"
              value={editData.checkIn}
              onChange={(e) => setEditData({ ...editData, checkIn: e.target.value })}
            />
            <input
              type="time"
              className="input input-sm"
              placeholder="Check-out time"
              value={editData.checkOut}
              onChange={(e) => setEditData({ ...editData, checkOut: e.target.value })}
            />
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
          </div>
          <h4 className="font-medium text-lg">{lodging.name}</h4>
          {lodging.city && (
            <div className="flex items-center gap-1 text-sm opacity-70 mt-1">
              <MapPin className="w-3 h-3" />
              {lodging.address ? `${lodging.address}, ${lodging.city}` : lodging.city}
            </div>
          )}
          {(lodging.checkIn || lodging.checkOut) && (
            <div className="flex items-center gap-1 text-sm opacity-70 mt-1">
              <Clock className="w-3 h-3" />
              {lodging.checkIn && `Check-in: ${lodging.checkIn}`}
              {lodging.checkIn && lodging.checkOut && " | "}
              {lodging.checkOut && `Check-out: ${lodging.checkOut}`}
            </div>
          )}
          {lodging.notes && (
            <p className="text-sm opacity-70 mt-1">{lodging.notes}</p>
          )}
        </div>
        <div className="flex gap-1">
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