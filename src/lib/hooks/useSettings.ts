import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Settings {
  id: number;
  max_escalas_dia: number;
  requer_funcao_match: boolean;
  locais: string[];
  horarios: string[];
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("configuracoes")
        .select("*")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      const { data, error } = await supabase
        .from("configuracoes")
        .update(updates)
        .eq("id", settings?.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating settings");
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
  };
};
