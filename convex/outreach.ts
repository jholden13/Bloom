import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const list = query({
  args: { 
    tripId: v.optional(v.id("trips")),
    response: v.optional(v.union(
      v.literal("pending"),
      v.literal("interested"),
      v.literal("not_interested"),
      v.literal("no_response"),
      v.literal("meeting_scheduled")
    )),
  },
  handler: async (ctx, { tripId, response }) => {
    let outreach;
    
    if (tripId) {
      outreach = await ctx.db
        .query("outreach")
        .withIndex("by_trip", (q) => q.eq("tripId", tripId))
        .collect();
    } else if (response) {
      outreach = await ctx.db
        .query("outreach")
        .withIndex("by_response", (q) => q.eq("response", response))
        .collect();
    } else {
      outreach = await ctx.db.query("outreach").collect();
    }

    // Get related data
    const results = await Promise.all(
      outreach.map(async (item) => {
        const [contact, organization, user] = await Promise.all([
          ctx.db.get(item.contactId),
          ctx.db.get(item.organizationId),
          ctx.db.get(item.reachedOutBy),
        ]);

        return {
          ...item,
          contact,
          organization,
          reachedOutBy: user,
        };
      })
    );

    return results;
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    contactId: v.id("contacts"),
    organizationId: v.id("organizations"),
    outreachDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    return await ctx.db.insert("outreach", {
      ...args,
      reachedOutBy: user._id,
      response: "pending",
    });
  },
});

export const updateResponse = mutation({
  args: {
    id: v.id("outreach"),
    response: v.union(
      v.literal("pending"),
      v.literal("interested"),
      v.literal("not_interested"),
      v.literal("no_response"),
      v.literal("meeting_scheduled")
    ),
    responseDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const outreach = await ctx.db.get(id);
    if (!outreach) {
      throw new ConvexError("Outreach not found");
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const getSummary = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, { tripId }) => {
    const outreach = await ctx.db
      .query("outreach")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .collect();

    const summary = {
      total: outreach.length,
      pending: 0,
      interested: 0,
      not_interested: 0,
      no_response: 0,
      meeting_scheduled: 0,
    };

    outreach.forEach((item) => {
      summary[item.response]++;
    });

    return summary;
  },
});