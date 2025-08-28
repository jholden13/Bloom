import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const list = query({
  args: { 
    tripId: v.optional(v.id("trips")),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, { tripId, status }) => {
    let meetings;
    
    if (tripId) {
      meetings = await ctx.db
        .query("meetings")
        .withIndex("by_trip", (q) => q.eq("tripId", tripId))
        .collect();
    } else if (status) {
      meetings = await ctx.db
        .query("meetings")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    } else {
      meetings = await ctx.db.query("meetings").collect();
    }

    // Get related data
    const results = await Promise.all(
      meetings.map(async (meeting) => {
        const [contact, organization, outreach] = await Promise.all([
          ctx.db.get(meeting.contactId),
          ctx.db.get(meeting.organizationId),
          ctx.db.get(meeting.outreachId),
        ]);

        return {
          ...meeting,
          contact,
          organization,
          outreach,
        };
      })
    );

    // Sort by scheduled date and time
    return results.sort((a, b) => {
      const dateA = `${a.scheduledDate} ${a.scheduledTime}`;
      const dateB = `${b.scheduledDate} ${b.scheduledTime}`;
      return dateA.localeCompare(dateB);
    });
  },
});

export const create = mutation({
  args: {
    tripId: v.id("trips"),
    outreachId: v.id("outreach"),
    contactId: v.id("contacts"),
    organizationId: v.id("organizations"),
    title: v.string(),
    scheduledDate: v.string(),
    scheduledTime: v.string(),
    duration: v.optional(v.number()),
    address: v.string(),
    streetAddress: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Update the related outreach to "meeting_scheduled"
    await ctx.db.patch(args.outreachId, {
      response: "meeting_scheduled",
      responseDate: new Date().toISOString().split('T')[0],
    });

    return await ctx.db.insert("meetings", {
      ...args,
      status: "scheduled",
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("meetings"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { id, status }) => {
    const meeting = await ctx.db.get(id);
    if (!meeting) {
      throw new ConvexError("Meeting not found");
    }

    await ctx.db.patch(id, { status });
    return id;
  },
});

export const getSchedule = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, { tripId }) => {
    return await ctx.db
      .query("meetings")
      .withIndex("by_trip", (q) => q.eq("tripId", tripId))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("meetings") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("meetings"),
    title: v.optional(v.string()),
    scheduledDate: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    duration: v.optional(v.number()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const meeting = await ctx.db.get(id);
    if (!meeting) {
      throw new ConvexError("Meeting not found");
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});