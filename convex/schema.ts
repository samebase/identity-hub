import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  /** The accounts of the console. Only `authAdmin:createOrUpdatePasswordAccount` writes them. */
  users: defineTable({ email: v.string() }).index("email", ["email"]),
});
