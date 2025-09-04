import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Calendar } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const apps = [
    {
      name: "Expert Scheduler",
      description: "Manage expert calls by project with status tracking and scheduling",
      icon: Users,
      url: "/projects",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="not-prose flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-primary-content" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">Expert Scheduler</h1>
        <p className="text-xl opacity-80 mb-8">Manage expert calls organized by project with comprehensive status tracking</p>
      </div>

      <div className="not-prose grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => {
          const IconComponent = app.icon;
          return (
            <Link key={app.name} to={app.url} className="block">
              <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="card-body">
                  <div className={`w-16 h-16 ${app.bgColor} rounded-lg flex items-center justify-center mb-4 mx-auto`}>
                    <IconComponent className={`w-8 h-8 ${app.color}`} />
                  </div>
                  <h2 className="card-title text-xl justify-center mb-2">{app.name}</h2>
                  <p className="text-center opacity-70 mb-4">{app.description}</p>
                  <div className="card-actions justify-center">
                    <div className="badge badge-primary cursor-pointer px-4 py-3">
                      Open App
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
