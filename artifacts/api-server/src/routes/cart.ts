import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, cartsTable } from "@workspace/db";

const router: IRouter = Router();

// GET /cart?userId=xxx
router.get("/cart", async (req, res): Promise<void> => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }

  try {
    const [cart] = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.userId, userId));

    res.json({ items: JSON.parse(cart?.items || "[]") });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /cart — save/update cart
router.put("/cart", async (req, res): Promise<void> => {
  const { userId, items } = req.body;
  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }

  try {
    const itemsJson = JSON.stringify(items || []);

    // Upsert: nếu chưa có thì tạo mới, đã có thì cập nhật
    const existing = await db
      .select()
      .from(cartsTable)
      .where(eq(cartsTable.userId, userId));

    if (existing.length > 0) {
      await db
        .update(cartsTable)
        .set({ items: itemsJson, updatedAt: new Date() })
        .where(eq(cartsTable.userId, userId));
    } else {
      await db
        .insert(cartsTable)
        .values({ userId, items: itemsJson });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /cart?userId=xxx — clear cart
router.delete("/cart", async (req, res): Promise<void> => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }

  try {
    await db
      .update(cartsTable)
      .set({ items: "[]", updatedAt: new Date() })
      .where(eq(cartsTable.userId, userId));

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
