import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServerConfigDialogProps {
  server: {
    id: number;
    name: string;
    community: string;
    isSubAcolyte: boolean;
    isAcolyte: boolean;
    availableDays: string[];
    availableLocations: string[];
  };
  onClose: () => void;
  onSave: (data: any) => void;
}

export const ServerConfigDialog = ({
  server,
  onClose,
  onSave,
}: ServerConfigDialogProps) => {
  const daysOfWeek = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  const locations = ["Igreja Matriz", "Capela"];

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Configurar Disponibilidade - {server.name}</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Dias Disponíveis</Label>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <div className="space-y-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox id={`day-${day}`} />
                  <Label htmlFor={`day-${day}`}>{day}</Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-4">
          <Label>Locais Disponíveis</Label>
          <ScrollArea className="h-[120px] w-full rounded-md border p-4">
            <div className="space-y-2">
              {locations.map((location) => (
                <div key={location} className="flex items-center space-x-2">
                  <Checkbox id={`location-${location}`} />
                  <Label htmlFor={`location-${location}`}>{location}</Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-4">
          <Label>Funções</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="sub-acolyte" defaultChecked={server.isSubAcolyte} />
              <Label htmlFor="sub-acolyte">Sub-Acólito</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="acolyte" defaultChecked={server.isAcolyte} />
              <Label htmlFor="acolyte">Acólito</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(server)}>Salvar</Button>
        </div>
      </div>
    </DialogContent>
  );
};
