import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Periodo {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
}

interface PeriodSelectorProps {
  periodos: Periodo[];
  selectedPeriodo: string;
  onPeriodoChange: (periodoId: string) => void;
}

export function PeriodSelector({ periodos, selectedPeriodo, onPeriodoChange }: PeriodSelectorProps) {
  const getPeriodoLabel = (periodo: Periodo) => {
    const dataInicio = format(new Date(periodo.data_inicio), 'dd/MM/yyyy', { locale: ptBR });
    const dataFim = format(new Date(periodo.data_fim), 'dd/MM/yyyy', { locale: ptBR });
    return `${periodo.nome} (${dataInicio} - ${dataFim})`;
  };

  return (
    <div className="w-full">
      <Select value={selectedPeriodo} onValueChange={onPeriodoChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione um período" />
        </SelectTrigger>
        <SelectContent>
          {periodos.map((periodo) => (
            <SelectItem key={periodo.id} value={periodo.id.toString()}>
              {getPeriodoLabel(periodo)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 