import { Router } from "express";
import coroinhasRoutes from "./coroinhas.routes";
import escalasRoutes from "./escalas.routes";
import locaisRoutes from "./locais.routes";

const router = Router();

router.use("/coroinhas", coroinhasRoutes);
router.use("/escalas", escalasRoutes);
router.use("/locais", locaisRoutes);

export default router;
