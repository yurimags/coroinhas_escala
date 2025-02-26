import { Router } from "express";
import { CoroinhasController } from "../controllers/CoroinhasController.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const coroinhasController = new CoroinhasController();

router.get("/", coroinhasController.listarCoroinhas);
router.post("/", coroinhasController.adicionarCoroinha);
router.put("/:id", coroinhasController.atualizarCoroinha);
router.delete("/:id", coroinhasController.deletarCoroinha);
router.delete("/", coroinhasController.deletarTodos);
router.post(
  "/import",
  upload.single("file"),
  coroinhasController.importarCoroinhas,
);
router.get("/export", coroinhasController.exportarCoroinhas);
router.post("/:id/reset-escala", coroinhasController.resetarEscala);

export default router;
