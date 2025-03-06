import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Escala {
  id: number;
  data: string;
  horario: string;
  local: string;
  coroinha_nome: string;
  status: string;
}

interface EscalasCardsProps {
  escalas: Escala[];
}

interface EscalaAgrupada {
  data: string;
  diaSemana: string;
  local: string;
  horario: string;
  coroinhas: string[];
}

export function EscalasCards({ escalas }: EscalasCardsProps) {
  // Função para agrupar escalas por data, local e horário
  const agruparEscalas = (escalas: Escala[]): EscalaAgrupada[] => {
    const grupos: { [key: string]: EscalaAgrupada } = {};

    escalas.forEach((escala) => {
      const data = new Date(escala.data);
      const dataFormatada = format(data, 'dd/MM/yyyy');
      const diaSemana = format(data, 'EEEE', { locale: ptBR });
      const chave = `${dataFormatada}-${escala.local}-${escala.horario}`;

      if (!grupos[chave]) {
        grupos[chave] = {
          data: dataFormatada,
          diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
          local: escala.local,
          horario: escala.horario,
          coroinhas: []
        };
      }

      grupos[chave].coroinhas.push(escala.coroinha_nome);
    });

    return Object.values(grupos).sort((a, b) => {
      const [diaA] = a.data.split('/').map(Number);
      const [diaB] = b.data.split('/').map(Number);
      return diaA - diaB;
    });
  };

  const escalasAgrupadas = agruparEscalas(escalas);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {escalasAgrupadas.map((grupo, index) => (
        <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="space-y-1">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">
                {grupo.data.split('/')[0]} - {grupo.diaSemana}
              </CardTitle>
              <Badge variant="outline" className="ml-2">
                {grupo.horario}
              </Badge>
            </div>
            <CardDescription className="text-base font-medium">
              {grupo.local}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[100px] w-full rounded-md border p-4">
              <div className="space-y-2">
                {grupo.coroinhas.map((coroinha, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{coroinha}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 