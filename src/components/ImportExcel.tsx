import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';

interface ImportExcelProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

export function ImportExcel({ isOpen, onClose, onImport }: ImportExcelProps) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Transformar os dados para o formato esperado
    const formattedData = jsonData.map((row: any) => ({
      nome: row.Nome,
      acolito: row.Acólito === 'Sim',
      sub_acolito: row['Sub-Acólito'] === 'Sim',
      disponibilidade_dias: JSON.stringify([
        row.Segunda && 'Segunda',
        row.Terça && 'Terça',
        row.Quarta && 'Quarta',
        row.Quinta && 'Quinta',
        row.Sexta && 'Sexta',
        row.Sábado && 'Sábado',
        row.Domingo && 'Domingo'
      ].filter(Boolean)),
      disponibilidade_locais: JSON.stringify([
        row.Paróquia && 'Igreja Matriz',
        row.RainhaDaPaz && 'Capela Rainha da Paz',
        row.CristoRei && 'Capela Cristo Rei',
        row.BomPastor && 'Capela Bom Pastor'
      ].filter(Boolean))
    }));

    setPreviewData(formattedData);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/coroinhas/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewData)
      });

      if (!response.ok) {
        throw new Error('Erro ao importar dados');
      }

      toast({
        title: "Sucesso",
        description: "Dados importados com sucesso!",
      });
      onImport();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao importar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Excel</DialogTitle>
          <DialogDescription>
            Selecione um arquivo Excel para importar os dados dos coroinhas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />

          {previewData.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Preview dos dados:</h3>
              <div className="max-h-60 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Acólito</th>
                      <th>Sub-Acólito</th>
                      <th>Dias</th>
                      <th>Locais</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.nome}</td>
                        <td>{item.acolito ? '✅' : '❌'}</td>
                        <td>{item.sub_acolito ? '✅' : '❌'}</td>
                        <td>{JSON.parse(item.disponibilidade_dias).join(', ')}</td>
                        <td>{JSON.parse(item.disponibilidade_locais).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Importando...' : 'Importar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 