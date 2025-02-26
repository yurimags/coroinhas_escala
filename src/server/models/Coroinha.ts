export interface Coroinha {
  id: number;
  nome: string;
  acolito: boolean;
  sub_acolito: boolean;
  total_servicos: number;
  disponibilidade_dias: string | string[];
  disponibilidade_locais: string | string[];
} 