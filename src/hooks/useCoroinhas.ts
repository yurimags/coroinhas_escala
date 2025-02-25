import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { coroinhasApi } from "@/lib/api/coroinhas";
import { Coroinha } from "@/types/coroinha";

export function useCoroinhas() {
  const [coroinhas, setCoroinhas] = useState<Coroinha[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCoroinhas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coroinhasApi.listar();
      setCoroinhas(data);
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao carregar coroinhas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const adicionarCoroinha = useCallback(
    async (coroinha: Omit<Coroinha, "id">) => {
      try {
        await coroinhasApi.adicionar(coroinha);
        toast({
          title: "Sucesso",
          description: "Coroinha adicionado com sucesso",
        });
        await fetchCoroinhas();
      } catch (error) {
        toast({
          title: "Erro",
          description:
            error instanceof Error
              ? error.message
              : "Erro ao adicionar coroinha",
          variant: "destructive",
        });
      }
    },
    [toast, fetchCoroinhas],
  );

  const atualizarCoroinha = useCallback(
    async (id: number, coroinha: Partial<Coroinha>) => {
      try {
        await coroinhasApi.atualizar(id, coroinha);
        toast({
          title: "Sucesso",
          description: "Coroinha atualizado com sucesso",
        });
        await fetchCoroinhas();
      } catch (error) {
        toast({
          title: "Erro",
          description:
            error instanceof Error
              ? error.message
              : "Erro ao atualizar coroinha",
          variant: "destructive",
        });
      }
    },
    [toast, fetchCoroinhas],
  );

  const deletarCoroinha = useCallback(
    async (id: number) => {
      try {
        await coroinhasApi.deletar(id);
        toast({
          title: "Sucesso",
          description: "Coroinha deletado com sucesso",
        });
        await fetchCoroinhas();
      } catch (error) {
        toast({
          title: "Erro",
          description:
            error instanceof Error ? error.message : "Erro ao deletar coroinha",
          variant: "destructive",
        });
      }
    },
    [toast, fetchCoroinhas],
  );

  const importarCoroinhas = useCallback(
    async (file: File) => {
      try {
        await coroinhasApi.importar(file);
        toast({
          title: "Sucesso",
          description: "Coroinhas importados com sucesso",
        });
        await fetchCoroinhas();
      } catch (error) {
        toast({
          title: "Erro",
          description:
            error instanceof Error
              ? error.message
              : "Erro ao importar coroinhas",
          variant: "destructive",
        });
      }
    },
    [toast, fetchCoroinhas],
  );

  const exportarCoroinhas = useCallback(async () => {
    try {
      const blob = await coroinhasApi.exportar();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "coroinhas.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Sucesso", description: "Arquivo exportado com sucesso" });
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao exportar coroinhas",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    coroinhas,
    loading,
    fetchCoroinhas,
    adicionarCoroinha,
    atualizarCoroinha,
    deletarCoroinha,
    importarCoroinhas,
    exportarCoroinhas,
  };
}
