import { Router } from "express";
import { EscalasController } from "../controllers/EscalasController";

const router = Router();
const escalasController = new EscalasController();

router.post("/criar", escalasController.criarEscala);
router.post("/gerar", escalasController.gerarEscala);

export default router;
