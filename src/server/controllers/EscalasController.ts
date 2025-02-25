import { Request, Response } from "express";
import { CriarEscalaUseCase } from "../useCases/escalas/CriarEscalaUseCase";
import { GerarEscalaUseCase } from "../useCases/escalas/GerarEscalaUseCase";

export class EscalasController {
  async criarEscala(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim, disponibilidades } = req.body;
      const useCase = new CriarEscalaUseCase();

      const resultado = await useCase.execute(
        new Date(dataInicio),
        new Date(dataFim),
        disponibilidades,
      );

      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao criar escala",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async gerarEscala(req: Request, res: Response) {
    try {
      const { escalaId, data, horario, local, numeroCoroinhas } = req.body;
      const useCase = new GerarEscalaUseCase();

      const resultado = await useCase.execute({
        escalaId,
        data: new Date(data),
        horario,
        local,
        numeroCoroinhas,
      });

      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao gerar escala",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
}
