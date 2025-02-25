import { pool } from "../config/database";
import { Coroinha } from "../types/Coroinha";

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
        "UPDATE Coroinhas SET nome = COALESCE(?, nome), acolito = COALESCE(?, acolito), sub_acolito = COALESCE(?, sub_acolito), disponibilidade_dias = COALESCE(?, disponibilidade_dias), disponibilidade_locais = COALESCE(?, disponibilidade_locais) WHERE id = ?",
        [
          coroinha.nome,
          coroinha.acolito,
          coroinha.sub_acolito,
          diasJson,
          locaisJson,
          id,
        ],
      );

      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  async deletar(id: number) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        "DELETE FROM Coroinhas WHERE id = ?",
        [id],
      );
      return result.affectedRows > 0;
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
    try {
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}
