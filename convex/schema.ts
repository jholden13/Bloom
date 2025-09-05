import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    analyst: v.optional(v.string()),
    analystEmail: v.optional(v.string()),
    researchAssociate: v.optional(v.string()),
    researchAssociateEmail: v.optional(v.string()),
    startDate: v.optional(v.string()), // ISO date string (YYYY-MM-DD)
    createdBy: v.optional(v.id("users")), // Made optional for demo without auth
  }),

  expertNetworkGroups: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
  })
    .index("by_project", ["projectId"]),

  experts: defineTable({
    projectId: v.id("projects"),
    networkGroupId: v.optional(v.id("expertNetworkGroups")),
    name: v.string(),
    biography: v.optional(v.string()),
    cost: v.optional(v.number()),
    costCurrency: v.optional(v.string()),
    status: v.union(
      v.literal("rejected"),
      v.literal("pending review"),
      v.literal("maybe"),
      v.literal("schedule call")
    ),
    notes: v.optional(v.string()),
    screeningQuestions: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_network_group", ["networkGroupId"])
    .index("by_status", ["status"]),

  calls: defineTable({
    projectId: v.id("projects"),
    expertId: v.id("experts"),
    title: v.string(),
    scheduledDate: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    duration: v.optional(v.number()), // minutes
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  })
    .index("by_project", ["projectId"])
    .index("by_expert", ["expertId"])
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_status", ["status"]),
});
