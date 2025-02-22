import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Schedule {
  id: number;
  semana_id: number;
  data: string;
  dia_semana: string;
  horario: string;
  local: string;
  status: string;
}

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async (date?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from("cronograma_semanal")
        .select("*")
        .order("data")
        .order("horario");

      if (date) {
        query = query.eq("data", date);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching schedules");
    } finally {
      setLoading(false);
    }
  };

  const addSchedule = async (newSchedule: Omit<Schedule, "id">) => {
    try {
      const { data, error } = await supabase
        .from("cronograma_semanal")
        .insert([newSchedule])
        .select()
        .single();

      if (error) throw error;
      setSchedules([...schedules, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding schedule");
      throw err;
    }
  };

  const updateSchedule = async (id: number, updates: Partial<Schedule>) => {
    try {
      const { data, error } = await supabase
        .from("cronograma_semanal")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setSchedules(schedules.map((s) => (s.id === id ? data : s)));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating schedule");
      throw err;
    }
  };

  const deleteSchedule = async (id: number) => {
    try {
      const { error } = await supabase
        .from("cronograma_semanal")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting schedule");
      throw err;
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
  };
};
