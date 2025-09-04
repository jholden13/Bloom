import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Calendar, Clock, User, Filter, X } from "lucide-react";
import { api } from "@/../convex/_generated/api.js";
import { z } from "zod";

export const Route = createFileRoute("/projects/$projectId/calls")({
  component: CallsPage,
  loader: async ({ context: { queryClient }, params }) => {
    const projectQuery = convexQuery(api.projects.get, { id: params.projectId });
    const callsQuery = convexQuery(api.calls.listByProject, { projectId: params.projectId });
    const expertsQuery = convexQuery(api.experts.listByProject, { projectId: params.projectId });
    const networkGroupsQuery = convexQuery(api.expertNetworkGroups.listByProject, { projectId: params.projectId });
    await Promise.all([
      queryClient.ensureQueryData(projectQuery),
      queryClient.ensureQueryData(callsQuery),
      queryClient.ensureQueryData(expertsQuery),
      queryClient.ensureQueryData(networkGroupsQuery),
    ]);
  },
  validateSearch: (search) => ({
    networkGroup: search.networkGroup as string | undefined,
    status: search.status as string | undefined,
  }),
});

function CallsPage() {
  const { projectId } = Route.useParams();
  const { networkGroup, status } = Route.useSearch();
  const navigate = useNavigate();

  const projectQuery = convexQuery(api.projects.get, { id: projectId });
  const callsQuery = convexQuery(api.calls.listByProject, { projectId });
  const expertsQuery = convexQuery(api.experts.listByProject, { projectId });
  const networkGroupsQuery = convexQuery(api.expertNetworkGroups.listByProject, { projectId });

  const { data: project } = useSuspenseQuery(projectQuery);
  const { data: calls } = useSuspenseQuery(callsQuery);
  const { data: experts } = useSuspenseQuery(expertsQuery);
  const { data: networkGroups } = useSuspenseQuery(networkGroupsQuery);

  if (!project) {
    return <div>Project not found</div>;
  }

  // Create expert lookup map
  const expertMap = experts.reduce((acc, expert) => {
    acc[expert._id] = expert;
    return acc;
  }, {} as Record<string, typeof experts[0]>);

  // Filter calls based on search params
  const filteredCalls = calls.filter((call) => {
    const expert = expertMap[call.expertId];
    
    // Filter by network group
    if (networkGroup && expert.networkGroupId !== networkGroup) {
      return false;
    }
    
    // Filter by status
    if (status && call.status !== status) {
      return false;
    }
    
    return true;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "scheduled":
        return "badge-warning";
      case "confirmed":
        return "badge-info";
      case "completed":
        return "badge-success";
      case "cancelled":
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  const handleFilterChange = (key: string, value: string | undefined) => {
    navigate({
      search: (prev) => ({
        ...prev,
        [key]: value || undefined,
      }),
    });
  };

  const clearFilters = () => {
    navigate({
      search: {},
    });
  };

  const hasActiveFilters = Boolean(networkGroup || status);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate({ to: `/projects/${projectId}` })}
          className="btn btn-ghost mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </button>
        <h1 className="text-3xl font-bold mb-2">Calls for {project.name}</h1>
        <p className="opacity-80">Manage and track expert calls</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Filters:</span>
          </div>

          {/* Network Group Filter */}
          <div className="form-control">
            <select
              className="select select-bordered select-sm w-auto min-w-48"
              value={networkGroup || ""}
              onChange={(e) => handleFilterChange("networkGroup", e.target.value || undefined)}
            >
              <option value="">All Network Groups</option>
              {networkGroups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="form-control">
            <select
              className="select select-bordered select-sm w-auto min-w-32"
              value={status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-ghost btn-sm"
              title="Clear all filters"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </button>
          )}
        </div>

        {/* Active Filter Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {networkGroup && (
              <div className="badge badge-info gap-2">
                Network: {networkGroups.find(g => g._id === networkGroup)?.name}
                <button
                  onClick={() => handleFilterChange("networkGroup", undefined)}
                  className="btn btn-ghost btn-xs p-0 min-h-0 h-auto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {status && (
              <div className="badge badge-info gap-2">
                Status: {status}
                <button
                  onClick={() => handleFilterChange("status", undefined)}
                  className="btn btn-ghost btn-xs p-0 min-h-0 h-auto"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm opacity-70">
        Showing {filteredCalls.length} of {calls.length} calls
      </div>

      {/* Calls List */}
      {filteredCalls.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No calls found</h3>
          <p className="opacity-70">
            {hasActiveFilters 
              ? "No calls match your current filters." 
              : "No calls have been scheduled for this project yet."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCalls.map((call) => {
            const expert = expertMap[call.expertId];
            const networkGroup = expert?.networkGroupId 
              ? networkGroups.find(g => g._id === expert.networkGroupId)
              : null;

            return (
              <div key={call._id} className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="card-title text-lg mb-2">{call.title}</h3>
                      
                      <div className="flex flex-wrap gap-4 text-sm mb-3">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {expert?.name}
                        </div>
                        
                        {networkGroup && (
                          <div className="flex items-center opacity-70">
                            <span className="mr-1">•</span>
                            {networkGroup.name}
                          </div>
                        )}

                        {call.scheduledDate && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {call.scheduledDate}
                          </div>
                        )}

                        {call.scheduledTime && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {call.scheduledTime}
                          </div>
                        )}

                        {call.duration && (
                          <div className="flex items-center opacity-70">
                            <span className="mr-1">•</span>
                            {call.duration} min
                          </div>
                        )}
                      </div>

                      {call.notes && (
                        <p className="text-sm opacity-80 mb-3">{call.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className={`badge ${getStatusBadgeClass(call.status)}`}>
                        {call.status}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}