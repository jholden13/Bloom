import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Code, Globe, Palette } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const apps = [
    {
      name: "Trip Planner",
      description: "Plan your trips with detailed travel legs, accommodations, and outreach management",
      icon: Calendar,
      url: "/trips",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    // Add more apps here as you build them
    // {
    //   name: "Portfolio",
    //   description: "Personal portfolio and projects showcase",
    //   icon: Globe,
    //   url: "/portfolio", 
    //   color: "text-green-500",
    //   bgColor: "bg-green-50",
    // },
    // {
    //   name: "Code Lab",
    //   description: "Experimental projects and code snippets",
    //   icon: Code,
    //   url: "/lab",
    //   color: "text-purple-500", 
    //   bgColor: "bg-purple-50",
    // },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="not-prose flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-content">GC</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">gchen.xyz</h1>
        <p className="text-xl opacity-80 mb-8">Welcome to my collection of applications and projects</p>
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

      {apps.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg opacity-70">More apps coming soon...</p>
        </div>
      )}
    </div>
  );
}
