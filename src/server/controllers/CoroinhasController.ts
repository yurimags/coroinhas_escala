import { Request, Response } from "express";
import { CoroinhasRepository } from "../repositories/CoroinhasRepository.js";

export class CoroinhasController {
  private repository: CoroinhasRepository;

  constructor() {
    this.repository = new CoroinhasRepository();
    // Vinculando os métodos ao contexto da classe
    this.listarCoroinhas = this.listarCoroinhas.bind(this);
    this.adicionarCoroinha = this.adicionarCoroinha.bind(this);
    this.atualizarCoroinha = this.atualizarCoroinha.bind(this);
    this.deletarCoroinha = this.deletarCoroinha.bind(this);
    this.deletarTodos = this.deletarTodos.bind(this);
    this.importarCoroinhas = this.importarCoroinhas.bind(this);
    this.exportarCoroinhas = this.exportarCoroinhas.bind(this);
    this.resetarEscala = this.resetarEscala.bind(this);
  }

  async listarCoroinhas(req: Request, res: Response) {
    try {
      const coroinhas = await this.repository.listar();
      res.json(coroinhas);
    } catch (error) {
      console.error('Erro ao buscar coroinhas:', error);
      res.status(500).json({ 
        error: 'Erro ao buscar coroinhas',
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }

  async adicionarCoroinha(req: Request, res: Response) {
    try {
      const resultado = await this.repository.adicionar(req.body);
      res.json({
        success: true,
        message: "Coroinha adicionado com sucesso",
        id: resultado.id,
      });
    } catch (error) {
      res.status(500).json({
        error: "Erro ao adicionar coroinha",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async atualizarCoroinha(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.repository.atualizar(parseInt(id), req.body);
      res.json({
        success: true,
        message: "Coroinha atualizado com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        error: "Erro ao atualizar coroinha",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async deletarCoroinha(req: Request, res: Response) {
    try {
      await this.repository.deletar(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar coroinha:', error);
      res.status(500).json({ 
        error: 'Erro ao deletar coroinha',
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }

  async deletarTodos(req: Request, res: Response) {
    try {
      await this.repository.deletarTodos();
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
      if (!req.file) {
        throw new Error("Nenhum arquivo foi enviado");
      }
      const resultado = await this.repository.importar(req.file);
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
      const buffer = await this.repository.exportar();
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

  async resetarEscala(req: Request, res: Response) {
    try {
      await this.repository.resetarEscala(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao resetar escala:', error);
      res.status(500).json({ 
        error: 'Erro ao resetar escala',
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
}
