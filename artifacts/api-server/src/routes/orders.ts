import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, desc, lt, or, and, sql } from "drizzle-orm";

const router: IRouter = Router();

// POST /orders — tạo order mới
router.post("/orders", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    if (!body.customerName || !body.customerEmail || !body.shippingAddress) {
      res.status(400).json({ error: "Missing required fields" }); return;
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: "No items provided" }); return;
    }
    const [order] = await db.insert(ordersTable).values({
      userId: body.userId || null,
      items: body.items,
      total: Number(body.total || 0).toFixed(2),
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      shippingAddress: body.shippingAddress,
      notes: body.notes || null,
      status: body.status || "pending",
    }).returning();
    console.log(`✅ Order #${order.id} created for ${body.customerEmail}`);
    res.status(201).json({ success: true, orderId: order.id });
  } catch (err: any) {
    console.error("Order creation error:", err?.message);
    res.status(500).json({ error: "Failed to create order: " + (err?.message || "unknown") });
  }
});

// PATCH /orders/:id — cập nhật status và paypalOrderId
router.patch("/orders/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const updates: Record<string, any> = {};
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.paypalOrderId !== undefined) updates.paypalOrderId = req.body.paypalOrderId;
    // Sync cart items + total khi khách thay đổi giỏ hàng
    if (req.body.items !== undefined) updates.items = req.body.items;
    if (req.body.total !== undefined) updates.total = Number(req.body.total).toFixed(2);
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
    const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    console.log(`✅ Order #${id} updated: ${JSON.stringify(updates)}`);
    res.json({ success: true, order });
  } catch (err: any) {
    console.error("Order update error:", err?.message);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// GET /orders — lấy tất cả orders cho admin
router.get("/orders", async (_req, res): Promise<void> => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const parsed = orders.map(o => ({
      ...o,
      items: Array.isArray(o.items) ? o.items : (typeof o.items === "string" ? JSON.parse(o.items as string) : []),
      total: String(o.total),
    }));
    res.json(parsed);
  } catch (err: any) {
    console.error("Get orders error:", err?.message);
    res.status(500).json({ error: "Failed to get orders: " + (err?.message || "unknown") });
  }
});

// DELETE /orders/cleanup — xóa đơn rác cũ hơn 60 ngày
// Xóa các order có status: 'pending', 'cart', 'removed' và tạo > 60 ngày trước
router.delete("/orders/cleanup", async (req, res): Promise<void> => {
  try {
    const days = parseInt(String(req.query.days || "60"));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const deleted = await db.delete(ordersTable)
      .where(
        and(
          or(
            eq(ordersTable.status, "pending"),
            eq(ordersTable.status, "cart"),
            eq(ordersTable.status, "removed"),
          ),
          lt(ordersTable.createdAt, cutoff)
        )
      )
      .returning({ id: ordersTable.id });

    console.log(`🧹 Cleanup: deleted ${deleted.length} old orders (older than ${days} days)`);
    res.json({
      success: true,
      deleted: deleted.length,
      ids: deleted.map(d => d.id),
      cutoffDate: cutoff.toISOString(),
    });
  } catch (err: any) {
    console.error("Cleanup error:", err?.message);
    res.status(500).json({ error: "Cleanup failed: " + (err?.message || "unknown") });
  }
});

export default router;
