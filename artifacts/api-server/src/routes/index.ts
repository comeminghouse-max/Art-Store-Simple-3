import { Router, type IRouter } from "express";
import healthRouter from "./health";
import artworksRouter from "./artworks";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(artworksRouter);
router.use(contactRouter);

export default router;
