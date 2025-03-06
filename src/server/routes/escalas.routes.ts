import { Router } from "express";
import { EscalasController } from "../controllers/EscalasController.js";

const router = Router();
const escalasController = new EscalasController();

// Rotas de Períodos e Disponibilidades (mais específicas primeiro)
router.post("/periodos/:periodo_id/disponibilidades", escalasController.criarDisponibilidadePeriodo);
router.get("/periodos/:periodo_id/disponibilidades", escalasController.listarDisponibilidadesPeriodo);
router.get("/periodos/:id/eventos", escalasController.listarEventosPeriodo);
router.get("/periodos", escalasController.listarPeriodos);
router.post("/periodos", escalasController.criarPeriodo);

// Rotas de geração de escalas
router.post("/gerar", escalasController.gerarEscala);

// Rotas de manipulação de escalas específicas
router.post("/criar", escalasController.criarEscala);
router.put("/:id", escalasController.atualizarEscala);
router.delete("/:id", escalasController.deletarEscala);
router.post("/:id/cancelar", escalasController.cancelarEscala);

// Rotas de exportação
router.get("/export", escalasController.exportarEscalas);

// Rota de listagem geral (deve vir por último)
router.get("/", escalasController.listarEscalas);

router.get("/disponibilidade/:periodo_id/:data/:local", escalasController.listarCoroinhasDisponiveis);

export default router;
