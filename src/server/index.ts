const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Listar todos os coroinhas
app.get('/api/coroinhas', async (req, res) => {
  try {
    const coroinhas = await prisma.coroinhas.findMany();
    res.json(coroinhas);
  } catch (error) {
    console.error('Erro ao buscar coroinhas:', error);
    res.status(500).json({ error: 'Erro ao buscar coroinhas' });
  }
});

// Deletar coroinha
app.delete('/api/coroinhas/:id', async (req, res) => {
  try {
    await prisma.coroinhas.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar coroinha:', error);
    res.status(500).json({ error: 'Erro ao deletar coroinha' });
  }
});

// Resetar escala
app.post('/api/coroinhas/:id/reset-escala', async (req, res) => {
  try {
    await prisma.coroinhas.update({
      where: { id: parseInt(req.params.id) },
      data: { escala: 0 }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao resetar escala:', error);
    res.status(500).json({ error: 'Erro ao resetar escala' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 