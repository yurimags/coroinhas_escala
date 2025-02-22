import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Server {
  id: number;
  nome: string;
  comunidade: string;
  disponibilidade_dias: string[];
  disponibilidade_locais: string[];
  sub_acolito: boolean;
  acolito: boolean;
  escala: number;
}

export const useServers = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("coroinhas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setServers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching servers");
    } finally {
      setLoading(false);
    }
  };

  const addServer = async (newServer: Omit<Server, "id">) => {
    try {
      const { data, error } = await supabase
        .from("coroinhas")
        .insert([newServer])
        .select()
        .single();

      if (error) throw error;
      setServers([...servers, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding server");
      throw err;
    }
  };

  const updateServer = async (id: number, updates: Partial<Server>) => {
    try {
      const { data, error } = await supabase
        .from("coroinhas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setServers(servers.map((s) => (s.id === id ? data : s)));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating server");
      throw err;
    }
  };

  const deleteServer = async (id: number) => {
    try {
      const { error } = await supabase.from("coroinhas").delete().eq("id", id);

      if (error) throw error;
      setServers(servers.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting server");
      throw err;
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  return {
    servers,
    loading,
    error,
    fetchServers,
    addServer,
    updateServer,
    deleteServer,
  };
};
