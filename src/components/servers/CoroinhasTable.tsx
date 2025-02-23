import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Edit2, Trash2, Plus, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ServerManagement } from './ServerManagement';
import { useToast } from "@/components/ui/use-toast";

// Tipos básicos
interface Coroinha {
  id: number;
  nome: string;
  acolito: boolean;
  sub_acolito: boolean;
  disponibilidade_dias: string[];
  disponibilidade_locais: string[];
  escala: number;
}

interface CoroinhasTableProps {
  coroinhas: Coroinha[];
  onUpdate: () => void;
}

// Atualize todas as URLs para a porta correta do seu backend
const API_BASE_URL = 'http://localhost:5000'; // ou a porta correta do seu backend

export function CoroinhasTable({ coroinhas, onUpdate }: CoroinhasTableProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCoroinha, setSelectedCoroinha] = useState<Coroinha | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Column Helper
  const columnHelper = createColumnHelper<Coroinha>();

  // Definição das colunas
  const columns = useMemo(
    () => [
      columnHelper.accessor('nome', {
        header: ({ column }) => (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting()}
              className="text-xs font-medium text-gray-500 uppercase"
            >
              Nome
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ),
        cell: (info) => <span className="text-gray-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('acolito', {
        header: 'ACÓLITO',
        cell: (info) => (
          <span className={info.getValue() ? 'text-green-600' : 'text-red-600'}>
            {info.getValue() ? 'Sim' : 'Não'}
          </span>
        ),
      }),
      columnHelper.accessor('sub_acolito', {
        header: 'SUB-ACÓLITO',
        cell: (info) => (
          <span className={info.getValue() ? 'text-green-600' : 'text-red-600'}>
            {info.getValue() ? 'Sim' : 'Não'}
          </span>
        ),
      }),
      columnHelper.accessor('disponibilidade_dias', {
        header: 'DIAS DISPONÍVEIS',
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {info.getValue().map((dia) => (
              <span key={dia} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {dia}
              </span>
            ))}
          </div>
        ),
      }),
      columnHelper.accessor('disponibilidade_locais', {
        header: 'LOCAIS DISPONÍVEIS',
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {info.getValue().map((local) => (
              <span key={local} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                {local}
              </span>
            ))}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'AÇÕES',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(info.row.original)}
              className="p-2 hover:bg-blue-50"
            >
              <Edit2 className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(info.row.original.id)}
              className="p-2 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  // Ordena os coroinhas por nome
  const coroinhasOrdenados = useMemo(() => {
    return [...coroinhas].sort((a, b) => 
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    );
  }, [coroinhas]);

  // Use coroinhasOrdenados ao invés de coroinhas diretamente na tabela
  const table = useReactTable({
    data: coroinhasOrdenados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  // Funções de manipulação
  const handleImportXLSX = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validações do arquivo
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo Excel válido (xlsx ou xls)",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      
      // Adiciona informação sobre a estrutura esperada
      formData.append('type', 'coroinhas');

      try {
        // Primeiro, verifica se o arquivo pode ser lido
        const response = await fetch('/api/coroinhas/import', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          // Tratamento específico para diferentes tipos de erro
          if (data.error === "Erro ao importar dados" && data.details === "coroinhas is not iterable") {
            throw new Error(
              "O arquivo não está no formato correto. Certifique-se que o arquivo Excel contenha as colunas: " +
              "nome, acolito, sub_acolito, disponibilidade_dias, disponibilidade_locais"
            );
          }
          
          if (data.error && data.details) {
            throw new Error(`${data.error}: ${data.details}`);
          }

          throw new Error('Erro ao processar o arquivo');
        }

        toast({
          title: "Sucesso",
          description: "Arquivo importado com sucesso",
          duration: 3000,
        });
        
        onUpdate();
      } catch (error) {
        console.error('Detalhes do erro:', error);
        
        toast({
          title: "Erro na Importação",
          description: error instanceof Error 
            ? error.message 
            : "Erro ao processar o arquivo. Verifique se o arquivo está no formato correto:\n" +
              "- Deve ser um arquivo Excel (.xlsx ou .xls)\n" +
              "- Deve conter uma lista de coroinhas\n" +
              "- Cada linha deve ter as informações completas do coroinha",
          variant: "destructive",
          duration: 6000, // Aumenta o tempo para ler a mensagem
        });

        // Limpa o input para permitir selecionar o mesmo arquivo novamente
        input.value = '';
      }
    };

    // Adiciona informação visual sobre o formato esperado
    toast({
      title: "Selecione o arquivo",
      description: "O arquivo Excel deve conter as seguintes colunas:\n" +
                  "- Nome\n" +
                  "- Acólito (Sim/Não)\n" +
                  "- Sub-Acólito (Sim/Não)\n" +
                  "- Disponibilidade (Dias)\n" +
                  "- Disponibilidade (Locais)",
      duration: 5000,
    });

    input.click();
  };

  const handleEdit = async (coroinha: Coroinha) => {
    setSelectedCoroinha(coroinha);
    setShowEditDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este coroinha?')) {
      try {
        const response = await fetch(`/api/coroinhas/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: "Sucesso",
            description: "Coroinha excluído com sucesso",
          });
          onUpdate();
        } else {
          throw new Error('Erro ao excluir');
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir o coroinha",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Coroinhas</h1>
        <div className="flex gap-3">
          <Button
            onClick={handleImportXLSX}
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
            variant="default"
          >
            <Upload className="h-4 w-4" />
            Importar XLSX
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar Coroinha
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id}
                className="hover:bg-gray-50"
              >
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddDialog && (
        <ServerManagement
          mode="add"
          onClose={() => setShowAddDialog(false)}
          onUpdate={() => {
            onUpdate();
            setShowAddDialog(false);
          }}
        />
      )}

      {showEditDialog && selectedCoroinha && (
        <ServerManagement
          mode="edit"
          coroinha={selectedCoroinha}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedCoroinha(null);
          }}
          onUpdate={() => {
            onUpdate();
            setShowEditDialog(false);
            setSelectedCoroinha(null);
          }}
        />
      )}
    </div>
  );
}