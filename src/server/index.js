import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import multer from 'multer';
import xlsx from 'xlsx';

const app = express();

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configurações
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Adicione todas as origens permitidas
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Parse DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL);

// Pool de conexões MySQL usando as credenciais do DATABASE_URL
const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port),
  user: dbUrl.username,
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.substring(1), // Remove a barra inicial
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const upload = multer({ storage: multer.memoryStorage() });

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor está funcionando!' });
});

// Rota para listar todos os coroinhas
app.get('/api/coroinhas', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Coroinhas');
    
    const formattedRows = rows.map(row => {
      try {
        const diasStr = row.disponibilidade_dias?.toString() || '[]';
        const locaisStr = row.disponibilidade_locais?.toString() || '[]';

        let disponibilidade_dias;
        let disponibilidade_locais;

        try {
          disponibilidade_dias = JSON.parse(diasStr);
        } catch (e) {
          disponibilidade_dias = diasStr.replace(/[\[\]"]/g, '').split(',').filter(Boolean);
        }

        try {
          disponibilidade_locais = JSON.parse(locaisStr);
        } catch (e) {
          disponibilidade_locais = locaisStr.replace(/[\[\]"]/g, '').split(',').filter(Boolean);
        }

        return {
          id: row.id,
          nome: row.nome,
          acolito: Boolean(row.acolito),
          sub_acolito: Boolean(row.sub_acolito),
          disponibilidade_dias: Array.isArray(disponibilidade_dias) ? disponibilidade_dias : [],
          disponibilidade_locais: Array.isArray(disponibilidade_locais) ? disponibilidade_locais : [],
          escala: row.escala
        };
      } catch (error) {
        return {
          id: row.id,
          nome: row.nome,
          acolito: Boolean(row.acolito),
          sub_acolito: Boolean(row.sub_acolito),
          disponibilidade_dias: [],
          disponibilidade_locais: [],
          escala: row.escala
        };
      }
    });

    res.json(formattedRows);

  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar coroinhas',
      details: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Rota para atualizar um coroinha
app.put('/api/coroinhas/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;
    const { nome, acolito, sub_acolito, disponibilidade_dias, disponibilidade_locais } = req.body;

    // Normalizar os nomes dos locais se necessário
    const locaisNormalizados = disponibilidade_locais.map(local => {
      switch(local) {
        case 'Igreja Matriz': return 'Paróquia';
        case 'Capela Rainha da Paz': return 'Rainha DaPaz';
        case 'Capela Cristo Rei': return 'CristoR ei';
        case 'Capela Bom Pastor': return 'Bom Pastor';
        default: return local;
      }
    });

    const diasJson = JSON.stringify(disponibilidade_dias || []);
    const locaisJson = JSON.stringify(locaisNormalizados || []);

    const [result] = await connection.query(
      'UPDATE Coroinhas SET nome = ?, acolito = ?, sub_acolito = ?, disponibilidade_dias = ?, disponibilidade_locais = ? WHERE id = ?',
      [nome, acolito ? 1 : 0, sub_acolito ? 1 : 0, diasJson, locaisJson, id]
    );

    console.log('Resultado da query:', result);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Coroinha não encontrado' });
      return;
    }

    res.json({ 
      success: true,
      message: 'Coroinha atualizado com sucesso',
      id: id
    });

  } catch (error) {
    console.error('Erro ao atualizar coroinha:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar coroinha',
      details: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
// Adicione essas constantes no topo do arquivo do servidor
const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DIAS_COMPLETOS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

app.post('/api/escalas/gerar', async (req, res) => {
  let connection;
  try {
    const { locais, dias, horarios, regras, numeroCoroinhas } = req.body;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Converter dias abreviados para completos (Seg -> Segunda)
    const diasCompletos = dias.map(dia => DIAS_COMPLETOS[DIAS_SEMANA.indexOf(dia)]);

    // Gerar todas combinações de local/dia/horário
    const escalasGeradas = [];

    for (const local of locais) {
      for (const dia of diasCompletos) {
        // Encontrar próxima data correspondente ao dia da semana
        const data = getNextDateForDay(dia);

        for (const horario of horarios) {
          // 1. Buscar coroinhas disponíveis
          const [coroinhas] = await connection.query(
            `SELECT c.*, 
              (SELECT COUNT(*) FROM Escalas e 
               WHERE e.coroinha_id = c.id 
               AND DATE(e.data) = ?) as escalas_hoje
             FROM Coroinhas c
             WHERE JSON_CONTAINS(c.disponibilidade_locais, ?) 
             AND JSON_CONTAINS(c.disponibilidade_dias, ?)
             HAVING escalas_hoje < ?
             ORDER BY 
               ${regras.prioridadeAcolitos ? 'c.acolito DESC, c.sub_acolito DESC,' : ''}
               c.escala ASC
             LIMIT ?`, // Limite de posições por escala
            [data.toISOString().split('T')[0], 
             JSON.stringify(local), 
             JSON.stringify(dia),
             regras.limiteDiario,
             numeroCoroinhas] // Usar o número de coroinhas como limite
          );

          // 2. Criar registros de escala para os coroinhas selecionados
          for (const coroinha of coroinhas) {
            const [result] = await connection.query(
              'INSERT INTO Escalas (data, horario, local, coroinha_id) VALUES (?, ?, ?, ?)',
              [data, horario, local, coroinha.id]
            );

            // Atualizar contador de escalas do coroinha
            await connection.query(
              'UPDATE Coroinhas SET escala = escala + 1 WHERE id = ?',
              [coroinha.id]
            );

            escalasGeradas.push({
              id: result.insertId,
              data,
              horario,
              local,
              coroinha_id: coroinha.id
            });
          }
        }
      }
    }

    await connection.commit();

    res.json({
      success: true,
      count: escalasGeradas.length,
      message: `${escalasGeradas.length} escalas geradas com sucesso`,
      data: escalasGeradas
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao gerar escalas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar escalas',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Função auxiliar para obter próxima data para um dia da semana
function getNextDateForDay(dia) {
  const dias = {
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

// Rota para deletar um coroinha
app.delete('/api/coroinhas/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { id } = req.params;

    console.log(`Deletando coroinha ${id}`);

    const [result] = await connection.query(
      'DELETE FROM Coroinhas WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Coroinha não encontrado' });
      return;
    }

    console.log(`Coroinha ${id} deletado com sucesso`);
    res.json({ 
      success: true,
      message: 'Coroinha deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar coroinha:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar coroinha',
      details: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Rota para resetar a escala de um coroinha
app.post('/api/coroinhas/:id/reset-escala', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE Coroinhas SET escala = 0 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Escala resetada com sucesso!' });
  } catch (error) {
    console.error('Erro ao resetar escala:', error);
    res.status(500).json({ error: 'Erro ao resetar escala' });
  }
});

// Rota para importar coroinhas
app.post('/api/coroinhas/import', upload.single('file'), async (req, res) => {
  let connection;
  try {
    if (!req.file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const rawData = xlsx.utils.sheet_to_json(worksheet);
    
    const coroinhas = rawData.map(row => {
      const dias = [];
      if (row['Segunda'] === 'Sim' || row['Segunda'] === true) dias.push('Segunda');
      if (row['Terça'] === 'Sim' || row['Terça'] === true) dias.push('Terça');
      if (row['Quarta'] === 'Sim' || row['Quarta'] === true) dias.push('Quarta');
      if (row['Quinta'] === 'Sim' || row['Quinta'] === true) dias.push('Quinta');
      if (row['Sexta'] === 'Sim' || row['Sexta'] === true) dias.push('Sexta');
      if (row['Sábado'] === 'Sim' || row['Sábado'] === true) dias.push('Sábado');
      if (row['Domingo'] === 'Sim' || row['Domingo'] === true) dias.push('Domingo');

      const locais = [];
      if (row['Paróquia'] === 'Sim' || row['Paróquia'] === true) locais.push('Paróquia');
      if (row['Rainha da Paz'] === 'Sim' || row['RainhaDaPaz'] === true) locais.push('Rainha Da Paz');
      if (row['Cristo Rei'] === 'Sim' || row['CristoRei'] === true) locais.push('Cristo Rei');
      if (row['Bom Pastor'] === 'Sim' || row['BomPastor'] === true) locais.push('Bom Pastor');

      return {
        nome: row['Nome'] || '',
        acolito: row['Acólito'] === 'Sim' || row['Acólito'] === true ? 1 : 0,
        sub_acolito: row['Sub-Acólito'] === 'Sim' || row['Sub-Acólito'] === true ? 1 : 0,
        disponibilidade_dias: JSON.stringify(dias),
        disponibilidade_locais: JSON.stringify(locais),
        escala: 0
      };
    }).filter(coroinha => coroinha.nome.trim() !== '');

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Limpa a tabela atual
    await connection.query('DELETE FROM Coroinhas');
    
    // Insere os novos dados
    for (const coroinha of coroinhas) {
      await connection.query(
        'INSERT INTO Coroinhas (nome, acolito, sub_acolito, disponibilidade_dias, disponibilidade_locais, escala) VALUES (?, ?, ?, ?, ?, ?)',
        [
          coroinha.nome,
          coroinha.acolito,
          coroinha.sub_acolito,
          coroinha.disponibilidade_dias,
          coroinha.disponibilidade_locais,
          coroinha.escala
        ]
      );
    }

    const todosLocais = coroinhas.flatMap(c => {
      try {
        return JSON.parse(c.disponibilidade_locais);
      } catch (e) {
        return [];
      }
    });
    const locaisUnicos = [...new Set(todosLocais)];

    // ETAPA NOVA: Inserir locais na tabela Locais
    if (locaisUnicos.length > 0) {
      await connection.query(
        'INSERT IGNORE INTO locais (nome) VALUES ?',
        [locaisUnicos.map(nome => [nome])]
      );
    }  
    
    res.json({ 
      success: true,
      message: 'Dados importados com sucesso!',
      count: coroinhas.length 
    });

    await connection.commit();

  } catch (error) {
    console.error('Erro durante a importação:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ 
      error: 'Erro ao importar dados',
      details: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Rota para adicionar um novo coroinha
app.post('/api/coroinhas', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { nome, acolito, sub_acolito, disponibilidade_dias, disponibilidade_locais } = req.body;

    const diasJson = JSON.stringify(disponibilidade_dias || []);
    const locaisJson = JSON.stringify(disponibilidade_locais || []);

    const [result] = await connection.query(
      'INSERT INTO Coroinhas (nome, acolito, sub_acolito, disponibilidade_dias, disponibilidade_locais, escala) VALUES (?, ?, ?, ?, ?, ?)',
      [nome, acolito ? 1 : 0, sub_acolito ? 1 : 0, diasJson, locaisJson, 0]
    );

    res.json({ 
      success: true,
      message: 'Coroinha adicionado com sucesso',
      id: result.insertId
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao adicionar coroinha',
      details: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Rota para gerar escala automática
app.post('/api/escalas/gerar', async (req, res) => {
  let connection;
  try {
    const { data, local } = req.body;
    connection = await pool.getConnection();

    // 1. Buscar coroinhas disponíveis para o dia e local
    const [coroinhas] = await connection.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM Escalas e WHERE e.coroinha_id = c.id AND DATE(e.data) = ?) as escalas_no_dia
       FROM Coroinhas c
       WHERE JSON_CONTAINS(c.disponibilidade_locais, ?)
       AND JSON_CONTAINS(c.disponibilidade_dias, ?)
       HAVING escalas_no_dia < 2
       ORDER BY c.escala ASC, c.sub_acolito DESC, c.acolito DESC`,
      [data, `"${local}"`, `"${getDiaSemana(new Date(data))}"`]
    );

    if (coroinhas.length === 0) {
      throw new Error('Não há coroinhas disponíveis para esta data e local');
    }

    // 2. Criar a escala
    const [result] = await connection.query(
      'INSERT INTO Escalas (data, horario, local, coroinha_id) VALUES (?, ?, ?, ?)',
      [data, req.body.horario, local, coroinhas[0].id]
    );

    // 3. Atualizar contador de escalas do coroinha
    await connection.query(
      'UPDATE Coroinhas SET escala = escala + 1 WHERE id = ?',
      [coroinhas[0].id]
    );

    res.json({
      success: true,
      message: 'Escala gerada com sucesso',
      escala: {
        id: result.insertId,
        data,
        horario: req.body.horario,
        local,
        coroinha: coroinhas[0]
      }
    });

  } catch (error) {
    console.error('Erro ao gerar escala:', error);
    res.status(500).json({
      error: 'Erro ao gerar escala',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/api/locais-disponiveis', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT DISTINCT 
        JSON_UNQUOTE(JSON_EXTRACT(disponibilidade_locais, '$[*]')) as local
      FROM Coroinhas
      WHERE disponibilidade_locais IS NOT NULL
        AND disponibilidade_locais != '[]'
    `);
    
    // Extrair os locais únicos do resultado
    const locaisSet = new Set();
    rows.forEach(row => {
      const locais = row.local.split(',').map(l => l.trim().replace(/["\[\]]/g, ''));
      locais.forEach(l => locaisSet.add(l));
    });
    
    const locais = Array.from(locaisSet).sort();
    console.log('Locais disponíveis:', locais); // Debug
    
    res.json(locais);
  } catch (error) {
    console.error('Erro ao buscar locais:', error);
    res.status(500).json({ error: 'Erro ao buscar locais disponíveis' });
  } finally {
    if (connection) connection.release();
  }
});

// Função auxiliar para obter o dia da semana
function getDiaSemana(date) {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dias[date.getDay()];
}

// Rota para listar escalas
app.get('/api/escalas', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [escalas] = await connection.query(
      `SELECT e.*, c.nome as coroinha_nome 
       FROM Escalas e 
       LEFT JOIN Coroinhas c ON e.coroinha_id = c.id
       ORDER BY e.data ASC, e.horario ASC`
    );

    res.json(escalas);

  } catch (error) {
    console.error('Erro ao listar escalas:', error);
    res.status(500).json({
      error: 'Erro ao listar escalas',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Rota para buscar locais
app.get('/api/locais', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DISTINCT local FROM Escalas');
    connection.release();
    
    const locais = rows.map(row => row.local);
    res.json(locais);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar locais' });
  }
});

// Rota para buscar coroinhas disponíveis
app.get('/api/coroinhas', async (req, res) => {
  try {
    const { local } = req.query;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      `SELECT c.* 
       FROM Coroinhas c
       WHERE JSON_CONTAINS(c.disponibilidade_locais, ?)`,
      [`"${local}"`]
    );
    
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar coroinhas' });
  }
});

// Rota para editar escala manualmente
app.put('/api/escalas/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { coroinha_id, data, horario, local } = req.body;
    
    // Validar dados
    if (!coroinha_id || !data || !horario || !local) {
      throw new Error('Todos os campos são obrigatórios');
    }

    // Converter data para formato MySQL
    const mysqlDate = new Date(data).toISOString().slice(0, 19).replace('T', ' ');

    connection = await pool.getConnection();
    
    // Verificar se não viola o limite de 2 escalas por dia
    const [escalasNoDia] = await connection.query(
      'SELECT COUNT(*) as count FROM Escalas WHERE coroinha_id = ? AND DATE(data) = ? AND id != ?',
      [coroinha_id, mysqlDate.split(' ')[0], id] // Usar apenas a parte da data (YYYY-MM-DD)
    );

    if (escalasNoDia[0].count >= 2) {
      throw new Error('Coroinha já possui 2 escalas neste dia');
    }

    // Atualizar escala
    await connection.query(
      'UPDATE Escalas SET coroinha_id = ?, data = ?, horario = ?, local = ? WHERE id = ?',
      [coroinha_id, mysqlDate, horario, local, id]
    );

    res.json({
      success: true,
      message: 'Escala atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar escala:', error);
    res.status(500).json({
      error: 'Erro ao atualizar escala',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

app.delete('/api/coroinhas', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('DELETE FROM Coroinhas');
    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar coroinhas:', error);
    return res.status(500).json({ 
      error: 'Erro ao deletar coroinhas',
      details: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Rota para exportar escalas
app.get('/api/escalas/export', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [escalas] = await connection.query(
      `SELECT e.data, e.horario, e.local, c.nome as coroinha_nome 
       FROM Escalas e 
       LEFT JOIN Coroinhas c ON e.coroinha_id = c.id
       ORDER BY e.data ASC, e.horario ASC`
    );

    // Criar workbook Excel
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(escalas);
    xlsx.utils.book_append_sheet(wb, ws, 'Escalas');

    // Gerar buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Enviar arquivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=escalas.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao exportar escalas:', error);
    res.status(500).json({
      error: 'Erro ao exportar escalas',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Rota para buscar opções de dias e locais
app.get('/api/opcoes', async (req, res) => {
  try {
    const diasSemana = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ];

    let connection;
    try {
      // Buscar locais únicos do banco de dados
      connection = await pool.getConnection();
      const [rows] = await connection.query(`
        SELECT DISTINCT 
          JSON_UNQUOTE(JSON_EXTRACT(disponibilidade_locais, '$[*]')) as local
        FROM Coroinhas
        WHERE disponibilidade_locais IS NOT NULL
          AND disponibilidade_locais != '[]'
      `);
      
      // Extrair e normalizar os locais únicos
      const locaisSet = new Set();
      rows.forEach(row => {
        const locais = row.local.split(',').map(l => l.trim().replace(/["\[\]]/g, ''));
        locais.forEach(l => locaisSet.add(l));
      });

      // Se não houver locais no banco, usar locais padrão
      const locais = locaisSet.size > 0 
        ? Array.from(locaisSet).sort()
        : ['Paróquia', 'Rainha Da Paz', 'Cristo Rei', 'Bom Pastor'];

      res.json({
        diasSemana,
        locais
      });

    } finally {
      if (connection) connection.release();
    }

  } catch (error) {
    console.error('Erro ao buscar opções:', error);
    res.status(500).json({
      error: 'Erro ao buscar opções',
      details: error.message
    });
  }
});

app.get('/api/locais', async (req, res) => {
  try {
    let connection;
    try {
      // Buscar locais únicos do banco de dados
      connection = await pool.getConnection();
      const [rows] = await connection.query(`
        SELECT DISTINCT 
          JSON_UNQUOTE(JSON_EXTRACT(disponibilidade_locais, '$[*]')) as local
        FROM Coroinhas
        WHERE disponibilidade_locais IS NOT NULL
          AND disponibilidade_locais != '[]'
      `);
      
      // Extrair e normalizar os locais únicos
      const locaisSet = new Set();
      rows.forEach(row => {
        const locais = row.local.split(',').map(l => l.trim().replace(/["\[\]]/g, ''));
        locais.forEach(l => locaisSet.add(l));
      });

      // Se não houver locais no banco, usar locais padrão
      const locais = locaisSet.size > 0 
        ? Array.from(locaisSet).sort()
        : ['Paróquia', 'Rainha Da Paz', 'Cristo Rei', 'Bom Pastor'];

      res.json({
        locais
      });

    } finally {
      if (connection) connection.release();
    }

  } catch (error) {
    console.error('Erro ao buscar opções:', error);
    res.status(500).json({
      error: 'Erro ao buscar opções',
      details: error.message
    });
  }
});

// Rota para exportar coroinhas
app.get('/api/coroinhas/export', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [coroinhas] = await connection.query('SELECT * FROM Coroinhas');
    
    // Transformar os dados para o formato desejado
    const formattedData = coroinhas.map(coroinha => {
      let dias = [];
      let locais = [];

      // Tenta fazer o parse dos dias
      try {
        const diasStr = coroinha.disponibilidade_dias?.toString() || '[]';
        dias = JSON.parse(diasStr);
      } catch (e) {
        // Se falhar o parse, tenta tratar como string separada por vírgula
        dias = coroinha.disponibilidade_dias
          ?.toString()
          .replace(/[\[\]"]/g, '')
          .split(',')
          .map(d => d.trim())
          .filter(Boolean) || [];
      }

      // Tenta fazer o parse dos locais
      try {
        const locaisStr = coroinha.disponibilidade_locais?.toString() || '[]';
        locais = JSON.parse(locaisStr);
      } catch (e) {
        // Se falhar o parse, tenta tratar como string separada por vírgula
        locais = coroinha.disponibilidade_locais
          ?.toString()
          .replace(/[\[\]"]/g, '')
          .split(',')
          .map(l => l.trim())
          .filter(Boolean) || [];
      }
      
      return {
        Nome: coroinha.nome,
        'Acólito': coroinha.acolito ? 'Sim' : 'Não',
        'Sub-Acólito': coroinha.sub_acolito ? 'Sim' : 'Não',
        'Segunda': dias.includes('Segunda') ? 'Sim' : 'Não',
        'Terça': dias.includes('Terça') ? 'Sim' : 'Não',
        'Quarta': dias.includes('Quarta') ? 'Sim' : 'Não',
        'Quinta': dias.includes('Quinta') ? 'Sim' : 'Não',
        'Sexta': dias.includes('Sexta') ? 'Sim' : 'Não',
        'Sábado': dias.includes('Sábado') ? 'Sim' : 'Não',
        'Domingo': dias.includes('Domingo') ? 'Sim' : 'Não',
        'Paróquia': locais.includes('Paróquia') ? 'Sim' : 'Não',
        'RainhaDaPaz': locais.includes('Rainha Da Paz') || locais.includes('RainhaDaPaz') ? 'Sim' : 'Não',
        'CristoRei': locais.includes('Cristo Rei') || locais.includes('CristoRei') ? 'Sim' : 'Não',
        'BomPastor': locais.includes('Bom Pastor') || locais.includes('BomPastor') ? 'Sim' : 'Não'
      };
    });

    // Criar workbook Excel
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(formattedData);
    xlsx.utils.book_append_sheet(wb, ws, 'Coroinhas');

    // Gerar buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Enviar arquivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=coroinhas.xlsx');
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao exportar coroinhas:', error);
    res.status(500).json({
      error: 'Erro ao exportar coroinhas',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar servidor
const PORT = 3001;

// Função para testar conexão com o banco
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    connection.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

// Iniciar servidor apenas se conseguir conectar ao banco
testDatabaseConnection().then(success => {
  if (success) {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log('Pressione Ctrl+C para parar o servidor');
    });
  } else {
    console.error('Não foi possível iniciar o servidor devido a erro na conexão com o banco');
    process.exit(1);
  }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});