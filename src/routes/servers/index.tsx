import { ImportExcel } from '../../components/ImportExcel';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useButtonState } from '@/hooks/useButtonState';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { ServerManagement } from '@/components/servers/ServerManagement';
import ServersPage from '@/pages/servers';

interface Coroinha {
  id: number;
  nome: string;
  acolito: boolean;
  sub_acolito: boolean;
  disponibilidade_dias: string[];
  disponibilidade_locais: string[];
  escala: number;
}

function ServersPage() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [coroinhas, setCoroinhas] = useState<Coroinha[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const apiUrl = import.meta.env.VITE_API_URL;

  const loadCoroinhas = async () => {
    try {
      setLoading(true);
      console.log('Carregando coroinhas...');
      
      const response = await fetch(`${apiUrl}/api/coroinhas`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dados recebidos:', data);
      setCoroinhas(data);
    } catch (error) {
      console.error('Erro ao carregar coroinhas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar coroinhas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoroinhas();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Coroinhas</h1>
        <Button onClick={() => setShowImportModal(true)}>
          Importar Excel
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Carregando coroinhas...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acólito</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Acólito</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponibilidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locais</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escala</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coroinhas.map((coroinha) => (
                <tr key={coroinha.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{coroinha.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{coroinha.acolito ? '✅' : '❌'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{coroinha.sub_acolito ? '✅' : '❌'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{coroinha.disponibilidade_dias.join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{coroinha.disponibilidade_locais.join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{coroinha.escala}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ServerManagement
                      coroinha={coroinha}
                      onUpdate={loadCoroinhas}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showImportModal && (
        <ImportExcel
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={loadCoroinhas}
        />
      )}
    </div>
  );
}

export default ServersPage; 