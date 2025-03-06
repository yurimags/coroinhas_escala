import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Rotate3D } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ServerManagement } from "./ServerManagement"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export type Coroinha = {
  id: number
  nome: string
  acolito: boolean
  sub_acolito: boolean
  disponibilidade_dias: string[]
  disponibilidade_locais: string[]
  escala: number
}

export const columns: ColumnDef<Coroinha>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nome",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "acolito",
    header: "Acólito",
    cell: ({ row }) => (
      <div className={row.getValue("acolito") ? "text-green-600" : "text-red-600"}>
        {row.getValue("acolito") ? "✓" : "✗"}
      </div>
    ),
  },
  {
    accessorKey: "sub_acolito",
    header: "Sub-Acólito",
    cell: ({ row }) => (
      <div className={row.getValue("sub_acolito") ? "text-green-600" : "text-red-600"}>
        {row.getValue("sub_acolito") ? "✓" : "✗"}
      </div>
    ),
  },
  {
    accessorKey: "disponibilidade_dias",
    header: "Disponibilidade",
    cell: ({ row }) => {
      const dias = row.getValue("disponibilidade_dias") as string[]
      return <div className="max-w-[200px] truncate" title={dias.join(", ")}>{dias.join(", ")}</div>
    },
  },
  {
    accessorKey: "disponibilidade_locais",
    header: "Locais",
    cell: ({ row }) => {
      const locais = row.getValue("disponibilidade_locais") as string[]
      return <div className="max-w-[200px] truncate" title={locais.join(", ")}>{locais.join(", ")}</div>
    },
  },
  {
    accessorKey: "escala",
    header: ({ table }) => {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => table.getColumn("escala")?.toggleSorting(table.getColumn("escala")?.getIsSorted() === "asc")}
            className="flex items-center"
          >
            Escala
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (confirm("Deseja realmente zerar a escala de todos os coroinhas?")) {
                try {
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                  await fetch(`${apiUrl}/api/coroinhas/reset-all-escalas`, {
                    method: 'POST',
                  });
                  window.location.reload();
                } catch (error) {
                  console.error('Erro ao zerar escalas:', error);
                }
              }
            }}
            className="flex items-center p-2 hover:bg-destructive hover:text-destructive-foreground"
            title="Zerar todas as escalas"
          >
            <Rotate3D className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const [value, setValue] = useState(row.getValue("escala") || 0);
      const [isEditing, setIsEditing] = useState(false);

      return (
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onBlur={async () => {
                try {
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                  await fetch(`${apiUrl}/api/coroinhas/${row.original.id}/update-escala`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ escala: value }),
                  });
                  setIsEditing(false);
                } catch (error) {
                  console.error('Erro ao atualizar escala:', error);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-16 h-8 text-center"
              min={0}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="w-16 h-8 flex items-center justify-center cursor-pointer rounded hover:bg-accent hover:text-accent-foreground"
            >
              {value}
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                await fetch(`${apiUrl}/api/coroinhas/${row.original.id}/reset-escala`, {
                  method: 'POST',
                });
                setValue(0);
              } catch (error) {
                console.error('Erro ao zerar escala:', error);
              }
            }}
            className="flex items-center p-2 hover:bg-destructive hover:text-destructive-foreground"
            title="Zerar escala"
          >
            <Rotate3D className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const coroinha = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <ServerManagement coroinha={coroinha} mode="edit" onUpdate={() => {}} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 