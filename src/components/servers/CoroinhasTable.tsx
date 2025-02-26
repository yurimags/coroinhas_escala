import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowUpDown, Edit2, Trash2, Plus, Upload, Download, Settings2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ServerManagement } from './ServerManagement';
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Coroinha } from '@/types/coroinha';

interface CoroinhasTableProps {
  coroinhas: Coroinha[];
  onUpdate: () => void;
}

const API_BASE_URL = 'http://localhost:5000';

const ColumnVisibilityControl = ({
  columns,
  visibleColumns,
  onVisibilityChange,
}: {
  columns: string[];
  visibleColumns: string[];
  onVisibilityChange: (column: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm" className="ml-2">
        <Settings2 className="mr-2 h-4 w-4" />
        Colunas
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {columns.map((column) => (
        <DropdownMenuCheckboxItem
          key={column}
          checked={visibleColumns.includes(column)}
          onCheckedChange={() => onVisibilityChange(column)}
        >
          {column}
        </DropdownMenuCheckboxItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

// Função auxiliar para converter string em array
const parseStringToArray = (value: string | string[]): string[] => {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return (value as string).split(',').map(item => item.trim());
  }
};

export function CoroinhasTable({ coroinhas, onUpdate }: CoroinhasTableProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCoroinha, setSelectedCoroinha] = useState<Coroinha | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    nome: true,
    acolito: true,
    sub_acolito: true,
    disponibilidade_dias: true,
    disponibilidade_locais: true,
    actions: true,
  });

  const columnHelper = createColumnHelper<Coroinha>();
  const columnLabels = {
    nome: 'Nome',
    acolito: 'ACÓLITO',
    sub_acolito: 'SUB-ACÓLITO',
    disponibilidade_dias: 'DIAS DISPONÍVEIS',
    disponibilidade_locais: 'LOCAIS DISPONÍVEIS',
    actions: 'AÇÕES'
  };

  const handleColumnVisibilityChange = (column: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev]
    }));
  };

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
        cell: (info) => {
          const dias = parseStringToArray(info.getValue());
          return (
            <div className="flex flex-wrap gap-1">
              {dias.map((dia) => (
                <span key={dia} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {dia}
                </span>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor('disponibilidade_locais', {
        header: 'LOCAIS DISPONÍVEIS',
        cell: (info) => {
          const locais = parseStringToArray(info.getValue());
          return (
            <div className="flex flex-wrap gap-1">
              {locais.map((local) => (
                <span key={local} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {local}
                </span>
              ))}
            </div>
          );
        },
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

  const coroinhasOrdenados = useMemo(() => 
    [...coroinhas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })),
    [coroinhas]
  );

  const table = useReactTable({
    data: coroinhasOrdenados,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleImportXLSX = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

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
      formData.append('type', 'coroinhas');

      try {
        const response = await fetch('/api/coroinhas/import', {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
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
          duration: 6000,
        });

        input.value = '';
      }
    };

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

  const handleDeleteAll = async () => {
    if (confirm('Tem certeza que deseja excluir TODOS os coroinhas? Esta ação não pode ser desfeita.')) {
      try {
        const response = await fetch('/api/coroinhas', {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: "Sucesso",
            description: "Todos os coroinhas foram excluídos com sucesso",
          });
          onUpdate();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Erro ao excluir todos os coroinhas');
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro ao excluir todos os coroinhas",
          variant: "destructive",
        });
      }
    }
  };

  const handleExportXLSX = async () => {
    try {
      const response = await fetch('/api/coroinhas/export', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

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
        description: "Erro ao exportar os dados",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Coroinhas</h1>
        <div className="flex gap-3 items-center">
          <ColumnVisibilityControl
            columns={Object.values(columnLabels)}
            visibleColumns={Object.entries(columnVisibility)
              .filter(([_, visible]) => visible)
              .map(([key]) => columnLabels[key as keyof typeof columnLabels])}
            onVisibilityChange={(columnLabel) => {
              const columnKey = Object.entries(columnLabels)
                .find(([, label]) => label === columnLabel)?.[0];
              if (columnKey) handleColumnVisibilityChange(columnKey);
            }}
          />
          <Button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
            variant="default"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Todos
          </Button>
          <Button
            onClick={handleExportXLSX}
            className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
            variant="default"
          >
            <Download className="h-4 w-4" />
            Exportar XLSX
          </Button>
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
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-auto max-h-[800px] relative">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-50 shadow-sm">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => {
                    const isFirst = index === 0;
                    const isLast = index === headerGroup.headers.length - 1;
                    return (
                      <th 
                        key={header.id}
                        className={`
                          px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                          bg-gray-50
                          ${isFirst ? 'sticky left-0 z-[100]' : ''}
                          ${isLast ? 'sticky right-0 z-[100]' : ''}
                        `}
                        style={{
                          minWidth: isFirst ? '200px' : '150px',
                          maxWidth: isFirst ? '200px' : 'none'
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const isFirst = index === 0;
                    const isLast = index === row.getVisibleCells().length - 1;
                    return (
                      <td 
                        key={cell.id}
                        className={`
                          px-6 py-4 whitespace-nowrap
                          bg-white
                          ${isFirst ? 'sticky left-0 z-40' : ''}
                          ${isLast ? 'sticky right-0 z-40' : ''}
                        `}
                        style={{
                          minWidth: isFirst ? '200px' : '150px',
                          maxWidth: isFirst ? '200px' : 'none'
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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