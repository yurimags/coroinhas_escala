export interface ScheduleEvent {
  data: Date;
  local: string;
  horario: string;
  numeroCoroinhas: number;
}

export interface PeriodoEscala {
  id?: number;
  data_inicio: Date;
  data_fim: Date;
  eventos: ScheduleEvent[];
  disponibilidades_personalizadas?: DisponibilidadePersonalizada[];
}

export interface DisponibilidadePersonalizada {
  coroinha_id: number;
  dias: string[];
  locais: string[];
}

export interface ScheduleConfig {
  regras: {
    limiteDiario: number;
    prioridadeAcolitos: boolean;
    minimoAcolitos: number;
  };
} 