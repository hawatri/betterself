import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Main finance data table (one per user)
  financeData: defineTable({
    userId: v.string(),
    monthlyCredit: v.number(),
    dailyTarget: v.number(),
    totalSavings: v.number(),
    currentMonth: v.string(),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_currentMonth", ["currentMonth"]),
    
  // Daily data table (one document per day per user)
  dailyData: defineTable({
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD format
    spending: v.optional(v.array(v.object({
      id: v.string(),
      description: v.string(),
      amount: v.number(),
      timestamp: v.number(), // Store as number since Date is not supported
    }))),
    tasks: v.optional(v.array(v.object({
      id: v.string(),
      description: v.string(),
      completed: v.boolean(),
      createdDate: v.string(),
    }))),
    notes: v.optional(v.string()),
    due: v.optional(v.number()),
    savingsTransferred: v.optional(v.number()),
    borrowed: v.optional(v.number()),
    excessSpending: v.optional(v.number()),
    excessSpendingReason: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_date", ["userId", "date"])
    .index("by_date", ["date"]),
});