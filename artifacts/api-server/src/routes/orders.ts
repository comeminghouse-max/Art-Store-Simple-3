import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const CreateOrderBody = z.object({
  userId: z.string().optional(),
  items: z.array(z.object({
    artworkId: z.number(),
    title: z.string(),
    price: z.number(),
    imageUrl: z.string(),
  })),
  total: z.number(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  shippingAddress: z.string(),
  notes: z.string().optional(),
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: parsed.data.userId,
      items: parsed.data.items,
      total: String(parsed.data.total),
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      shippingAddress: parsed.data.shippingAddress,
      notes: parsed.data.notes,
    })
    .returning();

  res.status(201).json({ success: true, orderId: order.id });
});

export default router;
