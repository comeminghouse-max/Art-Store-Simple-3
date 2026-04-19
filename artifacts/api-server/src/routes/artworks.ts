import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, artworksTable } from "@workspace/db";

const router: IRouter = Router();

function parseArtwork(a: any) {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    price: parseFloat(a.price),
    imageUrl: a.imageUrl,
    detailImages: JSON.parse(a.detailImages || "[]"),
    tags: JSON.parse(a.tags || "[]"),
    available: a.available,
    year: a.year,
    dimensions: a.dimensions,
    medium: a.medium,
    featured: a.featured,
    editionTotal: a.editionTotal ?? 50,
    editionSold: a.editionSold ?? 0,
    createdAt: a.createdAt,
  };
}

// GET /artworks
router.get("/artworks", async (req, res): Promise<void> => {
  try {
    let query = db.select().from(artworksTable).$dynamic();
    const available = req.query.available;
    if (available !== undefined) {
      query = query.where(eq(artworksTable.available, available === "true"));
    }
    let artworks = await query.orderBy(desc(artworksTable.createdAt));
    const category = req.query.category as string | undefined;
    if (category) {
      artworks = artworks.filter(a => a.category.toLowerCase() === category.toLowerCase());
    }
    res.json(artworks.map(parseArtwork));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /artworks
router.post("/artworks", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const [artwork] = await db.insert(artworksTable).values({
      title: body.title,
      description: body.description,
      category: body.category,
      price: String(body.price),
      imageUrl: body.imageUrl,
      detailImages: JSON.stringify(body.detailImages || []),
      tags: JSON.stringify(body.tags || []),
      available: body.available ?? true,
      year: body.year,
      dimensions: body.dimensions,
      medium: body.medium,
      featured: body.featured ?? false,
      editionTotal: body.editionTotal ?? 50,
      editionSold: body.editionSold ?? 0,
    }).returning();
    res.status(201).json(parseArtwork(artwork));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /artworks/featured
router.get("/artworks/featured", async (_req, res): Promise<void> => {
  try {
    const artworks = await db.select().from(artworksTable)
      .where(eq(artworksTable.featured, true))
      .orderBy(desc(artworksTable.createdAt));
    res.json(artworks.map(parseArtwork));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /artworks/categories
router.get("/artworks/categories", async (_req, res): Promise<void> => {
  try {
    const artworks = await db.select({ category: artworksTable.category }).from(artworksTable);
    const categories = [...new Set(artworks.map(a => a.category))].sort();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /artworks/:id
router.get("/artworks/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [artwork] = await db.select().from(artworksTable).where(eq(artworksTable.id, id));
    if (!artwork) { res.status(404).json({ error: "Artwork not found" }); return; }
    res.json(parseArtwork(artwork));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /artworks/:id
router.put("/artworks/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const body = req.body;
    const [artwork] = await db.update(artworksTable).set({
      title: body.title,
      description: body.description,
      category: body.category,
      price: String(body.price),
      imageUrl: body.imageUrl,
      detailImages: JSON.stringify(body.detailImages || []),
      tags: JSON.stringify(body.tags || []),
      available: body.available,
      year: body.year,
      dimensions: body.dimensions,
      medium: body.medium,
      featured: body.featured,
      editionTotal: body.editionTotal ?? 50,
      editionSold: body.editionSold ?? 0,
    }).where(eq(artworksTable.id, id)).returning();
    if (!artwork) { res.status(404).json({ error: "Artwork not found" }); return; }
    res.json(parseArtwork(artwork));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /artworks/:id
router.delete("/artworks/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    await db.delete(artworksTable).where(eq(artworksTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /artworks/:id/sell — trừ kho sau thanh toán (concurrency-safe)
router.post("/artworks/:id/sell", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const qty = parseInt(req.body.quantity || "1", 10);
    if (isNaN(id) || qty < 1) { res.status(400).json({ error: "Invalid params" }); return; }

    const [updated] = await db
      .update(artworksTable)
      .set({ editionSold: sql`${artworksTable.editionSold} + ${qty}` })
      .where(sql`${artworksTable.id} = ${id} AND ${artworksTable.editionSold} + ${qty} <= ${artworksTable.editionTotal}`)
      .returning();

    if (!updated) {
      res.status(409).json({ error: "Not enough editions available" });
      return;
    }

    res.json({
      success: true,
      editionSold: updated.editionSold,
      editionTotal: updated.editionTotal,
      remaining: updated.editionTotal - updated.editionSold,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
