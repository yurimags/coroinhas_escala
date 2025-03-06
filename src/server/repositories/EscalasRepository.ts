import { pool } from "../config/database";
import {
  Escala,
  DisponibilidadeEscala,
  EscalaItem,
  ContadorEscala,
} from "../types/Escala";
import xlsx from "xlsx";
import { RowDataPacket } from "mysql2";

interface EscalaData {
  data: string;
  horario: string;
  local: string;
  coroinha_id: number;
}

interface GerarEscalaParams {
  locais: string[];
  dias: string[];
  horarios: string[];
  regras: {
    prioridadeAcolitos: boolean;
    limiteDiario: number;
  };
  numeroCoroinhas: number;
  periodo_id: number;
}

export class EscalasRepository {
  async criarNovaEscala(dataInicio: Date, dataFim: Date): Promise<number> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Criar nova escala
      const nome = `escala_${dataInicio.toISOString().split("T")[0]}_${dataFim.toISOString().split("T")[0]}`;
      const [result] = await connection.query(
        "INSERT INTO escalas (nome, data_inicio, data_fim, status) VALUES (?, ?, ?, ?)",
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
          FOREIGN KEY (coroinha_id) REFERENCES coroinhas(id)
        )
      `);

      // Criar tabela de disponibilidades específica
      await connection.query(`
        CREATE TABLE ${nome}_disponibilidades (
          id INT PRIMARY KEY AUTO_INCREMENT,
          coroinha_id INT,
          disponibilidade_dias JSON,
          disponibilidade_locais JSON,
          FOREIGN KEY (coroinha_id) REFERENCES coroinhas(id)
        )
      `);

      // Criar tabela de contadores
      await connection.query(`
        CREATE TABLE ${nome}_contadores (
          coroinha_id INT,
          quantidade INT DEFAULT 0,
          FOREIGN KEY (coroinha_id) REFERENCES coroinhas(id),
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
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT nome FROM escalas WHERE id = ?",
        [escalaId]
      );
      const nomeTabela = `${rows[0].nome}_disponibilidades`;

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
        "SELECT nome FROM escalas WHERE id = ?",
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
        "SELECT nome FROM escalas WHERE id = ?",
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
        FROM coroinhas c
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

  async listar(): Promise<Escala[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT e.*, c.nome as coroinha_nome, p.nome as periodo_nome 
         FROM Escalas e 
         LEFT JOIN Coroinhas c ON e.coroinha_id = c.id
         LEFT JOIN periodos_escala p ON e.periodo_id = p.id
         ORDER BY e.data ASC, e.horario ASC`
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async criar(escala: Escala): Promise<Escala> {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'INSERT INTO Escalas (data, horario, local, coroinha_id, periodo_id) VALUES (?, ?, ?, ?, ?)',
        [escala.data, escala.horario, escala.local, escala.coroinha_id, escala.periodo_id]
      );
      
      return {
        id: result.insertId,
        ...escala
      };
    } finally {
      connection.release();
    }
  }

  async gerarEscalas(params: GerarEscalaParams) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const escalasGeradas = [];

      // Ordenar eventos cronologicamente
      const eventos = [];
      for (const local of params.locais) {
        for (const dia of params.dias) {
          const data = this.getNextDateForDay(dia);
          for (const horario of params.horarios) {
            eventos.push({ data, horario, local });
          }
        }
      }
      eventos.sort((a, b) => a.data.getTime() - b.data.getTime());

      // Para cada evento, buscar coroinhas elegíveis
      for (const evento of eventos) {
        // Primeiro, obter a menor quantidade de escalas entre coroinhas disponíveis
        const [minEscalas] = await connection.query<RowDataPacket[]>(
          `SELECT MIN(c.escala) as min_escala
           FROM Coroinhas c
           WHERE JSON_CONTAINS(c.disponibilidade_locais, ?) 
           AND JSON_CONTAINS(c.disponibilidade_dias, ?)`,
          [
            JSON.stringify(evento.local),
            JSON.stringify(this.getDiaSemana(evento.data))
          ]
        );

        const minEscala = minEscalas[0].min_escala || 0;

        // Buscar coroinhas com prioridade para quem tem menos escalas
        const [coroinhas] = await connection.query<RowDataPacket[]>(
          `SELECT c.*, 
            (SELECT COUNT(*) FROM Escalas e 
             WHERE e.coroinha_id = c.id 
             AND DATE(e.data) = ?) as escalas_hoje
           FROM Coroinhas c
           WHERE JSON_CONTAINS(c.disponibilidade_locais, ?) 
           AND JSON_CONTAINS(c.disponibilidade_dias, ?)
           AND c.escala <= ?
           HAVING escalas_hoje < ?
           ORDER BY 
             c.escala ASC,
             RAND()
           LIMIT ?`,
          [
            evento.data.toISOString().split('T')[0],
            JSON.stringify(evento.local),
            JSON.stringify(this.getDiaSemana(evento.data)),
            minEscala + 1,
            params.regras.limiteDiario,
            params.numeroCoroinhas
          ]
        );

        // Selecionar coroinhas para este evento
        for (const coroinha of coroinhas) {
          const [result] = await connection.query(
            'INSERT INTO Escalas (data, horario, local, coroinha_id, periodo_id) VALUES (?, ?, ?, ?, ?)',
            [evento.data, evento.horario, evento.local, coroinha.id, params.periodo_id]
          );

          await connection.query(
            'UPDATE Coroinhas SET escala = escala + 1 WHERE id = ?',
            [coroinha.id]
          );

          escalasGeradas.push({
            id: result.insertId,
            data: evento.data,
            horario: evento.horario,
            local: evento.local,
            coroinha_id: coroinha.id,
            periodo_id: params.periodo_id
          });
        }
      }

      await connection.commit();
      return {
        success: true,
        count: escalasGeradas.length,
        message: `${escalasGeradas.length} escalas geradas com sucesso`,
        data: escalasGeradas
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async atualizar(id: number, escala: EscalaUpdate): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Atualizar a escala
      await connection.query(
        `UPDATE Escalas SET 
          data = COALESCE(?, data),
          horario = COALESCE(?, horario),
          local = COALESCE(?, local),
          coroinha_id = COALESCE(?, coroinha_id)
        WHERE id = ?`,
        [escala.data, escala.horario, escala.local, escala.coroinha_id, id]
      );

      // Se houver mudança no coroinha_id e na escala, atualizar a tabela de Coroinhas
      if (escala.coroinha_id && escala.escala !== undefined) {
        await connection.query(
          'UPDATE Coroinhas SET escala = ? WHERE id = ?',
          [escala.escala, escala.coroinha_id]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deletar(id: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM Escalas WHERE id = ?', [id]);
    } finally {
      connection.release();
    }
  }

  async cancelar(id: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE Escalas SET status = ? WHERE id = ?',
        ['cancelada', id]
      );
    } finally {
      connection.release();
    }
  }

  async exportar() {
    const connection = await pool.getConnection();
    try {
      const [escalas] = await connection.query(
        `SELECT e.data, e.horario, e.local, c.nome as coroinha_nome 
         FROM Escalas e 
         LEFT JOIN Coroinhas c ON e.coroinha_id = c.id
         ORDER BY e.data ASC, e.horario ASC`
      );

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(escalas);
      xlsx.utils.book_append_sheet(wb, ws, 'Escalas');

      return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    } finally {
      connection.release();
    }
  }

  private getNextDateForDay(dia: string): Date {
    const dias: { [key: string]: number } = {
      'Segunda': 1,
      'Terça': 2,
      'Quarta': 3,
      'Quinta': 4,
      'Sexta': 5,
      'Sábado': 6,
      'Domingo': 0
    };
    
    const date = new Date();
    date.setDate(date.getDate() + ((dias[dia] - date.getDay() + 7) % 7));
    return date;
  }

  async incrementarEscala(coroinhaId: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE Coroinhas SET escala = escala + 1 WHERE id = ?',
        [coroinhaId]
      );
    } finally {
      connection.release();
    }
  }

  async listarCoroinhasDisponiveis(periodo_id: number, data: Date, local: string) {
    const connection = await pool.getConnection();
    try {
      const diaSemana = this.getDiaSemana(data);
      
      // Buscar coroinhas considerando disponibilidade personalizada do período primeiro
      const [coroinhas] = await connection.query<RowDataPacket[]>(
        `SELECT 
          c.id,
          c.nome,
          c.escala,
          c.acolito,
          c.sub_acolito,
          COALESCE(dp.disponibilidade_dias, c.disponibilidade_dias) as disponibilidade_dias,
          COALESCE(dp.disponibilidade_locais, c.disponibilidade_locais) as disponibilidade_locais
         FROM Coroinhas c
         LEFT JOIN disponibilidades_periodo dp ON c.id = dp.coroinha_id AND dp.periodo_id = ?
         WHERE 
           (JSON_CONTAINS(COALESCE(dp.disponibilidade_dias, c.disponibilidade_dias), ?) 
           AND JSON_CONTAINS(COALESCE(dp.disponibilidade_locais, c.disponibilidade_locais), ?))
         ORDER BY c.escala ASC`,
        [periodo_id, JSON.stringify(diaSemana), JSON.stringify(local)]
      );

      return coroinhas;
    } finally {
      connection.release();
    }
  }
}
