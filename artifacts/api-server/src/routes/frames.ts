import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pgTable, serial, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

// Inline table definition
const framesTable = pgTable("frames", {
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

function parseFrame(f: any) {
  return {
    id: f.id,
    name: f.name,
    material: f.material,
    imageUrl: f.imageUrl,
    priceA5: Number(f.priceA5 || 0),
    priceA4: Number(f.priceA4 || 0),
    priceA3: Number(f.priceA3 || 0),
    available: f.available,
    createdAt: f.createdAt,
  };
}

const router: IRouter = Router();

// GET /frames — lấy tất cả khung
router.get("/frames", async (_req, res): Promise<void> => {
  try {
    const frames = await db.select().from(framesTable).orderBy(framesTable.createdAt);
    res.json(frames.map(parseFrame));
  } catch (err: any) {
    console.error("Get frames error:", err?.message);
    res.status(500).json({ error: "Failed to get frames" });
  }
});

// POST /frames — tạo khung mới
router.post("/frames", async (req, res): Promise<void> => {
  try {
    const b = req.body;
    if (!b.name) { res.status(400).json({ error: "name required" }); return; }
    const [frame] = await db.insert(framesTable).values({
      name: String(b.name),
      material: String(b.material || ""),
      imageUrl: String(b.imageUrl || ""),
      priceA5: String(Number(b.priceA5 || 0)),
      priceA4: String(Number(b.priceA4 || 0)),
      priceA3: String(Number(b.priceA3 || 0)),
      available: b.available !== false,
    }).returning();
    res.status(201).json(parseFrame(frame));
  } catch (err: any) {
    console.error("Create frame error:", err?.message);
    res.status(500).json({ error: "Failed to create frame" });
  }
});

// PUT /frames/:id — cập nhật khung
router.put("/frames/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const b = req.body;
    const [frame] = await db.update(framesTable).set({
      name: String(b.name),
      material: String(b.material || ""),
      imageUrl: String(b.imageUrl || ""),
      priceA5: String(Number(b.priceA5 || 0)),
      priceA4: String(Number(b.priceA4 || 0)),
      priceA3: String(Number(b.priceA3 || 0)),
      available: b.available !== false,
    }).where(eq(framesTable.id, id)).returning();
    if (!frame) { res.status(404).json({ error: "Frame not found" }); return; }
    res.json(parseFrame(frame));
  } catch (err: any) {
    console.error("Update frame error:", err?.message);
    res.status(500).json({ error: "Failed to update frame" });
  }
});

// PATCH /frames/:id — toggle available
router.patch("/frames/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const updates: any = {};
    if (req.body.available !== undefined) updates.available = req.body.available;
    const [frame] = await db.update(framesTable).set(updates).where(eq(framesTable.id, id)).returning();
    if (!frame) { res.status(404).json({ error: "Frame not found" }); return; }
    res.json(parseFrame(frame));
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update frame" });
  }
});

// DELETE /frames/:id — xóa khung
router.delete("/frames/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    await db.delete(framesTable).where(eq(framesTable.id, id));
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete frame" });
  }
});

export default router;
