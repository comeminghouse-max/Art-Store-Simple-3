import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, artworksTable } from "@workspace/db";
import {
  ListArtworksQueryParams,
  ListArtworksResponse,
  CreateArtworkBody,
  GetArtworkParams,
  GetArtworkResponse,
  GetFeaturedArtworksResponse,
  ListCategoriesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/artworks", async (req, res): Promise<void> => {
  const params = ListArtworksQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(artworksTable).$dynamic();

  if (params.data.available !== undefined) {
    query = query.where(eq(artworksTable.available, params.data.available));
  }

  const artworks = await query.orderBy(desc(artworksTable.createdAt));

  let result = artworks;
  if (params.data.category) {
    result = artworks.filter(
      (a) => a.category.toLowerCase() === params.data.category!.toLowerCase()
    );
  }

  res.json(
    ListArtworksResponse.parse(
      result.map((a) => ({
        ...a,
        price: parseFloat(a.price),
        detailImages: JSON.parse(a.detailImages || "[]"),
      }))
    )
  );
});

router.post("/artworks", async (req, res): Promise<void> => {
  const parsed = CreateArtworkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [artwork] = await db
    .insert(artworksTable)
    .values({ ...parsed.data, price: String(parsed.data.price) })
    .returning();

  res.status(201).json(
    GetArtworkResponse.parse({ ...artwork, price: parseFloat(artwork.price), detailImages: JSON.parse(artwork.detailImages || "[]") })
  );
});

router.get("/artworks/featured", async (_req, res): Promise<void> => {
  const artworks = await db
    .select()
    .from(artworksTable)
    .where(eq(artworksTable.featured, true))
    .orderBy(desc(artworksTable.createdAt));

  res.json(
    GetFeaturedArtworksResponse.parse(
      artworks.map((a) => ({ ...a, price: parseFloat(a.price), detailImages: JSON.parse(a.detailImages || "[]") }))
    )
  );
});

router.get("/artworks/categories", async (_req, res): Promise<void> => {
  const artworks = await db
    .select({ category: artworksTable.category })
    .from(artworksTable);

  const categories = [...new Set(artworks.map((a) => a.category))].sort();
  res.json(ListCategoriesResponse.parse(categories));
});

router.get("/artworks/:id", async (req, res): Promise<void> => {
  const params = GetArtworkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [artwork] = await db
    .select()
    .from(artworksTable)
    .where(eq(artworksTable.id, params.data.id));

  if (!artwork) {
    res.status(404).json({ error: "Artwork not found" });
    return;
  }

  res.json(GetArtworkResponse.parse({ ...artwork, price: parseFloat(artwork.price), detailImages: JSON.parse(artwork.detailImages || "[]") }));
});

export default router;
