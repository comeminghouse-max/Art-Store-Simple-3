import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";

// Inline table definition (tránh import lỗi nếu chưa export từ db)
const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percent"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  maxUses: integer("max_uses").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const router: IRouter = Router();

// GET /coupons — lấy tất cả coupon (admin)
router.get("/coupons", async (_req, res): Promise<void> => {
  try {
    const coupons = await db.select().from(couponsTable)
      .orderBy(couponsTable.createdAt);
    res.json(coupons.map(parseCoupon));
  } catch (err: any) {
    console.error("Get coupons error:", err?.message);
    res.status(500).json({ error: "Failed to get coupons" });
  }
});

// POST /coupons — tạo coupon mới
router.post("/coupons", async (req, res): Promise<void> => {
  try {
    const b = req.body;
    if (!b.code || !b.discountValue) {
      res.status(400).json({ error: "code and discountValue required" });
      return;
    }
    const [coupon] = await db.insert(couponsTable).values({
      code: String(b.code).toUpperCase().trim(),
      discountType: b.discountType || "percent",
      discountValue: String(b.discountValue),
      minOrderAmount: String(Number(b.minOrderAmount) || 0),
      maxUses: Number(b.maxUses) || 1,
      usedCount: 0,
      startsAt: b.startsAt ? new Date(b.startsAt) : null,
      expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
      active: b.active !== false,
    }).returning();
    res.status(201).json(parseCoupon(coupon));
  } catch (err: any) {
    console.error("Create coupon error:", err?.message);
    if (err?.message?.includes("unique")) {
      res.status(409).json({ error: "Mã giảm giá đã tồn tại" });
    } else {
      res.status(500).json({ error: "Failed to create coupon" });
    }
  }
});

// DELETE /coupons/:id — xóa coupon
router.delete("/coupons/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(couponsTable).where(eq(couponsTable.id, id));
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete coupon" });
  }
});

// PATCH /coupons/:id — toggle active
router.patch("/coupons/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const updates: any = {};
    if (req.body.active !== undefined) updates.active = req.body.active;
    const [coupon] = await db.update(couponsTable).set(updates).where(eq(couponsTable.id, id)).returning();
    res.json(parseCoupon(coupon));
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update coupon" });
  }
});

// POST /coupons/validate — kiểm tra mã hợp lệ
router.post("/coupons/validate", async (req, res): Promise<void> => {
  try {
    const code = String(req.body.code || "").toUpperCase().trim();
    const total = Number(req.body.total || 0);

    if (!code) { res.status(400).json({ error: "Vui lòng nhập mã giảm giá" }); return; }

    const [coupon] = await db.select().from(couponsTable)
      .where(eq(couponsTable.code, code));

    if (!coupon) {
      res.status(404).json({ error: "Mã giảm giá không tồn tại" }); return;
    }
    if (!coupon.active) {
      res.status(400).json({ error: "Mã giảm giá đã bị vô hiệu hóa" }); return;
    }
    if (coupon.usedCount >= coupon.maxUses) {
      res.status(400).json({ error: "Mã giảm giá đã hết lượt sử dụng" }); return;
    }
    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      res.status(400).json({ error: "Mã giảm giá chưa đến ngày sử dụng" }); return;
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      res.status(400).json({ error: "Mã giảm giá đã hết hạn" }); return;
    }

    // Kiểm tra đơn hàng tối thiểu
    const minOrder = Number(coupon.minOrderAmount || 0);
    if (minOrder > 0 && total < minOrder) {
      res.status(400).json({
        error: `Minimum order amount is $${minOrder.toLocaleString()} (your cart: $${total.toLocaleString()})`,
      }); return;
    }

    // Tính số tiền giảm
    const value = Number(coupon.discountValue);
    let discount = 0;
    if (coupon.discountType === "percent") {
      discount = Math.round((total * value / 100) * 100) / 100;
    } else {
      discount = Math.min(value, total);
    }
    const finalTotal = Math.max(0, total - discount);

    res.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: value,
      discount: discount,
      finalTotal: finalTotal,
      usedCount: coupon.usedCount,
      maxUses: coupon.maxUses,
      remaining: coupon.maxUses - coupon.usedCount,
    });
  } catch (err: any) {
    console.error("Validate coupon error:", err?.message);
    res.status(500).json({ error: "Không thể kiểm tra mã giảm giá" });
  }
});

// POST /coupons/use — trừ 1 lượt dùng sau thanh toán thành công
router.post("/coupons/use", async (req, res): Promise<void> => {
  try {
    const code = String(req.body.code || "").toUpperCase().trim();
    if (!code) { res.status(400).json({ error: "code required" }); return; }

    const [updated] = await db.update(couponsTable)
      .set({ usedCount: sql`${couponsTable.usedCount} + 1` })
      .where(eq(couponsTable.code, code))
      .returning();

    if (!updated) { res.status(404).json({ error: "Coupon not found" }); return; }

    // Tự động vô hiệu hóa nếu đã dùng hết
    if (updated.usedCount >= updated.maxUses) {
      await db.update(couponsTable).set({ active: false }).where(eq(couponsTable.code, code));
    }

    console.log(`✅ Coupon ${code} used (${updated.usedCount}/${updated.maxUses})`);
    res.json({ success: true, usedCount: updated.usedCount });
  } catch (err: any) {
    console.error("Use coupon error:", err?.message);
    res.status(500).json({ error: "Failed to use coupon" });
  }
});

function parseCoupon(c: any) {
  return {
    id: c.id,
    code: c.code,
    discountType: c.discountType,
    discountValue: Number(c.discountValue),
    minOrderAmount: Number(c.minOrderAmount || 0),
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    active: c.active,
    createdAt: c.createdAt,
    remaining: c.maxUses - c.usedCount,
  };
}

export default router;
