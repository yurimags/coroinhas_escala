import { Router } from 'express';
import configuracoesRouter from './configuracoes';

const router = Router();

router.use('/configuracoes', configuracoesRouter);

export default router; 