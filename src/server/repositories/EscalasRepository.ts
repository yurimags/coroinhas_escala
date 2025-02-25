import { pool } from "../config/database";
import {
  Escala,
  DisponibilidadeEscala,
  EscalaItem,
  ContadorEscala,
} from "../types/Escala";

export class EscalasRepository {
  async criarNovaEscala(dataInicio: Date, dataFim: Date): Promise<number> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Criar nova escala
      const nome = `escala_${dataInicio.toISOString().split("T")[0]}_${dataFim.toISOString().split("T")[0]}`;
      const [result] = await connection.query(
        "INSERT INTO Escalas (nome, data_inicio, data_fim, status) VALUES (?, ?, ?, ?)",
        [nome, dataInicio, dataFim, "ativa"],
      );
      const escalaId = result.insertId;

      // Criar tabela específica para esta escala
      await connection.query(`
        CREATE TABLE ${nome} (
          id INT PRIMARY KEY AUTO_INCREMENT,
          coroinha_id INT,
          data DATE,
          horario TIME,
          local VARCHAR(50),
          status VARCHAR(20) DEFAULT 'agendado',
          FOREIGN KEY (coroinha_id) REFERENCES Coroinhas(id)
        )
      `);

      // Criar tabela de disponibilidades específica
      await connection.query(`
        CREATE TABLE ${nome}_disponibilidades (
          id INT PRIMARY KEY AUTO_INCREMENT,
          coroinha_id INT,
          disponibilidade_dias JSON,
          disponibilidade_locais JSON,
          FOREIGN KEY (coroinha_id) REFERENCES Coroinhas(id)
        )
      `);

      // Criar tabela de contadores
      await connection.query(`
        CREATE TABLE ${nome}_contadores (
          coroinha_id INT,
          quantidade INT DEFAULT 0,
          FOREIGN KEY (coroinha_id) REFERENCES Coroinhas(id),
          PRIMARY KEY (coroinha_id)
        )
      `);

      await connection.commit();
      return escalaId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async definirDisponibilidadePersonalizada(
    escalaId: number,
    disponibilidades: DisponibilidadeEscala[],
  ) {
    const connection = await pool.getConnection();
    try {
      const [escala] = await connection.query(
        "SELECT nome FROM Escalas WHERE id = ?",
        [escalaId],
      );
      const nomeTabela = `${escala[0].nome}_disponibilidades`;

      for (const disp of disponibilidades) {
        await connection.query(
          `INSERT INTO ${nomeTabela} (coroinha_id, disponibilidade_dias, disponibilidade_locais) VALUES (?, ?, ?)`,
          [
            disp.coroinha_id,
            JSON.stringify(disp.disponibilidade_dias),
            JSON.stringify(disp.disponibilidade_locais),
          ],
        );
      }
    } finally {
      connection.release();
    }
  }

  async adicionarItemEscala(
    escalaId: number,
    item: Omit<EscalaItem, "id" | "escala_id">,
  ) {
    const connection = await pool.getConnection();
    try {
      const [escala] = await connection.query(
        "SELECT nome FROM Escalas WHERE id = ?",
        [escalaId],
      );
      const nomeTabela = escala[0].nome;

      // Inserir item na escala
      await connection.query(
        `INSERT INTO ${nomeTabela} (coroinha_id, data, horario, local) VALUES (?, ?, ?, ?)`,
        [item.coroinha_id, item.data, item.horario, item.local],
      );

      // Atualizar contador
      await connection.query(
        `UPDATE ${nomeTabela}_contadores SET quantidade = quantidade + 1 WHERE coroinha_id = ?`,
        [item.coroinha_id],
      );
    } finally {
      connection.release();
    }
  }

  async buscarCoroinhasDisponiveis(
    escalaId: number,
    data: Date,
    local: string,
  ): Promise<any[]> {
    const connection = await pool.getConnection();
    try {
      const [escala] = await connection.query(
        "SELECT nome FROM Escalas WHERE id = ?",
        [escalaId],
      );
      const nomeTabela = escala[0].nome;

      // Buscar coroinhas considerando:
      // 1. Disponibilidade personalizada para esta escala
      // 2. Quantidade de vezes que já foi escalado
      // 3. Prioridade para quem tem menos escalações
      const [coroinhas] = await connection.query(
        `
        SELECT 
          c.*,
          COALESCE(cont.quantidade, 0) as quantidade_escalas
        FROM Coroinhas c
        INNER JOIN ${nomeTabela}_disponibilidades d ON c.id = d.coroinha_id
        LEFT JOIN ${nomeTabela}_contadores cont ON c.id = cont.coroinha_id
        WHERE 
          JSON_CONTAINS(d.disponibilidade_dias, ?) 
          AND JSON_CONTAINS(d.disponibilidade_locais, ?)
        ORDER BY 
          quantidade_escalas ASC,
          c.acolito DESC,
          c.sub_acolito DESC
      `,
        [JSON.stringify(this.getDiaSemana(data)), JSON.stringify(local)],
      );

      return coroinhas;
    } finally {
      connection.release();
    }
  }

  private getDiaSemana(date: Date): string {
    const dias = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    return dias[date.getDay()];
  }
}
