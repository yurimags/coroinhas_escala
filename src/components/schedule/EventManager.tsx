import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduleEvent } from '@/types/schedule';

interface EventManagerProps {
  eventos: ScheduleEvent[];
  locaisDisponiveis: string[];
  onEventosChange: (eventos: ScheduleEvent[]) => void;
  dataInicio?: Date;
  dataFim?: Date;
}

export function EventManager({ 
  eventos, 
  locaisDisponiveis, 
  onEventosChange,
  dataInicio,
  dataFim
}: EventManagerProps) {
  const [novoEvento, setNovoEvento] = useState<Partial<ScheduleEvent>>({
    numeroCoroinhas: 1
  });

  const handleAddEvento = () => {
    if (!novoEvento.data || !novoEvento.local || !novoEvento.horario) {
      return;
    }

    // Validar se a data está dentro do período
    if (dataInicio && dataFim) {
      const data = new Date(novoEvento.data);
      if (data < dataInicio || data > dataFim) {
        return;
      }
    }

    onEventosChange([...eventos, novoEvento as ScheduleEvent]);
    setNovoEvento({ numeroCoroinhas: 1 });
  };

  const handleRemoveEvento = (index: number) => {
    const novosEventos = eventos.filter((_, i) => i !== index);
    onEventosChange(novosEventos);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <DatePicker
            selected={novoEvento.data}
            onChange={(date: Date) => setNovoEvento({ ...novoEvento, data: date })}
            dateFormat="dd/MM/yyyy"
            minDate={dataInicio}
            maxDate={dataFim}
            locale={ptBR}
            placeholderText="Selecione a data"
          />
        </div>

        <div className="space-y-2">
          <Label>Local</Label>
          <Select
            value={novoEvento.local}
            onValueChange={(value) => setNovoEvento({ ...novoEvento, local: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o local" />
            </SelectTrigger>
            <SelectContent>
              {locaisDisponiveis.map((local) => (
                <SelectItem key={local} value={local}>
                  {local}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Horário</Label>
          <Input
            type="time"
            value={novoEvento.horario || ''}
            onChange={(e) => setNovoEvento({ ...novoEvento, horario: e.target.value })}
            placeholder="HH:mm"
          />
        </div>

        <div className="space-y-2">
          <Label>Nº de Coroinhas</Label>
          <Input
            type="number"
            min={1}
            max={5}
            value={novoEvento.numeroCoroinhas || 1}
            onChange={(e) => setNovoEvento({ ...novoEvento, numeroCoroinhas: parseInt(e.target.value) || 1 })}
          />
        </div>

        <div className="flex items-end">
          <Button 
            onClick={handleAddEvento}
            disabled={!novoEvento.data || !novoEvento.local || !novoEvento.horario}
          >
            Adicionar Evento
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Nº de Coroinhas</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum evento cadastrado
                </TableCell>
              </TableRow>
            ) : (
              eventos
                .sort((a, b) => a.data.getTime() - b.data.getTime())
                .map((evento, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {format(evento.data, 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{evento.local}</TableCell>
                    <TableCell>{evento.horario}</TableCell>
                    <TableCell>{evento.numeroCoroinhas}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEvento(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 