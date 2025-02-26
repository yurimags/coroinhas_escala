import { Router } from "express";
import escalasRoutes from "./escalas.routes";
import coroinhasRoutes from "./coroinhas.routes";
import locaisRoutes from "./locais.routes";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas da API
router.use("/api/escalas", escalasRoutes);
router.use("/api/coroinhas", coroinhasRoutes);
router.use("/api/locais", locaisRoutes);

export default router;
