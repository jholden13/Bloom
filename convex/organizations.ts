import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    return await ctx.db.insert("organizations", args);
  },
});

export const get = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const organization = await ctx.db.get(id);
    if (!organization) {
      throw new ConvexError("Organization not found");
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const getWithContacts = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, { id }) => {
    const organization = await ctx.db.get(id);
    if (!organization) {
      return null;
    }

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_organization", (q) => q.eq("organizationId", id))
      .collect();

    return {
      ...organization,
      contacts,
    };
  },
});