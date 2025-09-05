import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expertNetworkGroups", {
      projectId: args.projectId,
      name: args.name,
      description: args.description,
      email: args.email,
    });
  },
});

export const get = query({
  args: { id: v.id("expertNetworkGroups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expertNetworkGroups")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("expertNetworkGroups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Remove undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    return await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("expertNetworkGroups") },
  handler: async (ctx, args) => {
    // First, check if there are any experts in this network group
    const expertsInGroup = await ctx.db
      .query("experts")
      .withIndex("by_network_group", (q) => q.eq("networkGroupId", args.id))
      .collect();

    if (expertsInGroup.length > 0) {
      throw new Error("Cannot delete network group that contains experts. Please move or delete the experts first.");
    }

    return await ctx.db.delete(args.id);
  },
});