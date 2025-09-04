import { SignInButton } from "@clerk/clerk-react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated, useMutation } from "convex/react";
import { Calendar, MapPin, Trash2, ArrowLeft } from "lucide-react";
import { api } from "../../convex/_generated/api";

const tripsQueryOptions = convexQuery(api.trips.list, {});

export const Route = createFileRoute("/trips/")({
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(tripsQueryOptions),
  component: TripsPage,
});

function TripsPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="btn btn-ghost btn-sm no-underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Trip Planner</h1>
          <p className="text-lg opacity-80">Plan your trips with detailed travel legs and daily accommodations</p>
        </div>
      </div>

      <div className="text-center">
        <div className="not-prose flex justify-center mb-4">
          <Calendar className="w-16 h-16 text-primary" />
        </div>

        {/* Always show trips dashboard (no auth required for demo) */}
        <TripsDashboard />
      </div>
    </div>
  );
}

function TripsDashboard() {
  const { data: trips } = useSuspenseQuery(tripsQueryOptions);
  const deleteTrip = useMutation(api.trips.deleteTrip);

  const handleDeleteTrip = async (tripId: string, tripName: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to trip details
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${tripName}"? This will also delete all outreach and meetings for this trip.`)) {
      await deleteTrip({ id: tripId as any });
    }
  };

  return (
    <>
      <div className="not-prose mb-6">
        <Link to="/trips/new">
          <button className="btn btn-primary">Create New Trip</button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="not-prose">
          <div className="p-8 bg-base-200 rounded-lg">
            <p className="opacity-70">No trips yet. Create your first trip to get started!</p>
          </div>
        </div>
      ) : (
        <div className="not-prose grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <div key={trip._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <Link to="/trips/$tripId" params={{ tripId: trip._id }} className="flex-1">
                    <h3 className="card-title text-lg hover:text-primary cursor-pointer">{trip.name}</h3>
                    {trip.description && (
                      <p className="text-sm opacity-70 mb-2">{trip.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xl text-red-500 font-bold">
                      <Calendar className="w-5 h-5" />
                      {trip.startDate || 'No dates set'}
                    </div>
                  </Link>
                  <button
                    onClick={(e) => handleDeleteTrip(trip._id, trip.name, e)}
                    className="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content"
                    title="Delete trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="card-actions justify-end mt-2">
                  <Link to="/trips/$tripId" params={{ tripId: trip._id }}>
                    <div className="badge badge-primary cursor-pointer">
                      <MapPin className="w-3 h-3 mr-1" />
                      View Details
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}