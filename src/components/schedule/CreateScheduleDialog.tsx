  import React, { useState, useEffect } from "react";
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Label } from "@/components/ui/label";
  import { useToast } from "@/components/ui/use-toast";
  import { Checkbox } from "@/components/ui/checkbox";
  import { MultiSelect } from "@/components/ui/multi-select";
  import { Input } from "@/components/ui/input";

  interface CreateScheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScheduleCreated: () => void;
  }

  interface ScheduleConfig {
    locais: string[];
    dias: string[];
    horarios: string[];
    regras: {
      limiteDiario: number;
      prioridadeAcolitos: boolean;
    };
  }

  interface Escala {
    id: number;
    data: string;
    horario: string;
    local: string;
    coroinha_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    coroinha_nome: string;
  }

  const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const DIAS_COMPLETOS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  export function CreateScheduleDialog({
    open,
    onOpenChange,
    onScheduleCreated,
  }: CreateScheduleDialogProps) {
    const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [novoHorario, setNovoHorario] = useState("");
    const [numeroCoroinhas, setNumeroCoroinhas] = useState(1);
    const [config, setConfig] = useState<ScheduleConfig>({
      locais: [],
      dias: [],
      horarios: [],
      regras: {
        limiteDiario: 2,
        prioridadeAcolitos: true,
      },
    });
    const { toast } = useToast();

    useEffect(() => {
      const fetchData = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          const locaisResponse = await fetch(`${apiUrl}/api/locais-disponiveis`);
          if (!locaisResponse.ok) throw new Error("Erro ao buscar locais");
          const locaisData = await locaisResponse.json();
          setLocaisDisponiveis(locaisData || []);
        } catch (error) {
          console.error('Erro:', error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados iniciais",
            variant: "destructive",
          });
        }
      };
      if (open) fetchData();
    }, [open, toast]);

    const handleDiaToggle = (diaIndex: number) => {
      const diaCompleto = DIAS_COMPLETOS[diaIndex];
      setConfig(prev => ({
        ...prev,
        dias: prev.dias.includes(diaCompleto)
          ? prev.dias.filter(d => d !== diaCompleto)
          : [...prev.dias, diaCompleto]
      }));
    };

    const handleAddHorario = () => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (timeRegex.test(novoHorario)) {
        setConfig(prev => ({
          ...prev,
          horarios: [...new Set([...prev.horarios, novoHorario])].sort()
        }));
        setNovoHorario("");
      } else {
        toast({
          title: "Formato inválido",
          description: "Use o formato HH:mm (ex: 08:30)",
          variant: "destructive",
        });
      }
    };

    const removeHorario = (horario: string) => {
      setConfig(prev => ({
        ...prev,
        horarios: prev.horarios.filter(h => h !== horario)
      }));
    };

    const handleSubmit = async () => {
      if (config.locais.length === 0 || config.dias.length === 0 || config.horarios.length === 0) {
        toast({
          title: "Erro",
          description: "Selecione pelo menos um local, dia e horário",
          variant: "destructive",
        });
        return;
      }
    
      setIsLoading(true);
    
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const diasFormatados = config.dias.map(diaCompleto => 
          DIAS_SEMANA[DIAS_COMPLETOS.indexOf(diaCompleto)]
        );

        const response = await fetch(`${apiUrl}/api/escalas/gerar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...config,
            dias: diasFormatados,
            numeroCoroinhas,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.message || 'Erro ao criar escalas');

        toast({
          title: "Sucesso",
          description: `Foram geradas ${data.count} escalas`,
        });

        setConfig({
          locais: [],
          dias: [],
          horarios: [],
          regras: { limiteDiario: 2, prioridadeAcolitos: true },
        });

        onScheduleCreated();

      } catch (error) {
        console.error('Erro:', error);
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Gerar Nova Escala</DialogTitle>
            <DialogDescription className="text-sm">
              Configure os parâmetros para geração automática de escalas
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Locais*</Label>
                <MultiSelect
                  options={locaisDisponiveis.map(local => ({ value: local, label: local }))}
                  selected={config.locais}
                  onChange={(selected) => setConfig({...config, locais: selected})}
                  placeholder="Selecione os locais"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Dias da Semana*</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DIAS_SEMANA.map((dia, index) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dia-${dia}`}
                        checked={config.dias.includes(DIAS_COMPLETOS[index])}
                        onCheckedChange={() => handleDiaToggle(index)}
                      />
                      <Label htmlFor={`dia-${dia}`} className="text-sm">{dia}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Horários*</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder="HH:mm (ex: 08:30)"
                    value={novoHorario}
                    onChange={(e) => setNovoHorario(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddHorario()}
                  />
                  <Button
                    type="button"
                    onClick={handleAddHorario}
                    variant="secondary"
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.horarios.map(horario => (
                    <div key={horario} className="bg-accent rounded-md px-2 py-1 flex items-center gap-1">
                      <span>{horario}</span>
                      <button
                        type="button"
                        onClick={() => removeHorario(horario)}
                        className="text-red-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Número de Coroinhas por Escala*</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={numeroCoroinhas}
                  onChange={(e) => setNumeroCoroinhas(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label className="text-sm font-medium">Configurações Avançadas</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="prioridade-acolitos"
                      checked={config.regras.prioridadeAcolitos}
                      onCheckedChange={(checked) => 
                        setConfig({
                          ...config,
                          regras: {...config.regras, prioridadeAcolitos: !!checked}
                        })
                      }
                    />
                    <Label htmlFor="prioridade-acolitos">Priorizar Acólitos</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label>Limite Diário:</Label>
                    <Input
                      type="number"
                      min="1"
                      max="3"
                      value={config.regras.limiteDiario}
                      onChange={(e) => 
                        setConfig({
                          ...config,
                          regras: {
                            ...config.regras, 
                            limiteDiario: Math.min(Math.max(1, Number(e.target.value)), 3)
                          }
                        })
                      }
                      className="w-16"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? "Gerando..." : "Gerar Escalas"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }