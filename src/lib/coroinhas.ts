interface Coroinha {
  id: number;
  nome: string;
  comunidade: string;
  disponibilidadeDias: string[];
  disponibilidadeLocais: string[];
  subAcolito: boolean;
  acolito: boolean;
  escala: number;
}

async function getCoroinhasDisponiveis(data: Date, local: string): Promise<Coroinha[]> {
  return await prisma.coroinhas.findMany({
    where: {
      disponibilidade_dias: {
        array_contains: [format(data, 'EEEE', { locale: ptBR })],
      },
      disponibilidade_locais: {
        array_contains: [local],
      },
      escala: {
        lt: await getConfiguracoes().then(c => c.maxEscalasDia)
      }
    }
  });
} 