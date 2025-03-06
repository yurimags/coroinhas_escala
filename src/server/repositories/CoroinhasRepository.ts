import { pool } from "../config/database";
import { Coroinha } from "../types/Coroinha";
import { PrismaClient } from "@prisma/client";
import xlsx from "xlsx";

const prisma = new PrismaClient();

export class CoroinhasRepository {
  async listar() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query("SELECT * FROM Coroinhas");
      return this.formatarCoroinhas(rows);
    } finally {
      connection.release();
    }
  }

  async exportar() {
    const connection = await pool.getConnection();
    try {
      const [coroinhas] = await connection.query<any[]>(`
        SELECT 
          nome,
          acolito,
          sub_acolito,
          disponibilidade_dias,
          disponibilidade_locais,
          escala
        FROM Coroinhas
        ORDER BY nome ASC
      `);

      const dadosFormatados = (coroinhas as any[]).map((c) => ({
        Nome: c.nome,
        Acólito: c.acolito ? 'Sim' : 'Não',
        'Sub-Acólito': c.sub_acolito ? 'Sim' : 'Não',
        'Dias Disponíveis': this.parseJSON(c.disponibilidade_dias, []).join(', '),
        'Locais Disponíveis': this.parseJSON(c.disponibilidade_locais, []).join(', '),
        'Quantidade de Escalas': c.escala
      }));

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(dadosFormatados);
      xlsx.utils.book_append_sheet(wb, ws, 'Coroinhas');

      return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      console.error('Erro ao exportar coroinhas:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async adicionar(coroinha: Omit<Coroinha, "id">) {
    const connection = await pool.getConnection();
    try {
      const diasJson = JSON.stringify(coroinha.disponibilidade_dias || []);
      const locaisJson = JSON.stringify(coroinha.disponibilidade_locais || []);

      const [result] = await connection.query(
        "INSERT INTO Coroinhas (nome, acolito, sub_acolito, disponibilidade_dias, disponibilidade_locais, escala) VALUES (?, ?, ?, ?, ?, ?)",
        [
          coroinha.nome,
          coroinha.acolito ? 1 : 0,
          coroinha.sub_acolito ? 1 : 0,
          diasJson,
          locaisJson,
          0,
        ],
      );

      return {
        success: true,
        id: result.insertId,
      };
    } finally {
      connection.release();
    }
  }

  async atualizar(id: number, coroinha: Partial<Coroinha>) {
    const connection = await pool.getConnection();
    try {
      const diasJson = coroinha.disponibilidade_dias
        ? JSON.stringify(coroinha.disponibilidade_dias)
        : undefined;
      const locaisJson = coroinha.disponibilidade_locais
        ? JSON.stringify(coroinha.disponibilidade_locais)
        : undefined;

      const [result] = await connection.query(
        `UPDATE Coroinhas SET 
          nome = COALESCE(?, nome), 
          acolito = COALESCE(?, acolito), 
          sub_acolito = COALESCE(?, sub_acolito), 
          disponibilidade_dias = COALESCE(?, disponibilidade_dias), 
          disponibilidade_locais = COALESCE(?, disponibilidade_locais),
          escala = COALESCE(?, escala)
          WHERE id = ?`,
        [
          coroinha.nome,
          coroinha.acolito,
          coroinha.sub_acolito,
          diasJson,
          locaisJson,
          coroinha.escala,
          id,
        ]
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async deletar(id: number) {
    const connection = await pool.getConnection();
    try {
      await connection.query("DELETE FROM Coroinhas WHERE id = ?", [id]);
    } finally {
      connection.release();
    }
  }

  async deletarTodos() {
    const connection = await pool.getConnection();
    try {
      await connection.query("DELETE FROM Coroinhas");
      return true;
    } finally {
      connection.release();
    }
  }

  async resetarEscala(id: number) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        "UPDATE Coroinhas SET escala = 0 WHERE id = ?",
        [id]
      );
    } finally {
      connection.release();
    }
  }

  async resetarTodasEscalas() {
    const connection = await pool.getConnection();
    try {
      await connection.query("UPDATE Coroinhas SET escala = 0");
      return true;
    } finally {
      connection.release();
    }
  }

  async atualizarEscala(id: number, escala: number) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        "UPDATE Coroinhas SET escala = ? WHERE id = ?",
        [escala, id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Coroinha não encontrado');
      }
      
      return true;
    } finally {
      connection.release();
    }
  }

  private formatarCoroinhas(rows: any[]) {
    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      acolito: Boolean(row.acolito),
      sub_acolito: Boolean(row.sub_acolito),
      disponibilidade_dias: this.parseJSON(row.disponibilidade_dias, []),
      disponibilidade_locais: this.parseJSON(row.disponibilidade_locais, []),
      escala: row.escala,
    }));
  }

  private parseJSON(value: string, defaultValue: any[] = []) {
    if (!value) return defaultValue;
    
    try {
      // Se o valor já é um array, retorna ele mesmo
      if (Array.isArray(value)) return value;
      
      // Se é uma string que parece um array JSON
      if (typeof value === 'string' && value.trim().startsWith('[')) {
        return JSON.parse(value);
      }
      
      // Se é uma string simples, retorna como item único em um array
      if (typeof value === 'string') {
        return [value];
      }
      
      return defaultValue;
    } catch {
      // Se falhar o parse, tenta tratar como uma string separada por vírgulas
      if (typeof value === 'string') {
        return value.split(',').map(item => item.trim());
      }
      return defaultValue;
    }
  }
}
