import { Router, type IRouter } from "express";
import healthRouter from "./health";
import artworksRouter from "./artworks";
import contactRouter from "./contact";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(artworksRouter);
router.use(contactRouter);
router.use(ordersRouter);

export default router;
