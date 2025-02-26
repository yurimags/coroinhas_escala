import { Request, Response } from "express";
import { EscalasRepository } from "../repositories/EscalasRepository.js";
import { PeriodosEscalaRepository } from "../repositories/PeriodosEscalaRepository.js";

interface Coroinha {
  id: number;
  nome: string;
  total_servicos: number;
  acolito: boolean;
  sub_acolito: boolean;
}

interface Escala {
  id?: number;
  data: Date;
  horario: string;
  local: string;
  coroinha_id: number;
  periodo_id?: number;
  status?: 'ativo' | 'cancelado';
}

interface EventoPeriodo {
  data: string;
  local: string;
  horario: string;
  numero_coroinhas: number;
  dia_semana?: string;
}

interface Alerta {
  mensagem: string;
  tipo: 'info' | 'warning' | 'error';
}

interface EscalaCreate {
  data: Date;
  horario: string;
  local: string;
  coroinha_id: number;
  periodo_id?: number;
}

interface EscalaUpdate {
  data?: Date;
  horario?: string;
  local?: string;
  coroinha_id?: number;
  periodo_id?: number;
  status?: 'ativo' | 'cancelado';
}

function getDiaSemana(data: Date): string {
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
}

export class EscalasController {
  private repository: EscalasRepository;
  private periodosRepository: PeriodosEscalaRepository;

  constructor() {
    this.repository = new EscalasRepository();
    this.periodosRepository = new PeriodosEscalaRepository();
    
    // Bind dos métodos
    this.listarEscalas = this.listarEscalas.bind(this);
    this.criarEscala = this.criarEscala.bind(this);
    this.gerarEscala = this.gerarEscala.bind(this);
    this.atualizarEscala = this.atualizarEscala.bind(this);
    this.deletarEscala = this.deletarEscala.bind(this);
    this.cancelarEscala = this.cancelarEscala.bind(this);
    this.exportarEscalas = this.exportarEscalas.bind(this);
    this.criarPeriodo = this.criarPeriodo.bind(this);
    this.listarPeriodos = this.listarPeriodos.bind(this);
    this.listarEventosPeriodo = this.listarEventosPeriodo.bind(this);
    this.criarDisponibilidadePeriodo = this.criarDisponibilidadePeriodo.bind(this);
    this.listarDisponibilidadesPeriodo = this.listarDisponibilidadesPeriodo.bind(this);
  }

  async criarPeriodo(req: Request, res: Response) {
    try {
      const { data_inicio, data_fim, nome, eventos } = req.body;
      console.log('Dados recebidos:', { data_inicio, data_fim, nome, eventos });

      // Criar período
      const periodo_id = await this.periodosRepository.criar({
        data_inicio: new Date(data_inicio),
        data_fim: new Date(data_fim),
        nome,
        eventos: eventos?.map((e: EventoPeriodo) => ({
          ...e,
          data: new Date(e.data)
        }))
      });

      res.json({
        success: true,
        periodo_id,
        nome
      });
    } catch (error) {
      console.error('Erro ao criar período:', error);
      res.status(500).json({
        error: "Erro ao criar período",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }

  async gerarEscala(req: Request, res: Response) {
    try {
      const { periodo_id, locais, dias, horarios, regras, eventos } = req.body;

      if (!periodo_id) {
        throw new Error("ID do período é obrigatório");
      }

      if (!Array.isArray(locais) || !Array.isArray(dias) || !Array.isArray(horarios)) {
        throw new Error("locais, dias e horarios devem ser arrays");
      }

      const escalasGeradas = [];
      const alertas = [];

      // Para cada evento
      for (const evento of eventos) {
        // Buscar coroinhas disponíveis ordenados por menor número de serviços
        const coroinhasDisponiveis = await this.periodosRepository.obterCoroinhasDisponiveis(
          periodo_id,
          new Date(evento.data),
          evento.local,
          getDiaSemana(new Date(evento.data))
        );

        // Extrair locais, dias e horários únicos dos eventos
        const locaisUnicos = [...new Set(eventos.map((e: EventoPeriodo) => e.local))];
        const diasUnicos = [...new Set(eventos.map((e: EventoPeriodo) => getDiaSemana(new Date(e.data))))];
        const horariosUnicos = [...new Set(eventos.map((e: EventoPeriodo) => e.horario))];

        console.log('Dados para geração:', {
          periodo_id,
          locais: locaisUnicos,
          dias: diasUnicos,
          horarios: horariosUnicos,
          eventos
        });

        // Filtrar coroinhas por tipo (acólito, sub-acólito, outros)
        const acolitos = coroinhasDisponiveis.filter(c => c.acolito);
        const subAcolitos = coroinhasDisponiveis.filter(c => c.sub_acolito && !c.acolito);
        const outrosCoroinhas = coroinhasDisponiveis.filter(c => !c.acolito && !c.sub_acolito);

        // Determinar quais coroinhas usar baseado nas regras
        let coroinhasSelecionados = [];
        const minimoAcolitos = regras.minimoAcolitos || 1;
        const numeroCoroinhasNecessario = evento.numero_coroinhas || 1;

        if (acolitos.length >= minimoAcolitos) {
          // Temos acólitos suficientes
          coroinhasSelecionados = [
            ...acolitos.slice(0, minimoAcolitos),
            ...subAcolitos.slice(0, Math.max(0, numeroCoroinhasNecessario - minimoAcolitos))
          ];

          if (coroinhasSelecionados.length < numeroCoroinhasNecessario) {
            coroinhasSelecionados = [
              ...coroinhasSelecionados,
              ...outrosCoroinhas.slice(0, numeroCoroinhasNecessario - coroinhasSelecionados.length)
            ];
          }
        } else if (acolitos.length > 0) {
          // Usar os acólitos disponíveis e completar com sub-acólitos
          coroinhasSelecionados = [
            ...acolitos,
            ...subAcolitos.slice(0, numeroCoroinhasNecessario - acolitos.length)
          ];

          if (coroinhasSelecionados.length < numeroCoroinhasNecessario) {
            coroinhasSelecionados = [
              ...coroinhasSelecionados,
              ...outrosCoroinhas.slice(0, numeroCoroinhasNecessario - coroinhasSelecionados.length)
            ];
          }

          alertas.push(`Número insuficiente de acólitos para ${evento.data} ${evento.horario} em ${evento.local}. Usando sub-acólitos e coroinhas regulares para completar.`);
        } else if (subAcolitos.length > 0) {
          // Usar sub-acólitos e completar com outros coroinhas se necessário
          coroinhasSelecionados = [
            ...subAcolitos.slice(0, numeroCoroinhasNecessario)
          ];

          if (coroinhasSelecionados.length < numeroCoroinhasNecessario) {
            coroinhasSelecionados = [
              ...coroinhasSelecionados,
              ...outrosCoroinhas.slice(0, numeroCoroinhasNecessario - coroinhasSelecionados.length)
            ];
          }

          alertas.push(`Nenhum acólito disponível para ${evento.data} ${evento.horario} em ${evento.local}. Usando sub-acólitos e coroinhas regulares.`);
        } else {
          // Usar outros coroinhas
          coroinhasSelecionados = outrosCoroinhas.slice(0, numeroCoroinhasNecessario);
          alertas.push(`Nenhum acólito ou sub-acólito disponível para ${evento.data} ${evento.horario} em ${evento.local}. Usando coroinhas regulares.`);
        }

        if (coroinhasSelecionados.length < numeroCoroinhasNecessario) {
          alertas.push(`Atenção: Não há coroinhas suficientes para ${evento.data} ${evento.horario} em ${evento.local}. Necessário: ${numeroCoroinhasNecessario}, Disponível: ${coroinhasSelecionados.length}`);
        }

        // Criar escala para cada coroinha selecionado
        for (const coroinha of coroinhasSelecionados) {
          // Registrar o serviço no histórico
          await this.periodosRepository.registrarServico(
            coroinha.id,
            periodo_id,
            new Date(evento.data),
            evento.horario,
            evento.local
          );

          // Criar a escala
          const escala = await this.repository.criar({
            data: new Date(evento.data),
            horario: evento.horario,
            local: evento.local,
            coroinha_id: coroinha.id,
            periodo_id
          });

          escalasGeradas.push({
            ...escala,
            coroinha_nome: coroinha.nome
          });
        }
      }

      res.json({
        success: true,
        count: escalasGeradas.length,
        escalas: escalasGeradas,
        alertas
      });

    } catch (error) {
      res.status(500).json({
        error: "Erro ao gerar escala",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }

  async listarEscalas(req: Request, res: Response) {
    try {
      const escalas = await this.repository.listar();
      res.json(escalas);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao listar escalas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async criarEscala(req: Request, res: Response) {
    try {
      const { data, horario, local, coroinha_id } = req.body;
      const escalaData: EscalaCreate = {
        data: new Date(data),
        horario,
        local,
        coroinha_id,
      };
      const resultado = await this.repository.criar(escalaData);
      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao criar escala",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async atualizarEscala(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { coroinha_id, data, horario, local } = req.body;
      const escalaData: EscalaUpdate = {
        coroinha_id,
        data: data ? new Date(data) : undefined,
        horario,
        local,
      };
      const resultado = await this.repository.atualizar(parseInt(id), escalaData);
      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao atualizar escala",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async deletarEscala(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.repository.deletar(parseInt(id));
      res.json({ success: true, message: "Escala deletada com sucesso" });
    } catch (error) {
      res.status(500).json({
        error: "Erro ao deletar escala",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async cancelarEscala(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultado = await this.repository.cancelar(parseInt(id));
      res.json(resultado);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao cancelar escala",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async exportarEscalas(req: Request, res: Response) {
    try {
      const buffer = await this.repository.exportar();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", "attachment; filename=escalas.xlsx");
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao exportar escalas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async listarPeriodos(req: Request, res: Response) {
    try {
      const periodos = await this.periodosRepository.listar();
      res.json(periodos);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao listar períodos",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }

  async listarEventosPeriodo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const eventos = await this.periodosRepository.listarEventos(parseInt(id));
      res.json({ eventos });
    } catch (error) {
      res.status(500).json({
        error: "Erro ao listar eventos do período",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }

  async criarDisponibilidadePeriodo(req: Request, res: Response) {
    try {
      const { periodo_id } = req.params;
      const { coroinha_id, disponibilidade_dias, disponibilidade_locais } = req.body;

      await this.periodosRepository.criarDisponibilidadePeriodo({
        periodo_id: parseInt(periodo_id),
        coroinha_id,
        disponibilidade_dias,
        disponibilidade_locais
      });

      res.json({
        success: true,
        message: "Disponibilidade personalizada criada com sucesso"
      });
    } catch (error) {
      res.status(500).json({
        error: "Erro ao criar disponibilidade personalizada",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }

  async listarDisponibilidadesPeriodo(req: Request, res: Response) {
    try {
      const { periodo_id } = req.params;
      const disponibilidades = await this.periodosRepository.obterDisponibilidadesPeriodo(parseInt(periodo_id));
      res.json(disponibilidades);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao listar disponibilidades do período",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
}
