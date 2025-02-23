import React, { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, Search, Settings, PlusCircle, Pencil, DownloadIcon } from "lucide-react";
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
  mode: 'add' | 'edit';
  coroinha?: Coroinha;
  onClose: () => void;
  onUpdate: () => void;
}

export function ServerManagement({ mode, coroinha, onClose, onUpdate }: ServerManagementProps) {
  const { toast } = useToast();
  
  // Inicializa o formData com os dados do coroinha se estiver em modo de edição
  const [formData, setFormData] = useState({
    nome: mode === 'edit' ? coroinha?.nome || '' : '',
    acolito: mode === 'edit' ? coroinha?.acolito || false : false,
    sub_acolito: mode === 'edit' ? coroinha?.sub_acolito || false : false,
    disponibilidade_dias: mode === 'edit' ? coroinha?.disponibilidade_dias || [] : [],
    disponibilidade_locais: mode === 'edit' ? coroinha?.disponibilidade_locais || [] : [],
  });

  // Mova as opções para um arquivo de configuração ou busque da API
  const [opcoes, setOpcoes] = useState({
    diasSemana: [],
    locais: []
  });

  // Busca as opções quando o componente é montado
  useEffect(() => {
    const buscarOpcoes = async () => {
      try {
        const response = await fetch('/api/opcoes');
        const data = await response.json();
        setOpcoes({
          diasSemana: data.diasSemana,
          locais: data.locais
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as opções",
          variant: "destructive",
        });
      }
    };

    buscarOpcoes();
  }, []);

  // Adiciona um useEffect para atualizar o formData quando o coroinha mudar
  useEffect(() => {
    if (mode === 'edit' && coroinha) {
      setFormData({
        nome: coroinha.nome,
        acolito: coroinha.acolito,
        sub_acolito: coroinha.sub_acolito,
        disponibilidade_dias: coroinha.disponibilidade_dias,
        disponibilidade_locais: coroinha.disponibilidade_locais,
      });
    }
  }, [mode, coroinha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Define a URL e método baseado no modo (add ou edit)
      const url = mode === 'add' 
        ? '/api/coroinhas'
        : `/api/coroinhas/${coroinha?.id}`; // Usa o ID do coroinha existente para edição

      const response = await fetch(url, {
        method: mode === 'add' ? 'POST' : 'PUT', // PUT para edição
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: mode === 'edit' ? coroinha?.id : undefined // Inclui o ID se for edição
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao salvar coroinha');
      }

      toast({
        title: "Sucesso",
        description: mode === 'add' 
          ? "Coroinha adicionado com sucesso"
          : "Coroinha atualizado com sucesso",
      });

      onUpdate();
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error 
          ? error.message 
          : `Erro ao ${mode === 'add' ? 'adicionar' : 'atualizar'} coroinha`,
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/coroinhas/export');
      if (!response.ok) throw new Error('Erro ao exportar dados');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'coroinhas.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Sucesso",
        description: "Dados exportados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar dados",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Gerenciar Coroinhas</h2>
        <Button onClick={handleExport} variant="outline" size="sm">
          <DownloadIcon className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
      </div>
      
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {mode === 'add' ? 'Adicionar Novo Coroinha' : 'Editar Coroinha'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Preencha os dados do coroinha abaixo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full"
                  placeholder="Digite o nome do coroinha"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Função</Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="acolito"
                      checked={formData.acolito}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, acolito: checked as boolean })
                      }
                    />
                    <Label htmlFor="acolito" className="text-sm">Acólito</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sub_acolito"
                      checked={formData.sub_acolito}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, sub_acolito: checked as boolean })
                      }
                    />
                    <Label htmlFor="sub_acolito" className="text-sm">Sub-Acólito</Label>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Disponibilidade - Dias</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {opcoes.diasSemana.map((dia) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dia-${dia}`}
                        checked={formData.disponibilidade_dias.includes(dia)}
                        onCheckedChange={(checked) => {
                          const dias = checked
                            ? [...formData.disponibilidade_dias, dia]
                            : formData.disponibilidade_dias.filter(d => d !== dia);
                          setFormData({ ...formData, disponibilidade_dias: dias });
                        }}
                      />
                      <label htmlFor={`dia-${dia}`}>{dia}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Disponibilidade - Locais</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {opcoes.locais.map((local) => (
                    <div key={local} className="flex items-center space-x-2">
                      <Checkbox
                        id={`local-${local}`}
                        checked={formData.disponibilidade_locais.includes(local)}
                        onCheckedChange={(checked) => {
                          const locaisAtualizados = checked
                            ? [...formData.disponibilidade_locais, local]
                            : formData.disponibilidade_locais.filter(l => l !== local);
                          setFormData({ ...formData, disponibilidade_locais: locaisAtualizados });
                        }}
                      />
                      <label htmlFor={`local-${local}`}>{local}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary">
                {mode === 'add' ? 'Adicionar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ServerManagement;
