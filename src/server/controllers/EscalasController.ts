import { Request, Response } from "express";
import { EscalasRepository } from "../repositories/EscalasRepository";

export class EscalasController {
  private repository: EscalasRepository;

  constructor() {
    this.repository = new EscalasRepository();
  }

  async listarEscalas(req: Request, res: Response) {
    try {
      const escalas = await this.repository.listar();
      res.json(escalas);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao listar escalas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async gerarEscala(req: Request, res: Response) {
    try {
      const { locais, dias, horarios, regras, numeroCoroinhas } = req.body;
      const resultado = await this.repository.gerarEscalas({
        locais,
        dias,
        horarios,
        regras,
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

  async atualizarEscala(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { coroinha_id, data, horario, local } = req.body;
      const resultado = await this.repository.atualizar(parseInt(id), {
        coroinha_id,
        data,
        horario,
        local,
      });
      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao atualizar escala",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async cancelarEscala(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultado = await this.repository.cancelar(parseInt(id));
      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao cancelar escala",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async exportarEscalas(req: Request, res: Response) {
    try {
      const buffer = await this.repository.exportar();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", "attachment; filename=escalas.xlsx");
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao exportar escalas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
}
