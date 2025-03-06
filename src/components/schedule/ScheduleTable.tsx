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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, AlertTriangle, XCircle, LayoutGrid, Table as TableIcon, Info, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { EditScheduleDialog } from "./EditScheduleDialog";
import { ColumnVisibilityControl } from "./ColumnVisibilityControl";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  selectedPeriodo?: string;
}

interface ScheduleGroup {
  data: string;
  diaSemana: string;
  local: string;
  horario: string;
  coroinhas: Array<{
    id: number;
    nome: string;
    funcao: string;
  }>;
  status: string;
}

export function ScheduleTable({ 
  schedules, 
  isLoading, 
  onUpdate, 
  onEdit,
  selectedPeriodo 
}: ScheduleTableProps) {
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [locais, setLocais] = useState<string[]>([]);
  const [coroinhas, setCoroinhas] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const { toast } = useToast();
  const [showActions, setShowActions] = useState(true);
  const [coroinhaTags, setCoroinhaTags] = useState<Record<string, string>>({});

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
      if (!locaisResponse.ok) throw new Error('Erro ao buscar locais');
      const locaisData = await locaisResponse.json();
      setLocais(locaisData);

      // Buscar coroinhas
      const coroinhasResponse = await fetch(`${apiUrl}/api/coroinhas`);
      if (!coroinhasResponse.ok) throw new Error('Erro ao buscar coroinhas');
      const coroinhasData = await coroinhasResponse.json();
      setCoroinhas(coroinhasData);

      // Definir a escala para edição
      setEditingSchedule(schedule);
      setEditDialogOpen(true);
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
      await onEdit(updatedSchedule);
      setEditDialogOpen(false);
      setEditingSchedule(null);
      onUpdate();
      
      toast({
        title: "Sucesso",
        description: "Escala atualizada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar escala",
        variant: "destructive",
      });
    }
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setEditingSchedule(null);
  };

  // Função auxiliar para gerar a chave única do evento
  const getEventCoroinhaKey = (data: string, local: string, horario: string, coroinhaId: number) => {
    return `${data}-${local}-${horario}-${coroinhaId}`;
  };

  // Modifique a função de ordenação para usar a chave composta
  const sortCoroinhas = (coroinhas: any[], evento: { data: string, local: string, horario: string }) => {
    const tagPriority = { 'R': 0, 'L': 1, 'T': 2, 'N': 3, '': 4 };
    return [...coroinhas].sort((a, b) => {
      const keyA = getEventCoroinhaKey(evento.data, evento.local, evento.horario, a.id);
      const keyB = getEventCoroinhaKey(evento.data, evento.local, evento.horario, b.id);
      const tagA = coroinhaTags[keyA] || '';
      const tagB = coroinhaTags[keyB] || '';
      return tagPriority[tagA as keyof typeof tagPriority] - tagPriority[tagB as keyof typeof tagPriority];
    });
  };

  // Modifique a função de alternar tag para usar a chave composta
  const toggleCoroinhaTag = (data: string, local: string, horario: string, coroinhaId: number) => {
    const eventKey = getEventCoroinhaKey(data, local, horario, coroinhaId);
    const tags = ['R', 'L', 'T', 'N'];
    const currentTag = coroinhaTags[eventKey] || '';
    const currentIndex = tags.indexOf(currentTag);
    const nextTag = currentIndex === -1 ? tags[0] : (currentIndex === tags.length - 1 ? '' : tags[currentIndex + 1]);
    
    setCoroinhaTags(prev => ({
      ...prev,
      [eventKey]: nextTag
    }));
  };

  const getLocalColor = (local: string) => {
    const colorMap: Record<string, { bg: string, text: string }> = {
      'Paróquia': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'RainhaDaPaz': { bg: 'bg-green-100', text: 'text-green-700' },
      'CristoRei': { bg: 'bg-purple-100', text: 'text-purple-700' },
      'BomPastor': { bg: 'bg-orange-100', text: 'text-orange-700' }
    };

    return colorMap[local] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  const renderCards = () => {
    // Agrupar escalas por data, local e horário
    const grupos: { [key: string]: ScheduleGroup } = {};
    
    schedules.forEach(schedule => {
      const dataFormatada = format(schedule.data, 'dd/MM/yyyy');
      const diaSemana = format(schedule.data, 'EEEE', { locale: ptBR });
      const chave = `${dataFormatada}-${schedule.local}-${schedule.horario}`;

      if (!grupos[chave]) {
        grupos[chave] = {
          data: dataFormatada,
          diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
          local: schedule.local,
          horario: schedule.horario,
          coroinhas: [],
          status: schedule.status
        };
      }

      grupos[chave].coroinhas.push(...schedule.coroinhas);
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <div className="col-span-full flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActions(!showActions)}
            className="flex items-center gap-2"
          >
            {showActions ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar Ações
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Mostrar Ações
              </>
            )}
          </Button>
        </div>

        {Object.values(grupos).map((grupo, index) => (
          <Card key={index} className={`${grupo.status === 'cancelado' ? 'opacity-50' : ''} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {grupo.data.split('/')[0]} - {grupo.diaSemana}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-base font-medium px-3 py-1 border-2 ${getLocalColor(grupo.local).bg} ${getLocalColor(grupo.local).text}`}
                      >
                        {grupo.local}
                      </Badge>
                    </div>
                  </div>
                  {selectedPeriodo && (
                    <CoroinhasDisponiveisPopover
                      data={grupo.data}
                      local={grupo.local}
                      periodoId={selectedPeriodo}
                    />
                  )}
                </div>
                <Badge variant={getStatusVariant(grupo.status)} className="ml-2">
                  {grupo.horario}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {sortCoroinhas(grupo.coroinhas, {
                  data: grupo.data,
                  local: grupo.local,
                  horario: grupo.horario
                }).map((coroinha, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">{coroinha.nome}</span>
                      {coroinhaTags[getEventCoroinhaKey(grupo.data, grupo.local, grupo.horario, coroinha.id)] && (
                        <Badge 
                          variant="outline" 
                          className="px-2 py-0.5 text-xs cursor-pointer"
                          onClick={() => toggleCoroinhaTag(grupo.data, grupo.local, grupo.horario, coroinha.id)}
                        >
                          {coroinhaTags[getEventCoroinhaKey(grupo.data, grupo.local, grupo.horario, coroinha.id)]}
                        </Badge>
                      )}
                      {!coroinhaTags[getEventCoroinhaKey(grupo.data, grupo.local, grupo.horario, coroinha.id)] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => toggleCoroinhaTag(grupo.data, grupo.local, grupo.horario, coroinha.id)}
                        >
                          +
                        </Button>
                      )}
                    </div>
                    {showActions && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(schedules.find(s => 
                            s.coroinhas.some(c => c.id === coroinha.id)
                          ))}
                          disabled={grupo.status === 'cancelado'}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelarEscala(coroinha.id)}
                          disabled={grupo.status === 'cancelado'}
                          className="h-8 w-8 p-0"
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'concluido':
        return 'default';
      case 'cancelado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <div className="flex justify-between items-center p-2 border-b">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            >
              {viewMode === 'table' ? (
                <>
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Visualizar Cards
                </>
              ) : (
                <>
                  <TableIcon className="h-4 w-4 mr-2" />
                  Visualizar Tabela
                </>
              )}
            </Button>
          </div>
          <ColumnVisibilityControl
            columns={Object.keys(visibleColumns)}
            visibleColumns={Object.keys(visibleColumns).filter(key => visibleColumns[key])}
            onVisibilityChange={handleColumnVisibilityChange}
          />
        </div>
        
        {viewMode === 'table' ? (
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
        ) : (
          renderCards()
        )}
      </div>

      {editDialogOpen && editingSchedule && (
        <EditScheduleDialog
          schedule={editingSchedule}
          locais={locais}
          coroinhas={coroinhas}
          onSave={handleSave}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
}

function CoroinhasDisponiveisPopover({ data, local, periodoId }: { data: string, local: string, periodoId: string }) {
  const [coroinhas, setCoroinhas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCoroinhasDisponiveis = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Formatar a data para YYYY-MM-DD
      const formattedDate = data.split('/').reverse().join('-');
      
      const response = await fetch(
        `${apiUrl}/api/escalas/disponibilidade/${periodoId}/${formattedDate}/${encodeURIComponent(local)}`
      );
      
      if (!response.ok) throw new Error('Erro ao buscar coroinhas disponíveis');
      const responseData = await response.json();
      setCoroinhas(responseData);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={() => fetchCoroinhasDisponiveis()}
        >
          <Info className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">Coroinhas Disponíveis</h4>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : coroinhas.length > 0 ? (
            <div className="max-h-48 overflow-auto">
              {coroinhas.map((coroinha) => (
                <div
                  key={coroinha.id}
                  className="flex items-center justify-between py-1 text-sm"
                >
                  <span>{coroinha.nome}</span>
                  <Badge variant="secondary">{coroinha.escala}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum coroinha disponível</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}