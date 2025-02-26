import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Download, Plus } from "lucide-react";
import { ScheduleTable } from "./ScheduleTable";
import { ScheduleFilters } from "./ScheduleFilters";
import { CreateScheduleDialog } from "./CreateScheduleDialog";
import { useToast } from "@/components/ui/use-toast";

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

export function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    local: '',
    status: '',
    search: ''
  });
  const [locais, setLocais] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchEscalas = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`${apiUrl}/api/escalas?${query}`);
      
      if (!response.ok) throw new Error('Erro na requisição');
      
      const data = await response.json();
      
      const escalasFormatadas: Schedule[] = data.map((escala: any) => ({
        id: escala.id,
        data: new Date(escala.data),
        horario: escala.horario.split(':').slice(0, 2).join(':'), // Formata horário
        local: escala.local,
        coroinhas: [{
          id: escala.coroinha_id,
          nome: escala.coroinha_nome,
          funcao: 'coroinha' // Ajuste conforme seus dados reais
        }],
        status: escala.status === 'pendente' ? 'agendado' : escala.status // Mapeia status
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

  const fetchLocais = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/locais/disponiveis`);
      const data = await response.json();
      setLocais(data.locais || []);
    } catch (error) {
      console.error('Erro ao buscar locais:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar locais disponíveis",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEscalas();
    fetchLocais();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/escalas/export`, {
        method: 'GET',
      });
      
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

  return (
    <div className="space-y-6 p-4">
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="md:col-span-8 space-y-4">
          <ScheduleFilters 
            locais={locais}
            onFilterChange={handleFilterChange}
          />
          
          <ScheduleTable 
            schedules={schedules}
            isLoading={isLoading}
            onUpdate={fetchEscalas}
            onEdit={handleEditSchedule}
          />
        </div>
      </div>

      <CreateScheduleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onScheduleCreated={() => {
          fetchEscalas();
          fetchLocais();
        }}
      />
    </div>
  );
}