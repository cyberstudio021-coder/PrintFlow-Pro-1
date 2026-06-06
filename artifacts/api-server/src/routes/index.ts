import { Router, type IRouter } from "express";
import healthRouter from "./health";
import printJobsRouter from "./printJobs";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";
import analyticsRouter from "./analytics";
import reportsRouter from "./reports";
import syncRouter from "./sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use(printJobsRouter);
router.use(settingsRouter);
router.use(dashboardRouter);
router.use(analyticsRouter);
router.use(reportsRouter);
router.use(syncRouter);

export default router;
