import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, { organizationId }) => {
    if (organizationId) {
      return await ctx.db
        .query("contacts")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();
    }
    return await ctx.db.query("contacts").collect();
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.string(),
    title: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new ConvexError("Organization not found");
    }

    return await ctx.db.insert("contacts", args);
  },
});

export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getWithOrganization = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, { id }) => {
    const contact = await ctx.db.get(id);
    if (!contact) {
      return null;
    }

    const organization = await ctx.db.get(contact.organizationId);
    return {
      ...contact,
      organization,
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    title: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const contact = await ctx.db.get(id);
    if (!contact) {
      throw new ConvexError("Contact not found");
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});