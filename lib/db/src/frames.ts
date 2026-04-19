import { pgTable, text, serial, timestamp, numeric, boolean } from "drizzle-orm/pg-core";

export const framesTable = pgTable("frames", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  material: text("material").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  priceA5: numeric("price_a5", { precision: 10, scale: 2 }).notNull().default("0"),
  priceA4: numeric("price_a4", { precision: 10, scale: 2 }).notNull().default("0"),
  priceA3: numeric("price_a3", { precision: 10, scale: 2 }).notNull().default("0"),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});