import { Router } from "express";
import { LocaisController } from "../controllers/LocaisController.js";

const router = Router();
const locaisController = new LocaisController();

// List all locations
router.get("/", locaisController.listarLocais);

// List available locations
router.get("/disponiveis", locaisController.listarLocaisDisponiveis);

// List location options (includes days of week)
router.get("/opcoes", locaisController.listarOpcoesLocais);

export default router;
