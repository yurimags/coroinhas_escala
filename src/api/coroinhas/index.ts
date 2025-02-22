import { prisma } from '../../lib/prisma';
import { Router } from 'express';

const router = Router();

// Listar todos os coroinhas
router.get('/', async (req, res) => {
  try {
    const coroinhas = await prisma.coroinhas.findMany();
    res.json(coroinhas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar coroinhas' });
  }
});

// Deletar coroinha
router.delete('/:id', async (req, res) => {
  try {
    await prisma.coroinhas.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar coroinha' });
  }
});

// Resetar escala
router.post('/:id/reset-escala', async (req, res) => {
  try {
    await prisma.coroinhas.update({
      where: { id: parseInt(req.params.id) },
      data: { escala: 0 }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao resetar escala' });
  }
});

export default router; 