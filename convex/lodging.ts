import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lodging")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    startDate: v.string(),
    endDate: v.string(),
    name: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Ensure we have the required fields for the new schema
    return await ctx.db.insert("lodging", {
      ...args,
      startDate: args.startDate,
      endDate: args.endDate,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("lodging"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    name: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("lodging") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});