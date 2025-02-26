import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './config/database';
import routes from './routes/index';

const app = express();

// Configurações
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// Adicionar middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Rotas
app.use(routes);

// Tratamento de erros
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

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
const PORT = process.env.PORT || 3001;

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