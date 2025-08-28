import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  trips: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    createdBy: v.id("users"),
  }),

  organizations: defineTable({
    name: v.string(),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
  }),

  contacts: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.string(),
    title: v.optional(v.string()),
    phone: v.optional(v.string()),
  }).index("by_organization", ["organizationId"]),

  outreach: defineTable({
    tripId: v.id("trips"),
    contactId: v.id("contacts"),
    organizationId: v.id("organizations"),
    outreachDate: v.string(),
    reachedOutBy: v.id("users"),
    response: v.union(
      v.literal("pending"),
      v.literal("interested"),
      v.literal("not_interested"),
      v.literal("no_response"),
      v.literal("meeting_scheduled")
    ),
    responseDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    proposedAddress: v.optional(v.string()),
    proposedMeetingTime: v.optional(v.string()),
  })
    .index("by_trip", ["tripId"])
    .index("by_contact", ["contactId"])
    .index("by_organization", ["organizationId"])
    .index("by_response", ["response"]),

  meetings: defineTable({
    tripId: v.id("trips"),
    outreachId: v.id("outreach"),
    contactId: v.id("contacts"),
    organizationId: v.id("organizations"),
    title: v.string(),
    scheduledDate: v.string(),
    scheduledTime: v.string(),
    duration: v.optional(v.number()), // minutes
    address: v.string(),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  })
    .index("by_trip", ["tripId"])
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_status", ["status"]),
});
