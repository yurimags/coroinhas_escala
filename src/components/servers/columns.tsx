import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
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