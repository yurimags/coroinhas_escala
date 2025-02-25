import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { EditScheduleDialog } from "./EditScheduleDialog";
import { ColumnVisibilityControl } from "./ColumnVisibilityControl";

interface ScheduleTableProps {
  schedules: Array<{
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
  }>;
  isLoading: boolean;
  onUpdate: () => void;
  onEdit: (schedule: any) => void;
}

export function ScheduleTable({ schedules, isLoading, onUpdate, onEdit }: ScheduleTableProps) {
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [locais, setLocais] = useState<string[]>([]);
  const [coroinhas, setCoroinhas] = useState<any[]>([]);
  const { toast } = useToast();

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    Data: true,
    Horário: true,
    Local: true,
    Coroinhas: true,
    Status: true,
    Ações: true,
  });

  const columnLabels = {
    Data: 'Data',
    Horário: 'Horário',
    Local: 'Local',
    Coroinhas: 'Coroinhas',
    Status: 'Status',
    Ações: 'Ações'
  };

  const handleColumnVisibilityChange = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      agendado: { variant: 'secondary' as const, label: 'Agendado' },
      concluido: { variant: 'default' as const, label: 'Concluído' },
      cancelado: { variant: 'destructive' as const, label: 'Cancelado' },
      pendente: { variant: 'secondary' as const, label: 'Pendente' }
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.agendado;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const verificarConflitos = (schedule: any) => {
    const coroinhaCounts = new Map<number, number>();
    const currentDate = format(schedule.data, 'yyyy-MM-dd');
    
    return schedules.some(s => 
      format(s.data, 'yyyy-MM-dd') === currentDate &&
      s.coroinhas.some(c => {
        const count = (coroinhaCounts.get(c.id) || 0) + 1;
        coroinhaCounts.set(c.id, count);
        return count > 2;
      })
    );
  };

  const handleCancelarEscala = async (id: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/escalas/${id}/cancelar`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cancelar escala');
      }

      toast({
        title: "Sucesso",
        description: "Escala cancelada com sucesso",
      });
      onUpdate();
    } catch (error) {
      console.error('Erro ao cancelar escala:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = async (schedule: any) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Buscar locais
      const locaisResponse = await fetch(`${apiUrl}/api/locais`);
      const locaisData = await locaisResponse.json();
      setLocais(locaisData);

      // Buscar coroinhas para o local selecionado
      const coroinhasResponse = await fetch(`${apiUrl}/api/coroinhas?local=${schedule.local}`);
      const coroinhasData = await coroinhasResponse.json();
      setCoroinhas(coroinhasData);

      setEditingSchedule(schedule);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados para edição",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (updatedSchedule: any) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Converter a data para o formato MySQL
      const mysqlDate = new Date(updatedSchedule.data)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
  
      const response = await fetch(`${apiUrl}/api/escalas/${updatedSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedSchedule,
          data: mysqlDate // Usar a data formatada
        }),
      });
  
      if (!response.ok) {
        throw new Error('Erro ao atualizar escala');
      }
  
      toast({
        title: "Sucesso",
        description: "Escala atualizada com sucesso",
      });
      
      onUpdate();
      setEditingSchedule(null);
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <div className="flex justify-end p-2 border-b">
          <ColumnVisibilityControl
            columns={Object.keys(columnLabels)}
            visibleColumns={Object.keys(visibleColumns).filter(key => visibleColumns[key])}
            onVisibilityChange={handleColumnVisibilityChange}
          />
        </div>
        
        <div className="overflow-auto max-h-[600px]">
          <Table className="relative">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                {visibleColumns.Data && (
                  <TableHead className="sticky left-0 bg-background z-20 min-w-[150px]">
                    {columnLabels.Data}
                  </TableHead>
                )}
                {visibleColumns.Horário && <TableHead>{columnLabels.Horário}</TableHead>}
                {visibleColumns.Local && <TableHead>{columnLabels.Local}</TableHead>}
                {visibleColumns.Coroinhas && <TableHead>{columnLabels.Coroinhas}</TableHead>}
                {visibleColumns.Status && <TableHead>{columnLabels.Status}</TableHead>}
                {visibleColumns.Ações && (
                  <TableHead className="sticky right-0 bg-background z-20 text-right min-w-[100px]">
                    {columnLabels.Ações}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id} className={schedule.status === 'cancelado' ? 'opacity-50' : ''}>
                  {visibleColumns.Data && (
                    <TableCell className="py-2 sticky left-0 bg-background z-10">
                      {format(schedule.data, "dd 'de' MMMM", { locale: ptBR })}
                    </TableCell>
                  )}
                  {visibleColumns.Horário && (
                    <TableCell className="py-2">{schedule.horario}</TableCell>
                  )}
                  {visibleColumns.Local && (
                    <TableCell className="py-2">{schedule.local}</TableCell>
                  )}
                  {visibleColumns.Coroinhas && (
                    <TableCell className="py-2">
                      <div className="space-y-1">
                        {schedule.coroinhas.map((coroinha) => (
                          <div key={coroinha.id} className="text-sm">
                            {coroinha.nome}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({coroinha.funcao.replace('_', ' ')})
                            </span>
                          </div>
                        ))}
                        {schedule.coroinhas.length === 0 && (
                          <span className="text-sm text-muted-foreground">Sem designação</span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.Status && (
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(schedule.status)}
                        {verificarConflitos(schedule) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.Ações && (
                    <TableCell className="py-2 text-right sticky right-0 bg-background z-10">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2"
                          onClick={() => handleCancelarEscala(schedule.id)}
                          disabled={schedule.status === 'cancelado'}
                          title="Cancelar escala"
                        >
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2"
                          onClick={() => handleEditClick(schedule)}
                          disabled={schedule.status === 'cancelado'}
                          title="Editar escala"
                        >
                          <Edit2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {editingSchedule && (
        <EditScheduleDialog
          schedule={editingSchedule}
          locais={locais}
          coroinhas={coroinhas}
          onSave={handleSave}
          onClose={() => setEditingSchedule(null)}
        />
      )}
    </>
  );
}