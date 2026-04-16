import { pgTable, text, serial, timestamp, numeric, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const artworksTable = pgTable("artworks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  detailImages: text("detail_images").notNull().default("[]"),
  available: boolean("available").notNull().default(true),
  year: integer("year").notNull(),
  dimensions: text("dimensions").notNull(),
  medium: text("medium").notNull(),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArtworkSchema = createInsertSchema(artworksTable).omit({ id: true, createdAt: true });
export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Artwork = typeof artworksTable.$inferSelect;
