import { SignInButton } from "@clerk/clerk-react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { Calendar, MapPin, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";

const tripsQueryOptions = convexQuery(api.trips.list, {});

export const Route = createFileRoute("/")({
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(tripsQueryOptions),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="text-center">
      <div className="not-prose flex justify-center mb-4">
        <Calendar className="w-16 h-16 text-primary" />
      </div>
      <h1>Business Trip Scheduler</h1>
      <p className="text-lg opacity-80 mb-6">Manage outreach and schedule meetings for your business trips</p>

      <Unauthenticated>
        <p>Sign in to start managing your business trips and meetings.</p>
        <div className="not-prose mt-4">
          <SignInButton mode="modal">
            <button className="btn btn-primary btn-lg">Get Started</button>
          </SignInButton>
        </div>
      </Unauthenticated>

      <Authenticated>
        <TripsDashboard />
      </Authenticated>
    </div>
  );
}

function TripsDashboard() {
  const { data: trips } = useSuspenseQuery(tripsQueryOptions);

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
            <p className="opacity-70">No trips yet. Create your first business trip to get started!</p>
          </div>
        </div>
      ) : (
        <div className="not-prose grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link key={trip._id} to="/trips/$tripId" params={{ tripId: trip._id }}>
              <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer">
                <div className="card-body">
                  <h3 className="card-title text-lg">{trip.name}</h3>
                  {trip.description && (
                    <p className="text-sm opacity-70 mb-2">{trip.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm opacity-60">
                    <Calendar className="w-4 h-4" />
                    {trip.startDate || 'No dates set'}
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <div className="badge badge-primary">
                      <MapPin className="w-3 h-3 mr-1" />
                      View Details
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
