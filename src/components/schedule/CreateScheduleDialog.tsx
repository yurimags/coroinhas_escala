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
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { EventManager } from "./EventManager";
import { ScheduleEvent, PeriodoEscala, ScheduleConfig } from "@/types/schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Periodo {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
}

interface EventoPeriodo {
  data: string;
  local: string;
  horario: string;
}

interface Coroinha {
  id: number;
  nome: string;
  disponibilidade_dias?: string[];
  disponibilidade_locais?: string[];
}

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleCreated: () => void;
}

export function CreateScheduleDialog({
  open,
  onOpenChange,
  onScheduleCreated,
}: CreateScheduleDialogProps) {
  const [locaisDisponiveis, setLocaisDisponiveis] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);
  const [eventos, setEventos] = useState<ScheduleEvent[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>("");
  const [config, setConfig] = useState<ScheduleConfig>({
    regras: {
      limiteDiario: 2,
      prioridadeAcolitos: true,
      minimoAcolitos: 1,
    },
  });
  const { toast } = useToast();
  const [coroinhas, setCoroinhas] = useState<Coroinha[]>([]);
  const [selectedCoroinha, setSelectedCoroinha] = useState<Coroinha | null>(null);
  const [disponibilidadeDias, setDisponibilidadeDias] = useState<string[]>([]);
  const [disponibilidadeLocais, setDisponibilidadeLocais] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        console.log('API URL:', apiUrl);

        console.log('Buscando locais em:', `${apiUrl}/api/locais/disponiveis`);
        const locaisResponse = await fetch(`${apiUrl}/api/locais/disponiveis`);
        console.log('Status da resposta de locais:', locaisResponse.status);
        
        if (!locaisResponse.ok) {
          const errorText = await locaisResponse.text();
          console.error('Erro na resposta de locais:', errorText);
          throw new Error(`Erro ao buscar locais: ${locaisResponse.status} - ${errorText}`);
        }

        console.log('Buscando períodos em:', `${apiUrl}/api/escalas/periodos`);
        const periodosResponse = await fetch(`${apiUrl}/api/escalas/periodos`);
        console.log('Status da resposta de períodos:', periodosResponse.status);

        if (!periodosResponse.ok) {
          const errorText = await periodosResponse.text();
          console.error('Erro na resposta de períodos:', errorText);
          throw new Error(`Erro ao buscar períodos: ${periodosResponse.status} - ${errorText}`);
        }

        const locaisData = await locaisResponse.json();
        const periodosData = await periodosResponse.json();

        console.log('Locais disponíveis:', locaisData);
        console.log('Períodos:', periodosData);

        if (!Array.isArray(locaisData)) {
          console.error('Resposta de locais não é um array:', locaisData);
          throw new Error('Formato inválido de resposta para locais');
        }

        setLocaisDisponiveis(locaisData);
        setPeriodos(periodosData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro desconhecido ao carregar dados",
          variant: "destructive",
        });
      }
    };

    const fetchCoroinhas = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/coroinhas`);
        const data = await response.json();
        
        setCoroinhas(data.map((c: any) => {
          let disponibilidade_dias: string[] = [];
          let disponibilidade_locais: string[] = [];

          try {
            if (typeof c.disponibilidade_dias === 'string') {
              if (c.disponibilidade_dias.trim().startsWith('[')) {
                disponibilidade_dias = JSON.parse(c.disponibilidade_dias);
              } else {
                disponibilidade_dias = [c.disponibilidade_dias];
              }
            } else if (Array.isArray(c.disponibilidade_dias)) {
              disponibilidade_dias = c.disponibilidade_dias;
            }
          } catch (error: any) {
            console.error('Erro ao processar disponibilidade_dias:', error);
            if (typeof c.disponibilidade_dias === 'string') {
              disponibilidade_dias = c.disponibilidade_dias.split(',').map((d: string) => d.trim()).filter(Boolean);
            }
          }

          try {
            if (typeof c.disponibilidade_locais === 'string') {
              if (c.disponibilidade_locais.trim().startsWith('[')) {
                disponibilidade_locais = JSON.parse(c.disponibilidade_locais);
              } else {
                disponibilidade_locais = [c.disponibilidade_locais];
              }
            } else if (Array.isArray(c.disponibilidade_locais)) {
              disponibilidade_locais = c.disponibilidade_locais;
            }
          } catch (error: any) {
            console.error('Erro ao processar disponibilidade_locais:', error);
            if (typeof c.disponibilidade_locais === 'string') {
              disponibilidade_locais = c.disponibilidade_locais.split(',').map((l: string) => l.trim()).filter(Boolean);
            }
          }

          return {
            ...c,
            disponibilidade_dias,
            disponibilidade_locais
          };
        }));
      } catch (error: any) {
        console.error('Erro ao carregar coroinhas:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar lista de coroinhas",
          variant: "destructive",
        });
      }
    };

    if (open) {
      console.log('Dialog aberto, buscando dados...');
      fetchData();
      fetchCoroinhas();
    }
  }, [open, toast]);

  const handleCreatePeriod = async () => {
    if (!dataInicio || !dataFim) {
      toast({
        title: "Erro",
        description: "Selecione as datas de início e fim do período",
        variant: "destructive",
      });
      return;
    }

    if (eventos.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um evento para o período",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Criar o período com os eventos
      const periodoData = {
        data_inicio: dataInicio,
        data_fim: dataFim,
        nome: `escala_${dataInicio.getDate()}_${dataFim.getDate()}`,
        eventos: eventos
      };

      console.log('Enviando dados do período:', periodoData);

      const periodoResponse = await fetch(`${apiUrl}/api/escalas/periodos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(periodoData),
      });

      if (!periodoResponse.ok) {
        const errorData = await periodoResponse.json();
        throw new Error(errorData.message || errorData.error || 'Erro ao criar período');
      }

      toast({
        title: "Sucesso",
        description: "Período criado com sucesso!",
      });

      // Limpar formulário
      setEventos([]);
      setDataInicio(null);
      setDataFim(null);
      
      // Atualizar lista de períodos
      const periodosResponse = await fetch(`${apiUrl}/api/escalas/periodos`);
      const periodosData = await periodosResponse.json();
      setPeriodos(periodosData);

      onScheduleCreated();
      onOpenChange(false);

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

  const getDiaSemana = (data: Date): string => {
    const dias = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado"
    ];
    return dias[data.getDay()];
  };

  const handleGenerateSchedule = async () => {
    if (!periodoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um período para gerar as escalas",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Buscar eventos do período selecionado
      const eventosResponse = await fetch(`${apiUrl}/api/escalas/periodos/${periodoSelecionado}/eventos`);
      if (!eventosResponse.ok) {
        throw new Error("Erro ao buscar eventos do período");
      }
      const eventosData = await eventosResponse.json();
      const eventosPeriodo = eventosData.eventos;

      if (!eventosPeriodo || eventosPeriodo.length === 0) {
        throw new Error("Nenhum evento encontrado para o período selecionado");
      }

      // Extrair locais, dias e horários únicos dos eventos
      const locaisUnicos = [...new Set(eventosPeriodo.map((e) => e.local))];
      const diasUnicos = [...new Set(eventosPeriodo.map((e) => getDiaSemana(new Date(e.data))))];
      const horariosUnicos = [...new Set(eventosPeriodo.map((e) => e.horario))];

      console.log('Dados para geração:', {
        periodo_id: periodoSelecionado,
        locais: locaisUnicos,
        dias: diasUnicos,
        horarios: horariosUnicos,
        eventos: eventosPeriodo
      });

      // Gerar as escalas para o período
      const response = await fetch(`${apiUrl}/api/escalas/gerar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodo_id: periodoSelecionado,
          locais: locaisUnicos,
          dias: diasUnicos,
          horarios: horariosUnicos,
          regras: config.regras,
          eventos: eventosPeriodo
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.alertas?.length > 0) {
          data.alertas.forEach((alerta) => {
            toast({
              title: "Alerta",
              description: alerta,
              variant: "destructive",
            });
          });
        } else {
          throw new Error(data.message || data.error || 'Erro ao criar escalas');
        }
      }

      toast({
        title: "Sucesso",
        description: `Foram geradas ${data.count} escalas para o período selecionado`,
      });

      setPeriodoSelecionado("");
      setConfig({
        regras: {
          limiteDiario: 2,
          prioridadeAcolitos: true,
          minimoAcolitos: 1,
        },
      });

      onScheduleCreated();
      onOpenChange(false);

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

  const handleSaveDisponibilidade = async () => {
    if (!selectedCoroinha || !periodoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um coroinha e um período",
        variant: "destructive",
      });
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/escalas/periodos/${periodoSelecionado}/disponibilidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coroinha_id: selectedCoroinha.id,
          disponibilidade_dias: disponibilidadeDias,
          disponibilidade_locais: disponibilidadeLocais
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar disponibilidade');
      }

      toast({
        title: "Sucesso",
        description: "Disponibilidade salva com sucesso",
      });

      // Limpar seleções
      setSelectedCoroinha(null);
      setDisponibilidadeDias([]);
      setDisponibilidadeLocais([]);

    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleCoroinhaSelect = (value: string) => {
    const selectedCoroinha = coroinhas.find((c: Coroinha) => c.id === parseInt(value));
    if (selectedCoroinha) {
      setSelectedCoroinha(selectedCoroinha);
      setDisponibilidadeDias(selectedCoroinha.disponibilidade_dias || []);
      setDisponibilidadeLocais(selectedCoroinha.disponibilidade_locais || []);
    }
  };

  const handleAlertaChange = (alerta: boolean) => {
    // Implementation of handleAlertaChange function
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Gerenciar Períodos e Escalas</DialogTitle>
          <DialogDescription className="text-sm">
            Crie um novo período ou gere escalas para um período existente
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Tabs defaultValue="novo">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="novo">Novo Período</TabsTrigger>
              <TabsTrigger value="existente">Gerar Escalas</TabsTrigger>
              <TabsTrigger value="disponibilidades">Disponibilidades</TabsTrigger>
            </TabsList>

            <TabsContent value="novo">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Novo Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Data de Início*</Label>
                      <DatePicker
                        value={dataInicio || undefined}
                        onChange={(date) => setDataInicio(date || null)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Data de Fim*</Label>
                      <DatePicker
                        value={dataFim || undefined}
                        onChange={(date) => setDataFim(date || null)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Eventos do Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <EventManager
                    eventos={eventos}
                    locaisDisponiveis={locaisDisponiveis}
                    onEventosChange={setEventos}
                    dataInicio={dataInicio || undefined}
                    dataFim={dataFim || undefined}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreatePeriod}
                  disabled={isLoading || !dataInicio || !dataFim || eventos.length === 0}
                >
                  {isLoading ? "Criando..." : "Criar Período"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="existente">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gerar Escalas para Período Existente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Período*</Label>
                    <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um período" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodos.map((periodo) => (
                          <SelectItem key={periodo.id} value={periodo.id.toString()}>
                            {periodo.nome} ({new Date(periodo.data_inicio).toLocaleDateString()} - {new Date(periodo.data_fim).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">Regras de Geração</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="prioridadeAcolitos"
                            checked={config.regras.prioridadeAcolitos}
                            onCheckedChange={(checked) =>
                              setConfig({
                                ...config,
                                regras: {
                                  ...config.regras,
                                  prioridadeAcolitos: checked as boolean,
                                },
                              })
                            }
                          />
                          <Label htmlFor="prioridadeAcolitos">
                            Priorizar acólitos na geração das escalas
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="minimoAcolitos">
                            Mínimo de acólitos por escala
                          </Label>
                          <Input
                            id="minimoAcolitos"
                            type="number"
                            min={0}
                            max={5}
                            value={config.regras.minimoAcolitos}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                regras: {
                                  ...config.regras,
                                  minimoAcolitos: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="limiteDiario">
                            Limite de escalas por dia para cada coroinha
                          </Label>
                          <Input
                            id="limiteDiario"
                            type="number"
                            min={1}
                            max={5}
                            value={config.regras.limiteDiario}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                regras: {
                                  ...config.regras,
                                  limiteDiario: parseInt(e.target.value) || 1,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Se não houver acólitos disponíveis para um evento, um sub-acólito será designado.
                  Se não houver sub-acólitos disponíveis, a escala será gerada com os demais membros disponíveis.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerateSchedule}
                  disabled={isLoading || !periodoSelecionado}
                >
                  {isLoading ? "Gerando..." : "Gerar Escalas"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="disponibilidades">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Definir Disponibilidades Personalizadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Período*</Label>
                      <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um período" />
                        </SelectTrigger>
                        <SelectContent>
                          {periodos.map((periodo) => (
                            <SelectItem key={periodo.id} value={periodo.id.toString()}>
                              {periodo.nome} ({new Date(periodo.data_inicio).toLocaleDateString()} - {new Date(periodo.data_fim).toLocaleDateString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Coroinha*</Label>
                      <Select value={selectedCoroinha?.id.toString()} onValueChange={handleCoroinhaSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um coroinha" />
                        </SelectTrigger>
                        <SelectContent>
                          {coroinhas.map((coroinha) => (
                            <SelectItem key={coroinha.id} value={coroinha.id.toString()}>
                              {coroinha.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Dias Disponíveis*</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((dia) => (
                          <div key={dia} className="flex items-center space-x-2">
                            <Checkbox
                              id={`dia-${dia}`}
                              checked={disponibilidadeDias.includes(dia)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setDisponibilidadeDias([...disponibilidadeDias, dia]);
                                } else {
                                  setDisponibilidadeDias(disponibilidadeDias.filter(d => d !== dia));
                                }
                              }}
                            />
                            <Label htmlFor={`dia-${dia}`}>{dia}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Locais Disponíveis*</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {locaisDisponiveis.map((local) => (
                          <div key={local} className="flex items-center space-x-2">
                            <Checkbox
                              id={`local-${local}`}
                              checked={disponibilidadeLocais.includes(local)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setDisponibilidadeLocais([...disponibilidadeLocais, local]);
                                } else {
                                  setDisponibilidadeLocais(disponibilidadeLocais.filter(l => l !== local));
                                }
                              }}
                            />
                            <Label htmlFor={`local-${local}`}>{local}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCoroinha(null);
                        setDisponibilidadeDias([]);
                        setDisponibilidadeLocais([]);
                      }}
                    >
                      Limpar
                    </Button>
                    <Button
                      onClick={handleSaveDisponibilidade}
                      disabled={!selectedCoroinha || !periodoSelecionado || disponibilidadeDias.length === 0 || disponibilidadeLocais.length === 0}
                    >
                      Salvar Disponibilidade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}