import { Router, type IRouter } from "express";
import healthRouter from "./health";
import artworksRouter from "./artworks";
import contactRouter from "./contact";
import ordersRouter from "./orders";
import cartRouter from "./cart";

const router: IRouter = Router();

router.use(healthRouter);
router.use(artworksRouter);
router.use(contactRouter);
router.use(ordersRouter);
router.use(cartRouter);

export default router;
