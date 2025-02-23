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

    console.log('Dados recebidos para atualização:', {
      id,
      nome,
      acolito,
      sub_acolito,
      disponibilidade_dias,
      disponibilidade_locais
    });

    const diasJson = JSON.stringify(disponibilidade_dias || []);
    const locaisJson = JSON.stringify(disponibilidade_locais || []);

    console.log('Dados formatados para o banco:', {
      diasJson,
      locaisJson
    });

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

    // Lê o arquivo XLSX
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converte para JSON
    const rawData = xlsx.utils.sheet_to_json(worksheet);
    
    const coroinhas = rawData.map(row => {
      // Array para armazenar os dias disponíveis
      const dias = [];
      if (row['Segunda']) dias.push('Segunda');
      if (row['Terça']) dias.push('Terça');
      if (row['Quarta']) dias.push('Quarta');
      if (row['Quinta']) dias.push('Quinta');
      if (row['Sexta']) dias.push('Sexta');
      if (row['Sábado']) dias.push('Sábado');
      if (row['Domingo']) dias.push('Domingo');

      // Array para armazenar os locais disponíveis
      const locais = [];
      if (row['Paróquia']) locais.push('Paróquia');
      if (row['RainhaDaPaz']) locais.push('RainhaDaPaz');
      if (row['CristoRei']) locais.push('CristoRei');
      if (row['BomPastor']) locais.push('BomPastor');

      return {
        nome: row['Nome'] || '',
        acolito: row['Acólito'] === 'Sim' ? 1 : 0,
        sub_acolito: row['Sub-Acólito'] === 'Sim' ? 1 : 0,
        disponibilidade_dias: JSON.stringify(dias),
        disponibilidade_locais: JSON.stringify(locais),
        escala: 0
      };
    }).filter(coroinha => coroinha.nome.trim() !== ''); // Remove linhas vazias

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

    await connection.commit();
    
    res.json({ 
      success: true,
      message: 'Dados importados com sucesso!',
      count: coroinhas.length 
    });

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