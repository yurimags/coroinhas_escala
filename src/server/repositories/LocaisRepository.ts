import { pool } from "../config/database.js";

export class LocaisRepository {
  async listarLocais() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT DISTINCT nome FROM locais');
      return rows.map((row: any) => row.nome);
    } finally {
      connection.release();
    }
  }

  async listarDisponiveis() {
    const connection = await pool.getConnection();
    try {
      const locaisUnicos = new Set<string>();

      // Primeiro, buscar locais da tabela de locais
      const [locaisTabela] = await connection.query('SELECT DISTINCT nome FROM locais');

      // Adicionar locais da tabela
      locaisTabela.forEach((row: any) => {
        if (row.nome) {
          locaisUnicos.add(row.nome);
        }
      });

      // Buscar locais da disponibilidade dos coroinhas
      const [locaisCoroinhas] = await connection.query(`
        SELECT disponibilidade_locais 
        FROM Coroinhas
        WHERE disponibilidade_locais IS NOT NULL
      `);

      // Adicionar locais dos coroinhas
      locaisCoroinhas.forEach((row: any) => {
        if (row.disponibilidade_locais) {
          try {
            let locais;
            if (Array.isArray(row.disponibilidade_locais)) {
              locais = row.disponibilidade_locais;
            } else if (typeof row.disponibilidade_locais === 'string') {
              if (row.disponibilidade_locais.trim().startsWith('[')) {
                locais = JSON.parse(row.disponibilidade_locais);
              } else {
                locais = [row.disponibilidade_locais];
              }
            }
            
            if (Array.isArray(locais)) {
              locais.forEach((local: string) => locaisUnicos.add(local));
            }
          } catch (error) {
            console.error('Erro ao processar disponibilidade_locais:', error);
            // Se falhar o parse, tenta tratar como uma string separada por vírgulas
            if (typeof row.disponibilidade_locais === 'string') {
              row.disponibilidade_locais.split(',')
                .map((local: string) => local.trim())
                .filter((local: string) => local)
                .forEach((local: string) => locaisUnicos.add(local));
            }
          }
        }
      });

      return Array.from(locaisUnicos);
    } catch (error) {
      console.error('Erro ao listar locais disponíveis:', error);
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
