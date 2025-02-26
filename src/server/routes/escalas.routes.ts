import { Router } from "express";
import { EscalasController } from "../controllers/EscalasController.js";

const router = Router();
const escalasController = new EscalasController();

// Rotas de exportação
router.get("/export", escalasController.exportarEscalas);

// Rotas de Períodos
router.get("/periodos", escalasController.listarPeriodos);
router.get("/periodos/:id/eventos", escalasController.listarEventosPeriodo);
router.post("/periodos", escalasController.criarPeriodo);

// Rotas de geração de escalas
router.post("/gerar", escalasController.gerarEscala);
router.post("/criar", escalasController.criarEscala);

// Rotas de manipulação de escalas específicas
router.put("/:id", escalasController.atualizarEscala);
router.delete("/:id", escalasController.deletarEscala);
router.post("/:id/cancelar", escalasController.cancelarEscala);

// Rota de listagem geral (deve vir por último para não conflitar com outras rotas)
router.get("/", escalasController.listarEscalas);

export default router;
