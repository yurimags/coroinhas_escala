import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

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
  onClose
}: EditScheduleDialogProps) {
  const [formData, setFormData] = useState({
    id: schedule?.id,
    data: schedule?.data ? new Date(schedule.data) : new Date(),
    horario: schedule?.horario || '',
    local: schedule?.local || '',
    coroinha_id: schedule?.coroinhas?.[0]?.id?.toString() || '',
    periodo_id: schedule?.periodo_id,
    status: schedule?.status || 'agendado',
    escala: schedule?.coroinhas?.[0]?.escala || 0
  });

  // Atualizar a escala quando o coroinha é alterado
  useEffect(() => {
    if (formData.coroinha_id) {
      const selectedCoroinha = coroinhas.find(c => c.id.toString() === formData.coroinha_id);
      if (selectedCoroinha) {
        setFormData(prev => ({
          ...prev,
          escala: selectedCoroinha.escala || 0
        }));
      }
    }
  }, [formData.coroinha_id, coroinhas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Primeiro, atualizar a escala do coroinha
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/coroinhas/${formData.coroinha_id}/update-escala`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ escala: formData.escala }),
      });

      // Depois, atualizar a escala
      onSave({
        ...formData,
        coroinha_id: parseInt(formData.coroinha_id)
      });
    } catch (error) {
      console.error('Erro ao atualizar escala:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Escala</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <DatePicker
              selected={formData.data}
              onChange={(date) => setFormData({ ...formData, data: date || new Date() })}
            />
          </div>

          <div className="space-y-2">
            <Label>Horário</Label>
            <Input
              type="time"
              value={formData.horario}
              onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Local</Label>
            <Select
              value={formData.local}
              onValueChange={(value) => setFormData({ ...formData, local: value })}
            >
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Coroinha</Label>
            <Select
              value={formData.coroinha_id}
              onValueChange={(value) => setFormData({ ...formData, coroinha_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o coroinha" />
              </SelectTrigger>
              <SelectContent>
                {coroinhas.map((coroinha) => (
                  <SelectItem key={coroinha.id} value={coroinha.id.toString()}>
                    {coroinha.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantidade de Escalas</Label>
            <Input
              type="number"
              min="0"
              value={formData.escala}
              onChange={(e) => setFormData({ ...formData, escala: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}