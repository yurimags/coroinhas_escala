import { Request, Response } from "express";
import { ListarCoroinhasUseCase } from "../useCases/coroinhas/ListarCoroinhasUseCase";
import { AdicionarCoroinhaUseCase } from "../useCases/coroinhas/AdicionarCoroinhaUseCase";
import { AtualizarCoroinhaUseCase } from "../useCases/coroinhas/AtualizarCoroinhaUseCase";
import { DeletarCoroinhaUseCase } from "../useCases/coroinhas/DeletarCoroinhaUseCase";
import { ImportarCoroinhasUseCase } from "../useCases/coroinhas/ImportarCoroinhasUseCase";
import { ExportarCoroinhasUseCase } from "../useCases/coroinhas/ExportarCoroinhasUseCase";

export class CoroinhasController {
  async listarCoroinhas(req: Request, res: Response) {
    try {
      const useCase = new ListarCoroinhasUseCase();
      const coroinhas = await useCase.execute();
      res.json(coroinhas);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao buscar coroinhas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async adicionarCoroinha(req: Request, res: Response) {
    try {
      const useCase = new AdicionarCoroinhaUseCase();
      const resultado = await useCase.execute(req.body);
      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao adicionar coroinha",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async atualizarCoroinha(req: Request, res: Response) {
    try {
      const useCase = new AtualizarCoroinhaUseCase();
      const resultado = await useCase.execute({
        id: parseInt(req.params.id),
        ...req.body,
      });
      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao atualizar coroinha",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async deletarCoroinha(req: Request, res: Response) {
    try {
      const useCase = new DeletarCoroinhaUseCase();
      await useCase.execute(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        error: "Erro ao deletar coroinha",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async deletarTodos(req: Request, res: Response) {
    try {
      const useCase = new DeletarCoroinhaUseCase();
      await useCase.executeDeletarTodos();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        error: "Erro ao deletar todos os coroinhas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async importarCoroinhas(req: Request, res: Response) {
    try {
      const useCase = new ImportarCoroinhasUseCase();
      const resultado = await useCase.execute(req.file);
      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao importar coroinhas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async exportarCoroinhas(req: Request, res: Response) {
    try {
      const useCase = new ExportarCoroinhasUseCase();
      const buffer = await useCase.execute();

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=coroinhas.xlsx",
      );
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao exportar coroinhas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
}
