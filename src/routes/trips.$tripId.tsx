import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Calendar, MapPin, Plane, Train, Car, Bus, Ship, Plus, CheckCircle, Trash2, Edit, Pencil, Hotel, Clock } from "lucide-react";
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

      <div className="grid md:grid-cols-2 gap-6">
        <TravelLegsSection tripId={tripId} legs={tripLegs} />
        <LodgingSection tripId={tripId} lodging={lodging} />
      </div>
    </div>
  );
}

function TravelLegsSection({ tripId, legs }: { tripId: string; legs: any[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLeg, setNewLeg] = useState({
    startCity: "",
    endCity: "",
    transportation: "flight" as const,
    date: "",
    notes: "",
  });

  const createLeg = useMutation(api.tripLegs.create);
  const deleteLeg = useMutation(api.tripLegs.remove);

  const handleAddLeg = async () => {
    if (!newLeg.startCity || !newLeg.endCity) return;
    
    await createLeg({
      tripId: tripId as any,
      ...newLeg,
      date: newLeg.date || undefined,
      notes: newLeg.notes || undefined,
    });
    
    setNewLeg({ startCity: "", endCity: "", transportation: "flight", date: "", notes: "" });
    setShowAddForm(false);
  };

  const handleDeleteLeg = async (legId: string) => {
    if (confirm("Are you sure you want to delete this travel leg?")) {
      await deleteLeg({ id: legId as any });
    }
  };

  return (
    <div className="not-prose">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Travel Legs</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus className="w-4 h-4" />
          Add Leg
        </button>
      </div>

      {showAddForm && (
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
              <input
                type="date"
                className="input"
                placeholder="Date"
                value={newLeg.date}
                onChange={(e) => setNewLeg({ ...newLeg, date: e.target.value })}
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
              <button onClick={() => setShowAddForm(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={handleAddLeg} className="btn btn-primary btn-sm">
                Add Leg
              </button>
            </div>
          </div>
        </div>
      )}

      {legs.length === 0 ? (
        <div className="p-6 bg-base-200 rounded-lg text-center">
          <p className="opacity-70">No travel legs added yet.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary btn-sm mt-2"
          >
            Add First Leg
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {legs
            .sort((a, b) => a.order - b.order)
            .map((leg, index) => {
              const IconComponent = transportationIcons[leg.transportation];
              return (
                <div key={leg._id} className="p-4 bg-base-100 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="badge badge-neutral badge-sm">Leg {index + 1}</div>
                        <IconComponent className="w-4 h-4 text-primary" />
                        <span className="text-sm capitalize">{leg.transportation}</span>
                      </div>
                      <h4 className="font-medium text-lg">
                        {leg.startCity} → {leg.endCity}
                      </h4>
                      {leg.date && (
                        <div className="flex items-center gap-1 text-sm opacity-70 mt-1">
                          <Calendar className="w-3 h-3" />
                          {leg.date}
                        </div>
                      )}
                      {leg.notes && (
                        <p className="text-sm opacity-70 mt-1">{leg.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteLeg(leg._id)}
                      className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                      title="Delete leg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function LodgingSection({ tripId, lodging }: { tripId: string; lodging: any[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLodging, setNewLodging] = useState({
    date: "",
    name: "",
    address: "",
    city: "",
    checkIn: "",
    checkOut: "",
    notes: "",
  });

  const createLodging = useMutation(api.lodging.create);
  const deleteLodging = useMutation(api.lodging.remove);

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
    setShowAddForm(false);
  };

  const handleDeleteLodging = async (lodgingId: string) => {
    if (confirm("Are you sure you want to delete this lodging?")) {
      await deleteLodging({ id: lodgingId as any });
    }
  };

  return (
    <div className="not-prose">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Lodging</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus className="w-4 h-4" />
          Add Lodging
        </button>
      </div>

      {showAddForm && (
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
              <button onClick={() => setShowAddForm(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={handleAddLodging} className="btn btn-primary btn-sm">
                Add Lodging
              </button>
            </div>
          </div>
        </div>
      )}

      {lodging.length === 0 ? (
        <div className="p-6 bg-base-200 rounded-lg text-center">
          <p className="opacity-70">No lodging added yet.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary btn-sm mt-2"
          >
            Add First Lodging
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lodging
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((stay) => (
              <div key={stay._id} className="p-4 bg-base-100 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Hotel className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-lg">{stay.name}</h4>
                    </div>
                    <div className="space-y-1 text-sm opacity-70">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {stay.date}
                      </div>
                      {stay.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {stay.address ? `${stay.address}, ${stay.city}` : stay.city}
                        </div>
                      )}
                      {(stay.checkIn || stay.checkOut) && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {stay.checkIn && `Check-in: ${stay.checkIn}`}
                          {stay.checkIn && stay.checkOut && " | "}
                          {stay.checkOut && `Check-out: ${stay.checkOut}`}
                        </div>
                      )}
                      {stay.notes && <p className="mt-1">{stay.notes}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLodging(stay._id)}
                    className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
                    title="Delete lodging"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}