import { Coroinha } from "@/types/coroinha";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const coroinhasApi = {
  listar: async (): Promise<Coroinha[]> => {
    const response = await fetch(`${API_URL}/api/coroinhas`);
    if (!response.ok) throw new Error("Erro ao buscar coroinhas");
    return response.json();
  },

  adicionar: async (
    coroinha: Omit<Coroinha, "id">,
  ): Promise<{ id: number }> => {
    const response = await fetch(`${API_URL}/api/coroinhas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coroinha),
    });
    if (!response.ok) throw new Error("Erro ao adicionar coroinha");
    return response.json();
  },

  atualizar: async (id: number, coroinha: Partial<Coroinha>): Promise<void> => {
    const response = await fetch(`${API_URL}/api/coroinhas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coroinha),
    });
    if (!response.ok) throw new Error("Erro ao atualizar coroinha");
  },

  deletar: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/coroinhas/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Erro ao deletar coroinha");
  },

  importar: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/api/coroinhas/import`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Erro ao importar coroinhas");
  },

  exportar: async (): Promise<Blob> => {
    const response = await fetch(`${API_URL}/api/coroinhas/export`);
    if (!response.ok) throw new Error("Erro ao exportar coroinhas");
    return response.blob();
  },
};
