import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface EditScheduleDialogProps {
  schedule: any;
  locais: string[];
  coroinhas: any[];
  onSave: (updatedSchedule: any) => void;
  onClose: () => void;
}

export function EditScheduleDialog({
  schedule,
  locais,
  coroinhas,
  onSave,
  onClose,
}: EditScheduleDialogProps) {
  const [local, setLocal] = useState(schedule.local);
  const [coroinhaId, setCoroinhaId] = useState(schedule.coroinhas[0]?.id || '');
  const [data, setData] = useState(new Date(schedule.data));
  const [horario, setHorario] = useState(schedule.horario);

  const handleSubmit = () => {
    const updatedSchedule = {
      ...schedule,
      local,
      coroinha_id: coroinhaId,
      data: data.toISOString(),
      horario,
    };
    onSave(updatedSchedule);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Escala</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="local" className="text-right">
              Local
            </Label>
            <Select value={local} onValueChange={setLocal}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                {locais.map((local) => (
                  <SelectItem key={local} value={local}>
                    {local}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="coroinha" className="text-right">
              Coroinha
            </Label>
            <Select value={coroinhaId} onValueChange={setCoroinhaId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o coroinha" />
              </SelectTrigger>
              <SelectContent>
                {coroinhas.map((coroinha) => (
                  <SelectItem key={coroinha.id} value={coroinha.id}>
                    {coroinha.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="data" className="text-right">
              Data
            </Label>
            <Calendar
              mode="single"
              selected={data}
              onSelect={(date) => date && setData(date)}
              className="col-span-3 rounded-md border"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="horario" className="text-right">
              Horário
            </Label>
            <Input
              id="horario"
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}