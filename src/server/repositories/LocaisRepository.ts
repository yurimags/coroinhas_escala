import { pool } from "../config/database.js";

export class LocaisRepository {
  async listar() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT DISTINCT local FROM Escalas');
      return rows.map((row: any) => row.local);
    } finally {
      connection.release();
    }
  }

  async listarDisponiveis() {
    const connection = await pool.getConnection();
    try {
      console.log('Buscando locais disponíveis...');

      // Primeiro, tentar buscar locais da tabela de escalas
      const [locaisEscalas] = await connection.query('SELECT DISTINCT local FROM Escalas');
      const locaisSet = new Set<string>();

      // Adicionar locais das escalas
      locaisEscalas.forEach((row: any) => {
        if (row.local) {
          locaisSet.add(row.local);
        }
      });

      // Buscar locais da disponibilidade dos coroinhas
      const [locaisCoroinhas] = await connection.query(`
        SELECT DISTINCT 
          JSON_UNQUOTE(JSON_EXTRACT(disponibilidade_locais, '$[*]')) as local
        FROM Coroinhas
        WHERE disponibilidade_locais IS NOT NULL
          AND disponibilidade_locais != '[]'
      `);

      // Extrair os locais únicos do resultado
      locaisCoroinhas.forEach((row: any) => {
        if (row.local) {
          const locais = row.local.split(',').map((l: string) => l.trim().replace(/["\[\]]/g, ''));
          locais.forEach(l => locaisSet.add(l));
        }
      });

      // Se não houver locais, retornar lista padrão
      if (locaisSet.size === 0) {
        console.log('Nenhum local encontrado, retornando lista padrão');
        return ['Paróquia', 'Rainha Da Paz', 'Cristo Rei', 'Bom Pastor'];
      }

      const locais = Array.from(locaisSet).sort();
      console.log('Locais encontrados:', locais);
      return locais;

    } catch (error) {
      console.error('Erro ao buscar locais:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async listarOpcoes() {
    const diasSemana = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ];

    const locais = await this.listarDisponiveis();
    
    return {
      diasSemana,
      locais: locais.length > 0 ? locais : ['Paróquia', 'Rainha Da Paz', 'Cristo Rei', 'Bom Pastor']
    };
  }
}
