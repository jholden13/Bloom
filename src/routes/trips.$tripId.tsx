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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  
  const { data: trip } = useSuspenseQuery(convexQuery(api.trips.get, { id: tripId as any }));
  const { data: tripLegs } = useSuspenseQuery(convexQuery(api.tripLegs.list, { tripId: tripId as any }));
  const { data: lodging } = useSuspenseQuery(convexQuery(api.lodging.list, { tripId: tripId as any }));
  const { data: meetings } = useSuspenseQuery(convexQuery(api.meetings.list, { tripId: tripId as any }));
  const { data: outreach } = useSuspenseQuery(convexQuery(api.outreach.list, { tripId: tripId as any }));
  
  const updateTrip = useMutation(api.trips.update);

  if (trip && !isEditing && !editName) {
    setEditName(trip.name || "");
    setEditDescription(trip.description || "");
    setEditStartDate(trip.startDate || "");
    setEditEndDate(trip.endDate || "");
  }

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
              <div className="not-prose flex items-center justify-center gap-2 text-2xl text-red-500 font-bold mt-2">
                <Calendar className="w-6 h-6" />
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TripItinerarySection tripId={tripId} legs={tripLegs} lodging={lodging} tripStartDate={trip.startDate} tripEndDate={trip.endDate} />
        </div>
        <div className="lg:col-span-1">
          <MeetingsSection tripId={tripId} meetings={meetings} outreach={outreach} />
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

  // Generate all days of the trip
  const generateTripDays = () => {
    const days = [];
    const startDate = tripStartDate ? new Date(tripStartDate) : null;
    const endDate = tripEndDate ? new Date(tripEndDate) : null;
    
    if (!startDate || !endDate) {
      // If no trip dates, create days based on existing legs and lodging
      const allDates = [
        ...legs.filter(leg => leg.date).map(leg => leg.date),
        ...lodging.map(stay => stay.date)
      ];
      const uniqueDates = [...new Set(allDates)].sort();
      return uniqueDates.map(date => ({ date, items: [] }));
    }

    const current = new Date(startDate);
    while (current <= endDate) {
      days.push({
        date: current.toISOString().split('T')[0],
        items: []
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const tripDays = generateTripDays();

  // Organize items by day
  const organizedDays = tripDays.map(day => {
    const dayLegs = legs.filter(leg => leg.date === day.date);
    const dayLodging = lodging.filter(stay => stay.date === day.date);
    
    const items = [
      ...dayLegs.map(leg => ({ ...leg, type: 'leg' })),
      ...dayLodging.map(stay => ({ ...stay, type: 'lodging' }))
    ];
    
    return { ...day, items };
  });

  const handleAddLeg = async () => {
    if (!newLeg.startCity || !newLeg.endCity) return;
    
    await createLeg({
      tripId: tripId as any,
      ...newLeg,
      date: newLeg.date || undefined,
      time: newLeg.time || undefined,
      reservationNumber: newLeg.reservationNumber || undefined,
      notes: newLeg.notes || undefined,
    });
    
    setNewLeg({ startCity: "", endCity: "", transportation: "flight", date: "", time: "", reservationNumber: "", notes: "" });
    setShowAddLegForm(false);
  };

  const handleAddLodging = async () => {
    if (!newLodging.date || !newLodging.name) return;
    
    await createLodging({
      tripId: tripId as any,
      ...newLodging,
      address: newLodging.address || undefined,
      city: newLodging.city || undefined,
      checkIn: newLodging.checkIn || undefined,
      checkOut: newLodging.checkOut || undefined,
      notes: newLodging.notes || undefined,
    });
    
    setNewLodging({ date: "", name: "", address: "", city: "", checkIn: "", checkOut: "", notes: "" });
    setShowAddLodgingForm(false);
  };

  const handleDeleteLeg = async (legId: string) => {
    if (confirm("Are you sure you want to delete this travel leg?")) {
      await deleteLeg({ id: legId as any });
    }
  };

  const handleDeleteLodging = async (lodgingId: string) => {
    if (confirm("Are you sure you want to delete this lodging?")) {
      await deleteLodging({ id: lodgingId as any });
    }
  };

  return (
    <div className="not-prose">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Trip Itinerary</h2>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            Add
          </div>
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
            <li><a onClick={() => setShowAddLegForm(true)}>Add Travel Leg</a></li>
            <li><a onClick={() => setShowAddLodgingForm(true)}>Add Lodging</a></li>
          </ul>
        </div>
      </div>

      {/* Add Travel Leg Form */}
      {showAddLegForm && (
        <div className="card bg-base-100 shadow mb-4">
          <div className="card-body">
            <h3 className="card-title">Add Travel Leg</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="Start City"
                  value={newLeg.startCity}
                  onChange={(e) => setNewLeg({ ...newLeg, startCity: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="End City"
                  value={newLeg.endCity}
                  onChange={(e) => setNewLeg({ ...newLeg, endCity: e.target.value })}
                />
              </div>
              <select
                className="select w-full"
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
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className="input"
                  placeholder="Date"
                  value={newLeg.date}
                  onChange={(e) => setNewLeg({ ...newLeg, date: e.target.value })}
                />
                <input
                  type="time"
                  className="input"
                  placeholder="Time"
                  value={newLeg.time}
                  onChange={(e) => setNewLeg({ ...newLeg, time: e.target.value })}
                />
              </div>
              <input
                className="input"
                placeholder="Reservation Number (optional)"
                value={newLeg.reservationNumber}
                onChange={(e) => setNewLeg({ ...newLeg, reservationNumber: e.target.value })}
              />
              <textarea
                className="textarea"
                placeholder="Notes (optional)"
                value={newLeg.notes}
                onChange={(e) => setNewLeg({ ...newLeg, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="card-actions justify-end">
              <button onClick={() => setShowAddLegForm(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={() => void handleAddLeg()} className="btn btn-primary btn-sm">
                Add Leg
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lodging Form */}
      {showAddLodgingForm && (
        <div className="card bg-base-100 shadow mb-4">
          <div className="card-body">
            <h3 className="card-title">Add Lodging</h3>
            <div className="space-y-3">
              <input
                type="date"
                className="input"
                placeholder="Date"
                value={newLodging.date}
                onChange={(e) => setNewLodging({ ...newLodging, date: e.target.value })}
              />
              <input
                className="input"
                placeholder="Hotel/Lodging Name"
                value={newLodging.name}
                onChange={(e) => setNewLodging({ ...newLodging, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="Address"
                  value={newLodging.address}
                  onChange={(e) => setNewLodging({ ...newLodging, address: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="City"
                  value={newLodging.city}
                  onChange={(e) => setNewLodging({ ...newLodging, city: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  className="input"
                  placeholder="Check-in Time"
                  value={newLodging.checkIn}
                  onChange={(e) => setNewLodging({ ...newLodging, checkIn: e.target.value })}
                />
                <input
                  type="time"
                  className="input"
                  placeholder="Check-out Time"
                  value={newLodging.checkOut}
                  onChange={(e) => setNewLodging({ ...newLodging, checkOut: e.target.value })}
                />
              </div>
              <textarea
                className="textarea"
                placeholder="Notes (optional)"
                value={newLodging.notes}
                onChange={(e) => setNewLodging({ ...newLodging, notes: e.target.value })}
                rows={2}
              />
            </div>
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

      {/* Trip Days */}
      <div className="space-y-4">
        {organizedDays.map((day) => (
          <div key={day.date} className="border-l-2 border-primary pl-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-primary rounded-full -ml-[9px]"></div>
              <h3 className="text-lg font-semibold">
                {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
            </div>
            
            <div className="space-y-3 ml-4">
              {day.items.length === 0 ? (
                <p className="text-sm opacity-70 italic">No activities planned for this day</p>
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
                        onDelete={() => void handleDeleteLeg(item._id)}
                        updateLeg={updateLeg}
                      />
                    ) : (
                      <LodgingCard 
                        lodging={item} 
                        isEditing={editingLodging === item._id}
                        onEdit={() => setEditingLodging(item._id)}
                        onSave={() => setEditingLodging(null)}
                        onCancel={() => setEditingLodging(null)}
                        onDelete={() => void handleDeleteLodging(item._id)}
                        updateLodging={updateLodging}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {organizedDays.length === 0 && (
        <div className="p-6 bg-base-200 rounded-lg text-center">
          <p className="opacity-70">No itinerary items yet.</p>
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={() => setShowAddLegForm(true)}
              className="btn btn-primary btn-sm"
            >
              Add Travel Leg
            </button>
            <button
              onClick={() => setShowAddLodgingForm(true)}
              className="btn btn-secondary btn-sm"
            >
              Add Lodging
            </button>
          </div>
        </div>
      )}
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
      ...editData,
      date: editData.date || undefined,
      time: editData.time || undefined,
      reservationNumber: editData.reservationNumber || undefined,
      notes: editData.notes || undefined,
    });
    onSave();
  };

  const IconComponent = transportationIcons[leg.transportation];

  if (isEditing) {
    return (
      <div className="p-4 bg-base-100 rounded-lg border">
        <h4 className="font-medium text-lg mb-3">Edit Travel Leg</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input input-sm"
              placeholder="Start City"
              value={editData.startCity}
              onChange={(e) => setEditData({ ...editData, startCity: e.target.value })}
            />
            <input
              className="input input-sm"
              placeholder="End City"
              value={editData.endCity}
              onChange={(e) => setEditData({ ...editData, endCity: e.target.value })}
            />
          </div>
          <select
            className="select select-sm w-full"
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
          <div className="grid grid-cols-2 gap-3">
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
      ...editData,
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
      <div className="p-4 bg-base-100 rounded-lg border">
        <h4 className="font-medium text-lg mb-3">Edit Lodging</h4>
        <div className="space-y-3">
          <input
            className="input input-sm"
            placeholder="Hotel/Lodging Name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input input-sm"
              placeholder="Address"
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
            />
            <input
              className="input input-sm"
              placeholder="City"
              value={editData.city}
              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="time"
              className="input input-sm"
              placeholder="Check-in Time"
              value={editData.checkIn}
              onChange={(e) => setEditData({ ...editData, checkIn: e.target.value })}
            />
            <input
              type="time"
              className="input input-sm"
              placeholder="Check-out Time"
              value={editData.checkOut}
              onChange={(e) => setEditData({ ...editData, checkOut: e.target.value })}
            />
          </div>
          <input
            type="date"
            className="input input-sm"
            value={editData.date}
            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
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
        <h2 className="text-xl font-semibold">Meetings & Outreach</h2>
        {meetings.length > 0 && (
          <button
            onClick={() => setShowAddMeetingForm(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Add Meeting
          </button>
        )}
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
              <Link to="/add-outreach" search={{ tripId }} className="btn btn-primary btn-sm">
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
                      {item.contact && (
                        <>
                          <h4 className="font-medium text-lg">{item.contact.name}</h4>
                          {item.organization && <span className="opacity-70">• {item.organization.name}</span>}
                        </>
                      )}
                    </div>
                    <div className="space-y-1 text-sm opacity-70">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Outreach: {item.outreachDate}
                        {item.responseDate && ` • Response: ${item.responseDate}`}
                      </div>
                      {item.contact?.email && (
                        <div className="flex items-center gap-1">
                          <span>📧</span>
                          {item.contact.email}
                        </div>
                      )}
                      {item.contact?.phone && (
                        <div className="flex items-center gap-1">
                          <span>📞</span>
                          {item.contact.phone}
                        </div>
                      )}
                      {item.proposedAddress && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Proposed: {item.proposedAddress}
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

      {/* Empty States */}
      {meetings.length === 0 && outreach.length === 0 && (
        <div className="p-6 bg-base-200 rounded-lg text-center">
          <p className="opacity-70">No meetings or outreach found for this trip.</p>
        </div>
      )}
    </div>
  );
}