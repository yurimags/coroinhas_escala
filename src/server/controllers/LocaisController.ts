import { Request, Response } from "express";
import { LocaisRepository } from "../repositories/LocaisRepository";

export class LocaisController {
  private repository: LocaisRepository;

  constructor() {
    this.repository = new LocaisRepository();
  }

  async listarLocais(req: Request, res: Response) {
    try {
      const locais = await this.repository.listar();
      res.json(locais);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao buscar locais",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async listarLocaisDisponiveis(req: Request, res: Response) {
    try {
      const locais = await this.repository.listarDisponiveis();
      res.json(locais);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao buscar locais disponíveis",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async listarOpcoesLocais(req: Request, res: Response) {
    try {
      const opcoes = await this.repository.listarOpcoes();
      res.json(opcoes);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao buscar opções",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
}
