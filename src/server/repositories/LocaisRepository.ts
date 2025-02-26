import { pool } from "../config/database";

export class LocaisRepository {
  async listar() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        "SELECT DISTINCT local FROM Escalas",
      );
      return rows.map((row: any) => row.local);
    } finally {
      connection.release();
    }
  }

  async listarDisponiveis() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT DISTINCT 
          JSON_UNQUOTE(JSON_EXTRACT(disponibilidade_locais, '$[*]')) as local
        FROM Coroinhas
        WHERE disponibilidade_locais IS NOT NULL
          AND disponibilidade_locais != '[]'
      `);

      const locaisSet = new Set();
      rows.forEach((row: any) => {
        if (row.local) {
          const locais = row.local
            .split(",")
            .map((l: string) => l.trim().replace(/["\[\]]/g, ""));
          locais.forEach((l: string) => locaisSet.add(l));
        }
      });

      return locaisSet.size > 0
        ? Array.from(locaisSet).sort()
        : ["Paróquia", "Rainha Da Paz", "Cristo Rei", "Bom Pastor"];
    } finally {
      connection.release();
    }
  }

  async listarOpcoes() {
    const connection = await pool.getConnection();
    try {
      const diasSemana = [
        "Domingo",
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
      ];

      const locais = await this.listarDisponiveis();

      return {
        diasSemana,
        locais,
      };
    } finally {
      connection.release();
    }
  }
}
