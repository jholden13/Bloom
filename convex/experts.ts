import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("experts")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const listByStatus = query({
  args: { 
    projectId: v.optional(v.id("projects")),
    status: v.union(
      v.literal("rejected"),
      v.literal("pending review"),
      v.literal("maybe"),
      v.literal("schedule call")
    ),
  },
  handler: async (ctx, { projectId, status }) => {
    let query = ctx.db.query("experts").withIndex("by_status", (q) => q.eq("status", status));
    const experts = await query.collect();
    
    if (projectId) {
      return experts.filter(expert => expert.projectId === projectId);
    }
    
    return experts;
  },
});

export const get = query({
  args: { id: v.id("experts") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    biography: v.optional(v.string()),
    network: v.string(),
    cost: v.optional(v.number()),
    costCurrency: v.optional(v.string()),
    status: v.union(
      v.literal("rejected"),
      v.literal("pending review"),
      v.literal("maybe"),
      v.literal("schedule call")
    ),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("experts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("experts"),
    name: v.optional(v.string()),
    biography: v.optional(v.string()),
    network: v.optional(v.string()),
    cost: v.optional(v.number()),
    costCurrency: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("rejected"),
      v.literal("pending review"),
      v.literal("maybe"),
      v.literal("schedule call")
    )),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    notes: v.optional(v.string()),
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
  args: { id: v.id("experts") },
  handler: async (ctx, { id }) => {
    // Delete all calls for this expert first
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_expert", (q) => q.eq("expertId", id))
      .collect();
    
    for (const call of calls) {
      await ctx.db.delete(call._id);
    }
    
    // Delete the expert
    return await ctx.db.delete(id);
  },
});

export const getNetworks = query({
  args: {},
  handler: async (ctx) => {
    const experts = await ctx.db.query("experts").collect();
    const networks = [...new Set(experts.map(expert => expert.network))];
    return networks.sort();
  },
});