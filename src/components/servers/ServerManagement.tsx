import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, Settings, PlusCircle, Pencil } from "lucide-react";
import { ServerConfigDialog } from "./ServerConfigDialog";
import { useButtonState } from '@/hooks/useButtonState'
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios';
import { EditServer } from './EditServer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';

interface ServerDisplay {
  id: number;
  name: string;
  community: string;
  isSubAcolyte: boolean;
  isAcolyte: boolean;
  scheduleCount: number;
}

const mapServerToDisplay = (server: Server): ServerDisplay => ({
  id: server.id,
  name: server.nome,
  community: server.comunidade,
  isSubAcolyte: server.sub_acolito,
  isAcolyte: server.acolito,
  scheduleCount: server.escala
});

const mapDisplayToServer = (display: Partial<ServerDisplay>): Partial<Server> => ({
  nome: display.name,
  comunidade: display.community,
  sub_acolito: display.isSubAcolyte,
  acolito: display.isAcolyte,
  escala: display.scheduleCount
});

interface ServerFormProps {
  server?: Server;
  onClose?: () => void;
}

import { useServers, Server } from "@/lib/hooks/useServers";

const ServerForm: React.FC<{ server?: Server; onClose?: () => void }> = ({
  server,
  onClose,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue={server?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="community">Community</Label>
        <Select defaultValue={server?.community}>
          <SelectTrigger>
            <SelectValue placeholder="Select community" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="st-mary">St. Mary</SelectItem>
            <SelectItem value="st-joseph">St. Joseph</SelectItem>
            <SelectItem value="st-peter">St. Peter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="sub-acolyte" defaultChecked={server?.isSubAcolyte} />
        <Label htmlFor="sub-acolyte">Sub-Acolyte</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="acolyte" defaultChecked={server?.isAcolyte} />
        <Label htmlFor="acolyte">Acolyte</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button>Save</Button>
      </div>
    </div>
  );
};

interface Coroinha {
  id?: number;
  nome: string;
  acolito: boolean;
  sub_acolito: boolean;
  disponibilidade_dias: string[];
  disponibilidade_locais: string[];
  escala: number;
}

interface ServerManagementProps {
  coroinha?: Coroinha;
  onUpdate: () => void;
  mode?: 'edit' | 'add';
}

export function ServerManagement({ coroinha, onUpdate, mode = 'edit' }: ServerManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL;

  const diasSemana = [
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
    "Domingo"
  ];

  const locais = [
    "Igreja Matriz",
    "Capela Rainha da Paz",
    "Capela Cristo Rei",
    "Capela Bom Pastor"
  ];

  const [dadosCoroinha, setDadosCoroinha] = useState<Coroinha>(
    coroinha || {
      nome: '',
      acolito: false,
      sub_acolito: false,
      disponibilidade_dias: [],
      disponibilidade_locais: [],
      escala: 0
    }
  );

  const handleDiaChange = (dia: string) => {
    setDadosCoroinha(prev => {
      const dias = prev.disponibilidade_dias.includes(dia)
        ? prev.disponibilidade_dias.filter(d => d !== dia)
        : [...prev.disponibilidade_dias, dia];
      return { ...prev, disponibilidade_dias: dias };
    });
  };

  const handleLocalChange = (local: string) => {
    setDadosCoroinha(prev => {
      const locais = prev.disponibilidade_locais.includes(local)
        ? prev.disponibilidade_locais.filter(l => l !== local)
        : [...prev.disponibilidade_locais, local];
      return { ...prev, disponibilidade_locais: locais };
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const url = mode === 'edit' 
        ? `${apiUrl}/api/coroinhas/${coroinha?.id}`
        : `${apiUrl}/api/coroinhas`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosCoroinha),
      });

      if (!response.ok) {
        throw new Error(mode === 'edit' ? 'Erro ao atualizar coroinha' : 'Erro ao adicionar coroinha');
      }

      toast({
        title: "Sucesso",
        description: mode === 'edit' ? "Dados atualizados com sucesso" : "Coroinha adicionado com sucesso",
      });

      onUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: mode === 'edit' ? "Erro ao atualizar dados" : "Erro ao adicionar coroinha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!coroinha?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/coroinhas/${coroinha.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar coroinha');
      }

      toast({
        title: "Sucesso",
        description: "Coroinha deletado com sucesso",
      });

      onUpdate();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar coroinha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportXLSX = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Processar e enviar dados para o servidor
        for (const row of jsonData) {
          await fetch(`${apiUrl}/api/coroinhas`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nome: row['Nome'],
              acolito: Boolean(row['Acólito']),
              sub_acolito: Boolean(row['Sub Acólito']),
              disponibilidade_dias: [],
              disponibilidade_locais: [],
              escala: 0
            }),
          });
        }

        toast({
          title: "Sucesso",
          description: "Dados importados com sucesso",
        });
        onUpdate();
      } catch (error) {
        console.error('Erro ao importar:', error);
        toast({
          title: "Erro",
          description: "Erro ao importar dados",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      {mode === 'edit' ? (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            Editar
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Deletar
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button onClick={() => setIsOpen(true)}>
            Adicionar Coroinha
          </Button>
          <div>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportXLSX}
              className="hidden"
              id="xlsx-upload"
            />
            <Button 
              variant="outline"
              onClick={() => document.getElementById('xlsx-upload')?.click()}
            >
              Importar XLSX
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit' ? 'Editar Coroinha' : 'Adicionar Coroinha'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {mode === 'add' && (
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={dadosCoroinha.nome}
                  onChange={(e) => setDadosCoroinha(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Funções</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="acolito"
                    checked={dadosCoroinha.acolito}
                    onCheckedChange={(checked) => 
                      setDadosCoroinha(prev => ({ ...prev, acolito: !!checked }))
                    }
                  />
                  <Label htmlFor="acolito">Acólito</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sub_acolito"
                    checked={dadosCoroinha.sub_acolito}
                    onCheckedChange={(checked) => 
                      setDadosCoroinha(prev => ({ ...prev, sub_acolito: !!checked }))
                    }
                  />
                  <Label htmlFor="sub_acolito">Sub Acólito</Label>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Disponibilidade - Dias</Label>
              <div className="grid grid-cols-2 gap-2">
                {diasSemana.map((dia) => (
                  <div key={dia} className="flex items-center gap-2">
                    <Checkbox
                      id={`dia-${dia}`}
                      checked={dadosCoroinha.disponibilidade_dias.includes(dia)}
                      onCheckedChange={() => handleDiaChange(dia)}
                    />
                    <Label htmlFor={`dia-${dia}`}>{dia}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Disponibilidade - Locais</Label>
              <div className="grid gap-2">
                {locais.map((local) => (
                  <div key={local} className="flex items-center gap-2">
                    <Checkbox
                      id={`local-${local}`}
                      checked={dadosCoroinha.disponibilidade_locais.includes(local)}
                      onCheckedChange={() => handleLocalChange(local)}
                    />
                    <Label htmlFor={`local-${local}`}>{local}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá permanentemente deletar o coroinha {coroinha?.nome}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ServerManagement;
