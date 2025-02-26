import { pool } from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

function getDiaSemana(data: Date): string {
  const dias = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado"
  ];
  return dias[data.getDay()];
}

interface PeriodoEscala {
  id?: number;
  data_inicio: Date;
  data_fim: Date;
  nome: string;
  status?: 'ativo' | 'inativo' | 'finalizado';
  eventos?: Array<{
    data: Date;
    local: string;
    horario: string;
    numeroCoroinhas: number;
  }>;
}

interface DisponibilidadePeriodo {
  periodo_id: number;
  coroinha_id: number;
  disponibilidade_dias: string[];
  disponibilidade_locais: string[];
}

export class PeriodosEscalaRepository {
  async listar() {
    const [rows] = await pool.query(
      'SELECT * FROM PeriodosEscala ORDER BY data_inicio DESC'
    );
    return rows;
  }

  async criar(periodo: PeriodoEscala): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Inserir o período
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO PeriodosEscala (data_inicio, data_fim, nome) VALUES (?, ?, ?)',
        [periodo.data_inicio, periodo.data_fim, periodo.nome]
      );
      
      const periodoId = result.insertId;
      console.log(periodo);
      // Se houver eventos, inserir cada um deles
      if (periodo.eventos && periodo.eventos.length > 0) {
        console.log('Inserindo eventos:', periodo.eventos);
        const insertEventoQuery = 'INSERT INTO EventosPeriodo (periodo_id, data, horario, local, numero_coroinhas, dia_semana) VALUES (?, ?, ?, ?, ?, ?)';
        
        for (const evento of periodo.eventos) {
          const data = new Date(evento.data);
          const diaSemana = getDiaSemana(data);
          await connection.query<ResultSetHeader>(insertEventoQuery, [
            periodoId,
            data,
            evento.horario,
            evento.local,
            evento.numeroCoroinhas,
            diaSemana
          ]);
          console.log('Evento inserido:', evento);
        }
      }

      await connection.commit();
      return periodoId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async criarDisponibilidadePeriodo(disponibilidade: DisponibilidadePeriodo): Promise<void> {
    await pool.query(
      'INSERT INTO DisponibilidadesPeriodo (periodo_id, coroinha_id, disponibilidade_dias, disponibilidade_locais) VALUES (?, ?, ?, ?)',
      [
        disponibilidade.periodo_id,
        disponibilidade.coroinha_id,
        JSON.stringify(disponibilidade.disponibilidade_dias),
        JSON.stringify(disponibilidade.disponibilidade_locais)
      ]
    );
  }

  async obterDisponibilidadesPeriodo(periodo_id: number): Promise<DisponibilidadePeriodo[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM DisponibilidadesPeriodo WHERE periodo_id = ?',
      [periodo_id]
    );
    
    return rows.map(row => ({
      periodo_id: row.periodo_id,
      coroinha_id: row.coroinha_id,
      disponibilidade_dias: JSON.parse(row.disponibilidade_dias),
      disponibilidade_locais: JSON.parse(row.disponibilidade_locais)
    }));
  }

  async registrarServico(coroinha_id: number, periodo_id: number, data: Date, horario: string, local: string): Promise<void> {
    await pool.query(
      'INSERT INTO ServicosRealizados (coroinha_id, periodo_id, data, horario, local) VALUES (?, ?, ?, ?, ?)',
      [coroinha_id, periodo_id, data, horario, local]
    );
  }

  async contarServicos(periodo_id: number, coroinha_id: number): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM ServicosRealizados WHERE periodo_id = ? AND coroinha_id = ?',
      [periodo_id, coroinha_id]
    );
    return rows[0].total;
  }

  async obterCoroinhasDisponiveis(
    periodo_id: number,
    data: Date,
    local: string,
    diaSemana: string
  ): Promise<{ id: number; nome: string; total_servicos: number }[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        c.id,
        c.nome,
        COUNT(e.id) as total_servicos
      FROM Coroinhas c
      LEFT JOIN Escalas e ON e.coroinha_id = c.id AND e.periodo_id = ?
      WHERE 
        (c.disponibilidade_dias LIKE ? OR JSON_CONTAINS(c.disponibilidade_dias, ?)) AND
        (c.disponibilidade_locais LIKE ? OR JSON_CONTAINS(c.disponibilidade_locais, ?))
      GROUP BY c.id
      ORDER BY total_servicos ASC`,
      [periodo_id, `%${diaSemana}%`, JSON.stringify(diaSemana), `%${local}%`, JSON.stringify(local)]
    );

    return rows.map(row => ({
      id: row.id,
      nome: row.nome,
      total_servicos: row.total_servicos
    }));
  }

  async listarEventos(periodo_id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT data, horario, local, numero_coroinhas, dia_semana FROM EventosPeriodo WHERE periodo_id = ? ORDER BY data, horario',
      [periodo_id]
    );
    return rows;
  }
} 