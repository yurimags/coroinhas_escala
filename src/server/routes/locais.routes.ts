import { Router } from "express";
import { LocaisController } from "../controllers/LocaisController";

const router = Router();
const locaisController = new LocaisController();

// List all locations
router.get("/", locaisController.listarLocais.bind(locaisController));

// List available locations
router.get(
  "/disponiveis",
  locaisController.listarLocaisDisponiveis.bind(locaisController),
);

// List location options (includes days of week)
router.get(
  "/opcoes",
  locaisController.listarOpcoesLocais.bind(locaisController),
);

export default router;
