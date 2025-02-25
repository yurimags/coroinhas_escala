export interface Escala {
  id: number;
  nome: string;
  data_inicio: Date;
  data_fim: Date;
  status: "ativa" | "finalizada" | "cancelada";
  created_at: Date;
}

export interface DisponibilidadeEscala {
  id: number;
  escala_id: number;
  coroinha_id: number;
  disponibilidade_dias: string[];
  disponibilidade_locais: string[];
}

export interface EscalaItem {
  id: number;
  escala_id: number;
  coroinha_id: number;
  data: Date;
  horario: string;
  local: string;
  status: "agendado" | "concluido" | "cancelado";
}

export interface ContadorEscala {
  coroinha_id: number;
  escala_id: number;
  quantidade: number;
}
