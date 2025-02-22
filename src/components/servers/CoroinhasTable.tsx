import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { ServerManagement } from "./ServerManagement";

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

export function CoroinhasTable({ coroinhas, onUpdate }: CoroinhasTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const toggleRow = (id: number) => {
    setExpandedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Coroinhas</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Coroinha
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-[100px]">Acólito</TableHead>
              <TableHead className="w-[100px]">Sub Acólito</TableHead>
              <TableHead className="w-[200px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coroinhas.map((coroinha) => (
              <React.Fragment key={coroinha.id}>
                <TableRow className="border-b hover:bg-gray-50">
                  <TableCell className="w-[50px] p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(coroinha.id)}
                    >
                      {expandedRows.includes(coroinha.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="p-4">{coroinha.nome}</TableCell>
                  <TableCell className="w-[100px] p-4">{coroinha.acolito ? "Sim" : "Não"}</TableCell>
                  <TableCell className="w-[100px] p-4">{coroinha.sub_acolito ? "Sim" : "Não"}</TableCell>
                  <TableCell className="w-[200px] p-4">
                    <ServerManagement 
                      coroinha={coroinha} 
                      onUpdate={onUpdate} 
                      mode="edit"
                    />
                  </TableCell>
                </TableRow>
                {expandedRows.includes(coroinha.id) && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-4">
                        <div className="mb-4">
                          <strong className="text-gray-700">Disponibilidade - Dias:</strong>
                          <div className="mt-2 text-gray-600">
                            {coroinha.disponibilidade_dias.length > 0
                              ? coroinha.disponibilidade_dias.join(", ")
                              : "Nenhum dia selecionado"}
                          </div>
                        </div>
                        <div>
                          <strong className="text-gray-700">Disponibilidade - Locais:</strong>
                          <div className="mt-2 text-gray-600">
                            {coroinha.disponibilidade_locais.length > 0
                              ? coroinha.disponibilidade_locais.join(", ")
                              : "Nenhum local selecionado"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {showAddDialog && (
        <ServerManagement
          onUpdate={() => {
            onUpdate();
            setShowAddDialog(false);
          }}
          mode="add"
        />
      )}
    </div>
  );
} 