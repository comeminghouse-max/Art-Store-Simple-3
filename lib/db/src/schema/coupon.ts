import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percent"), // 'percent' | 'fixed'
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Coupon = typeof couponsTable.$inferSelect;
