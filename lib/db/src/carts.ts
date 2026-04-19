import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const cartsTable = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  items: text("items").notNull().default("[]"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
