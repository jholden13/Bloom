import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    
    // Get expert details for each call
    const callsWithExperts = await Promise.all(
      calls.map(async (call) => {
        const expert = await ctx.db.get(call.expertId);
        return {
          ...call,
          expert,
        };
      })
    );
    
    return callsWithExperts;
  },
});

export const listByExpert = query({
  args: { expertId: v.id("experts") },
  handler: async (ctx, { expertId }) => {
    return await ctx.db
      .query("calls")
      .withIndex("by_expert", (q) => q.eq("expertId", expertId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("calls") },
  handler: async (ctx, { id }) => {
    const call = await ctx.db.get(id);
    if (!call) return null;
    
    const expert = await ctx.db.get(call.expertId);
    return {
      ...call,
      expert,
    };
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    expertId: v.id("experts"),
    title: v.string(),
    scheduledDate: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("calls", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("calls"),
    title: v.optional(v.string()),
    scheduledDate: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filteredUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    });
    
    return await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("calls") },
  handler: async (ctx, { id }) => {
    return await ctx.db.delete(id);
  },
});