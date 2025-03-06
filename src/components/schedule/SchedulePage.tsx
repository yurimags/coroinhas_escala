import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Download, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { ScheduleTable } from "./ScheduleTable";
import { ScheduleFilters } from "./ScheduleFilters";
import { CreateScheduleDialog } from "./CreateScheduleDialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Schedule {
  id: number;
  data: Date;
  horario: string;
  local: string;
  coroinhas: Array<{
    id: number;
    nome: string;
    funcao: 'acolito' | 'sub_acolito' | 'coroinha';
  }>;
  status: 'agendado' | 'concluido' | 'cancelado' | 'pendente';
}

interface Periodo {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
}

export function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const { toast } = useToast();

  const fetchPeriodos = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/escalas/periodos`);
      const data = await response.json();
      setPeriodos(data);
      
      // Selecionar automaticamente o período mais recente
      if (data.length > 0) {
        const periodoMaisRecente = data.reduce((prev: Periodo, current: Periodo) => {
          return new Date(current.data_fim) > new Date(prev.data_fim) ? current : prev;
        });
        setSelectedPeriodo(periodoMaisRecente.id.toString());
      }
    } catch (error) {
      console.error('Erro ao carregar períodos:', error);
    }
  };

  const fetchEscalas = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      let url = `${apiUrl}/api/escalas`;
      
      if (selectedPeriodo) {
        url += `?periodo_id=${selectedPeriodo}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Erro na requisição');
      
      const data = await response.json();
      
      const escalasFormatadas: Schedule[] = data.map((escala: any) => ({
        id: escala.id,
        data: new Date(escala.data),
        horario: escala.horario.split(':').slice(0, 2).join(':'),
        local: escala.local,
        coroinhas: [{
          id: escala.coroinha_id,
          nome: escala.coroinha_nome,
          funcao: 'coroinha'
        }],
        status: escala.status === 'pendente' ? 'agendado' : escala.status
      }));

      setSchedules(escalasFormatadas);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as escalas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (selectedPeriodo) {
      fetchEscalas();
    }
  }, [selectedPeriodo]);

  const handleExport = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/escalas/export${selectedPeriodo ? `?periodo_id=${selectedPeriodo}` : ''}`);
      
      if (!response.ok) throw new Error('Falha na exportação');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'escalas.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar as escalas",
        variant: "destructive",
      });
    }
  };

  const handleEditSchedule = async (schedule: Schedule) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/escalas/${schedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...schedule,
          data: schedule.data.toISOString()
        })
      });

      if (!response.ok) throw new Error('Erro ao atualizar escala');
      await fetchEscalas();
      toast({
        title: "Sucesso",
        description: "Escala atualizada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const getPeriodoLabel = (periodo: Periodo) => {
    const dataInicio = format(new Date(periodo.data_inicio), 'dd/MM/yyyy', { locale: ptBR });
    const dataFim = format(new Date(periodo.data_fim), 'dd/MM/yyyy', { locale: ptBR });
    return `${periodo.nome} (${dataInicio} - ${dataFim})`;
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gerenciamento de Escalas</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Escala
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-full sm:w-64">
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger>
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full sm:w-auto"
          >
            {showCalendar ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Ocultar Calendário
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Mostrar Calendário
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {showCalendar && (
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        )}

        <ScheduleTable 
          schedules={schedules}
          isLoading={isLoading}
          onUpdate={fetchEscalas}
          onEdit={handleEditSchedule}
          selectedPeriodo={selectedPeriodo}
        />
      </div>

      <CreateScheduleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onScheduleCreated={fetchEscalas}
      />
    </div>
  );
}