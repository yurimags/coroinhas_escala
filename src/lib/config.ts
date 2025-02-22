interface Configuracoes {
  maxEscalasDia: number;
  requerFuncaoMatch: boolean;
  locais: string[];
  horarios: string[];
}

async function getConfiguracoes(): Promise<Configuracoes> {
  const config = await prisma.configuracoes.findFirst({
    orderBy: { created_at: 'desc' }
  });
  return {
    maxEscalasDia: config.max_escalas_dia,
    requerFuncaoMatch: config.requer_funcao_match,
    locais: config.locais,
    horarios: config.horarios
  };
} 