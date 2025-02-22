import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";

interface AltarServerConfig {
  id: number;
  nome: string;
  disponibilidade_dias: string[];
  disponibilidade_locais: string[];
  sub_acolito: boolean;
  acolito: boolean;
}

export const AltarServerConfig = () => {
  const [weekStartDate, setWeekStartDate] = React.useState("");
  const [weekEndDate, setWeekEndDate] = React.useState("");

  const createWeeklyConfig = async () => {
    if (!weekStartDate || !weekEndDate) return;

    const month = new Date(weekStartDate).toLocaleString("pt-BR", {
      month: "long",
    });
    const year = new Date(weekStartDate).getFullYear();
    const startDay = new Date(weekStartDate).getDate();
    const endDay = new Date(weekEndDate).getDate();

    const tableName = `dados_coroinhas_${month}_${year}${startDay}_${endDay}`;

    try {
      // Criar nova tabela com os dados default dos coroinhas
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data: defaultData, error: defaultError } = await supabase
        .from("coroinhas")
        .select("*");

      if (defaultError) throw defaultError;

      // Criar nova tabela para a semana
      const { error: createError } = await supabase.rpc(
        "criar_tabela_semanal",
        {
          nome_tabela: tableName,
          data_inicio: weekStartDate,
          data_fim: weekEndDate,
          dados_default: defaultData,
        },
      );

      if (createError) throw createError;

      alert("Configuração semanal criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar configuração:", error);
      alert("Erro ao criar configuração semanal");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração Semanal dos Coroinhas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data Início da Semana</Label>
            <Input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data Fim da Semana</Label>
            <Input
              type="date"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
            />
          </div>
        </div>
        <Button className="w-full" onClick={createWeeklyConfig}>
          Criar Configuração Semanal
        </Button>
      </CardContent>
    </Card>
  );
};
