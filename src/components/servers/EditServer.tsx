import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface EditServerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  coroinha: {
    id: number;
    nome: string;
    acolito: boolean;
    sub_acolito: boolean;
    disponibilidade_dias: string[];
    disponibilidade_locais: string[];
  };
}

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const LOCAIS = ['Matriz', 'Rainha da Paz', 'Cristo Rei', 'Bom Pastor'];

export function EditServer({ isOpen, onClose, onSave, coroinha }: EditServerProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: coroinha.nome,
    acolito: coroinha.acolito,
    sub_acolito: coroinha.sub_acolito,
    disponibilidade_dias: coroinha.disponibilidade_dias,
    disponibilidade_locais: coroinha.disponibilidade_locais,
  });
  const { toast } = useToast();

  const handleDiaChange = (dia: string) => {
    setFormData(prev => ({
      ...prev,
      disponibilidade_dias: prev.disponibilidade_dias.includes(dia)
        ? prev.disponibilidade_dias.filter(d => d !== dia)
        : [...prev.disponibilidade_dias, dia]
    }));
  };

  const handleLocalChange = (local: string) => {
    setFormData(prev => ({
      ...prev,
      disponibilidade_locais: prev.disponibilidade_locais.includes(local)
        ? prev.disponibilidade_locais.filter(l => l !== local)
        : [...prev.disponibilidade_locais, local]
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/coroinhas/${coroinha.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar dados');
      }

      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso!",
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Coroinha</DialogTitle>
          <DialogDescription>
            Atualize as informações do coroinha aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label>Função</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="acolito"
                  checked={formData.acolito}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, acolito: checked as boolean }))
                  }
                />
                <Label htmlFor="acolito">Acólito</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sub_acolito"
                  checked={formData.sub_acolito}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, sub_acolito: checked as boolean }))
                  }
                />
                <Label htmlFor="sub_acolito">Sub-Acólito</Label>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Disponibilidade - Dias</Label>
            <div className="grid grid-cols-2 gap-2">
              {DIAS.map((dia) => (
                <div key={dia} className="flex items-center gap-2">
                  <Checkbox
                    id={`dia-${dia}`}
                    checked={formData.disponibilidade_dias.includes(dia)}
                    onCheckedChange={() => handleDiaChange(dia)}
                  />
                  <Label htmlFor={`dia-${dia}`}>{dia}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Disponibilidade - Locais</Label>
            <div className="grid grid-cols-2 gap-2">
              {LOCAIS.map((local) => (
                <div key={local} className="flex items-center gap-2">
                  <Checkbox
                    id={`local-${local}`}
                    checked={formData.disponibilidade_locais.includes(local)}
                    onCheckedChange={() => handleLocalChange(local)}
                  />
                  <Label htmlFor={`local-${local}`}>{local}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 