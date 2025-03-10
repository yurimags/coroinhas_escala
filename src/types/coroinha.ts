export interface Coroinha {
  id: number;
  nome: string;
  acolito: boolean;
  sub_acolito: boolean;
  disponibilidade_dias: string | string[];
  disponibilidade_locais: string | string[];
  escala: number;
}

export interface CoroinhaFormData {
  nome: string;
  acolito: boolean;
  sub_acolito: boolean;
  disponibilidade_dias: string[];
  disponibilidade_locais: string[];
}
