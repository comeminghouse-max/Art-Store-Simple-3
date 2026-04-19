import { pgTable, text, serial, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4"; // Hoặc import { z } from "zod"; tuỳ phiên bản dự án của bạn

export const framesTable = pgTable("frames", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  material: text("material").notNull(),
  imageUrl: text("image_url").notNull(),
  // Giá lưu ở dạng số thập phân để có thể để số lẻ như 10.5$
  priceA5: numeric("price_a5", { precision: 10, scale: 2 }).notNull(),
  priceA4: numeric("price_a4", { precision: 10, scale: 2 }).notNull(),
  priceA3: numeric("price_a3", { precision: 10, scale: 2 }).notNull(),
  available: boolean("available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFrameSchema = createInsertSchema(framesTable).omit({ id: true, createdAt: true });
export type InsertFrame = z.infer<typeof insertFrameSchema>;
export type Frame = typeof framesTable.$inferSelect;