import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ScheduleFiltersProps {
  locais: string[];
  onFilterChange: (filters: { local?: string; status?: string; search?: string }) => void;
}

export function ScheduleFilters({ locais, onFilterChange }: ScheduleFiltersProps) {
  const [filters, setFilters] = React.useState({
    local: "",
    status: "",
    search: ""
  });

  const handleFilterChange = (type: string, value: string) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    setFilters({ local: "", status: "", search: "" });
    onFilterChange({});
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select
              value={filters.local}
              onValueChange={(value) => handleFilterChange("local", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Local" />
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

          <div className="flex-1">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Input
              placeholder="Buscar coroinha..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={resetFilters}
            disabled={!filters.local && !filters.status && !filters.search}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}