import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  try {
    console.log('Verificando tabelas do banco de dados...');

    // Verificar se a tabela PeriodosEscala existe
    const [tables] = await pool.query(
      "SHOW TABLES LIKE 'PeriodosEscala'"
    );

    if (Array.isArray(tables) && tables.length === 0) {
      console.log('Tabela PeriodosEscala não encontrada. Criando tabelas...');

      // Ler o arquivo SQL
      const sqlPath = path.join(__dirname, 'migrations', 'create_periodos_escala.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');

      // Dividir o conteúdo em comandos individuais
      const commands = sqlContent.split(';').filter(cmd => cmd.trim());

      // Executar cada comando
      for (const command of commands) {
        if (command.trim()) {
          await pool.query(command);
        }
      }

      console.log('Tabelas criadas com sucesso!');
    } else {
      console.log('Tabelas já existem. Nenhuma ação necessária.');
    }

    console.log('Setup do banco de dados concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro durante o setup do banco de dados:', error);
    return false;
  }
}

// Executar o setup
setupDatabase().then((success) => {
  if (success) {
    console.log('Setup concluído com sucesso!');
  } else {
    console.error('Falha no setup do banco de dados.');
  }
  process.exit(success ? 0 : 1);
}); 