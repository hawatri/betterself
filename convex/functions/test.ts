import { query } from "../_generated/server";

// Simple test function
export const hello = {
  args: {},
  handler: async () => {
    return "Hello from Convex!";
  },
};

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated");
    }
    return identity;
  },
});