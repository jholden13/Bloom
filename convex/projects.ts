import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { name, description }) => {
    return await ctx.db.insert("projects", {
      name,
      description,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, description }) => {
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    
    return await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    // Delete all experts in this project first
    const experts = await ctx.db
      .query("experts")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    
    for (const expert of experts) {
      await ctx.db.delete(expert._id);
    }
    
    // Delete all calls in this project
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_project", (q) => q.eq("projectId", id))
      .collect();
    
    for (const call of calls) {
      await ctx.db.delete(call._id);
    }
    
    // Delete the project
    return await ctx.db.delete(id);
  },
});