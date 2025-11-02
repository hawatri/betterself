import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Define the data structure for finance data
const financeDataSchema = v.object({
  monthlyCredit: v.number(),
  dailyTarget: v.number(),
  totalSavings: v.number(),
  currentMonth: v.string(),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
});

// Define the data structure for daily data
const dailyDataSchema = v.object({
  date: v.string(),
  spending: v.optional(v.array(v.object({
    id: v.string(),
    description: v.string(),
    amount: v.number(),
    timestamp: v.number(),
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
});

// Get user's finance data
export const getFinanceData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("Getting finance data for user:", identity?.subject);
    if (identity === null) {
      // Return null instead of throwing an error
      console.log("User not authenticated");
      return null;
    }
    
    // Get user's finance data from the database
    const userData = await ctx.db
      .query("financeData")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .unique();
    
    console.log("Found finance data:", userData);
    return userData ?? null;
  },
});

// Get user's daily data for a specific date
export const getDailyData = query({
  args: {
    date: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    
    // Get user's daily data for the specified date
    const dailyData = await ctx.db
      .query("dailyData")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.eq(q.field("date"), args.date)
        )
      )
      .unique();
    
    return dailyData ?? null;
  },
});

// Get all user's daily data for a specified month
export const getDailyDataForMonth = query({
  args: {
    year: v.number(),
    month: v.number(), // 0-11 like Date.getMonth()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("Getting daily data for user:", identity?.subject, "year:", args.year, "month:", args.month);
    if (identity === null) {
      console.log("User not authenticated");
      return {};
    }
    
    // Format the month as YYYY-MM
    const monthString = `${args.year}-${String(args.month + 1).padStart(2, '0')}`;
    console.log("Month string:", monthString);
    
    // Get the next month for the range filter
    const nextMonth = new Date(args.year, args.month + 1, 1);
    const nextMonthString = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    console.log("Next month string:", nextMonthString);
    
    // Get all daily data for the specified month
    const dailyDataList = await ctx.db
      .query("dailyData")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.gte(q.field("date"), monthString),
          q.lt(q.field("date"), nextMonthString)
        )
      )
      .collect();
    
    console.log("Found daily data list:", dailyDataList);
    
    // Convert array to object with date as key
    const dailyDataObject: Record<string, unknown> = {};
    dailyDataList.forEach(dailyData => {
      dailyDataObject[dailyData.date] = {
        spending: dailyData.spending,
        tasks: dailyData.tasks,
        notes: dailyData.notes,
        due: dailyData.due,
        savingsTransferred: dailyData.savingsTransferred,
        borrowed: dailyData.borrowed,
        excessSpending: dailyData.excessSpending,
        excessSpendingReason: dailyData.excessSpendingReason,
        createdAt: dailyData.createdAt,
        updatedAt: dailyData.updatedAt,
      };
    });
    
    console.log("Returning daily data object:", dailyDataObject);
    return dailyDataObject;
  },
});

// Get all user's daily data for the current month
export const getAllDailyData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("Getting all daily data for user:", identity?.subject);
    if (identity === null) {
      console.log("User not authenticated");
      return {};
    }
    
    // Get user's finance data to determine current month
    const userData = await ctx.db
      .query("financeData")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .unique();
      
    console.log("User finance data:", userData);
    if (!userData) {
      console.log("No finance data found");
      return {};
    }
    
    // Get all daily data for the current month
    // Filter by userId and dates that are in the current month
    // We'll get all dates that are >= currentMonth and < nextMonth
    const nextMonth = new Date(userData.currentMonth + "-01");
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthString = nextMonth.toISOString().slice(0, 7);
    
    console.log("Filtering daily data for month:", userData.currentMonth, "to", nextMonthString);
    
    const dailyDataList = await ctx.db
      .query("dailyData")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.gte(q.field("date"), userData.currentMonth),
          q.lt(q.field("date"), nextMonthString)
        )
      )
      .collect();
    
    console.log("Found daily data list:", dailyDataList);
    
    // Convert array to object with date as key
    const dailyDataObject: Record<string, unknown> = {};
    dailyDataList.forEach(dailyData => {
      dailyDataObject[dailyData.date] = {
        spending: dailyData.spending,
        tasks: dailyData.tasks,
        notes: dailyData.notes,
        due: dailyData.due,
        savingsTransferred: dailyData.savingsTransferred,
        borrowed: dailyData.borrowed,
        excessSpending: dailyData.excessSpending,
        excessSpendingReason: dailyData.excessSpendingReason,
        createdAt: dailyData.createdAt,
        updatedAt: dailyData.updatedAt,
      };
    });
    
    console.log("Returning daily data object:", dailyDataObject);
    return dailyDataObject;
  },
});

// Save user's finance data
export const saveFinanceData = mutation({
  args: {
    data: financeDataSchema,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated");
    }
    
    // Check if user already has finance data
    const existingData = await ctx.db
      .query("financeData")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .unique();
    
    if (existingData) {
      // Update existing data
      await ctx.db.patch(existingData._id, {
        ...args.data,
        userId: identity.subject,
        updatedAt: Date.now(),
      });
    } else {
      // Create new data
      await ctx.db.insert("financeData", {
        ...args.data,
        userId: identity.subject,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// Save user's daily data
export const saveDailyData = mutation({
  args: {
    date: v.string(), // YYYY-MM-DD format
    data: dailyDataSchema,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated");
    }
    
    console.log("Saving daily data for user:", identity.subject, "date:", args.date, "data:", args.data);
    
    // Check if user already has daily data for this date
    const existingData = await ctx.db
      .query("dailyData")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.eq(q.field("date"), args.date)
        )
      )
      .unique();
    
    if (existingData) {
      console.log("Updating existing daily data");
      console.log("Existing data:", existingData);
      console.log("Args data:", args.data);
      
      // Build update object, only including fields that are actually being updated
      const updateData: any = {
        userId: identity.subject,
        date: args.date,
        updatedAt: Date.now(),
      };
      
      // Only update fields that are being explicitly set (not undefined)
      // Check if value exists and is not null
      const setValue = (key: string, value: any) => {
        if (value !== undefined && value !== null) {
          updateData[key] = value;
        }
      };
      
      setValue("spending", args.data.spending);
      setValue("tasks", args.data.tasks);
      setValue("notes", args.data.notes);
      setValue("due", args.data.due);
      setValue("savingsTransferred", args.data.savingsTransferred);
      setValue("borrowed", args.data.borrowed);
      setValue("excessSpending", args.data.excessSpending);
      setValue("excessSpendingReason", args.data.excessSpendingReason);
      
      console.log("Update data:", updateData);
      
      // Update existing data
      await ctx.db.patch(existingData._id, updateData);
      console.log("Updated successfully");
    } else {
      console.log("Creating new daily data");
      // Create new data
      await ctx.db.insert("dailyData", {
        ...args.data,
        userId: identity.subject,
        date: args.date,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// Update monthly setup
export const updateMonthlySetup = mutation({
  args: {
    monthlyCredit: v.number(),
    dailyTarget: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated");
    }
    
    // Get current finance data
    const existingData = await ctx.db
      .query("financeData")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .unique();
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    if (existingData) {
      // Update existing data
      await ctx.db.patch(existingData._id, {
        monthlyCredit: args.monthlyCredit,
        dailyTarget: args.dailyTarget,
        currentMonth,
        updatedAt: Date.now(),
      });
    } else {
      // Create new data
      await ctx.db.insert("financeData", {
        userId: identity.subject,
        monthlyCredit: args.monthlyCredit,
        dailyTarget: args.dailyTarget,
        totalSavings: 0,
        currentMonth,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});