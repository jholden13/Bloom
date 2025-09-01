import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tripLegs")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    startCity: v.string(),
    endCity: v.string(),
    transportation: v.union(
      v.literal("flight"),
      v.literal("train"),
      v.literal("car"),
      v.literal("bus"),
      v.literal("boat"),
      v.literal("other")
    ),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingLegs = await ctx.db
      .query("tripLegs")
      .withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
      .collect();
    
    const nextOrder = Math.max(0, ...existingLegs.map(leg => leg.order)) + 1;

    return await ctx.db.insert("tripLegs", {
      ...args,
      order: nextOrder,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tripLegs"),
    startCity: v.optional(v.string()),
    endCity: v.optional(v.string()),
    transportation: v.optional(v.union(
      v.literal("flight"),
      v.literal("train"),
      v.literal("car"),
      v.literal("bus"),
      v.literal("boat"),
      v.literal("other")
    )),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("tripLegs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: {
    tripId: v.id("trips"),
    legOrders: v.array(v.object({
      id: v.id("tripLegs"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const { id, order } of args.legOrders) {
      await ctx.db.patch(id, { order });
    }
  },
});