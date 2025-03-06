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
    this.listarCoroinhasDisponiveis = this.listarCoroinhasDisponiveis.bind(this);
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
      const { periodo_id, eventos, regras } = req.body;
      const escalasGeradas = [];
      const alertas = [];
      
      // Ordenar eventos cronologicamente
      const eventosOrdenados = [...eventos].sort((a, b) => 
        new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      // Manter um mapa de contagem de escalas para controle local
      const contadorEscalas = new Map<number, number>();

      for (const evento of eventosOrdenados) {
        const data = new Date(evento.data);
        const diaSemana = getDiaSemana(data);
        const ehFinalDeSemana = diaSemana === "Sábado" || diaSemana === "Domingo";
        const ehComunidade = ["Rainha Da Paz", "Cristo Rei", "Bom Pastor"].includes(evento.local);
        
        // Buscar todos os coroinhas disponíveis para este evento
        let coroinhasDisponiveis = await this.periodosRepository.obterCoroinhasDisponiveis(
          periodo_id,
          data,
          evento.local,
          diaSemana
        );

        if (coroinhasDisponiveis.length === 0) {
          alertas.push(`Nenhum coroinha disponível para ${evento.data} em ${evento.local}`);
          continue;
        }

        // Atualizar contagem local de escalas
        coroinhasDisponiveis = coroinhasDisponiveis.map(c => ({
          ...c,
          escala_total: (contadorEscalas.get(c.id) || 0) + (c.escala || 0)
        }));

        // Encontrar o menor número de escalas entre todos os coroinhas disponíveis
        const menorEscala = Math.min(...coroinhasDisponiveis.map(c => c.escala_total));

        // Filtrar coroinhas já escalados no mesmo dia
        const coroinhasJaEscalados = escalasGeradas
          .filter(e => new Date(e.data).toDateString() === data.toDateString())
          .map(e => e.coroinha_id);

        // Filtrar coroinhas disponíveis removendo os já escalados no dia
        coroinhasDisponiveis = coroinhasDisponiveis.filter(c => !coroinhasJaEscalados.includes(c.id));

        // Primeiro, selecionar apenas coroinhas com o menor número de escalas
        let coroinhasCandidatos = coroinhasDisponiveis.filter(c => c.escala_total === menorEscala);
        
        // Se não houver candidatos suficientes com o menor número de escalas, incluir os próximos
        if (coroinhasCandidatos.length < evento.numero_coroinhas) {
          coroinhasCandidatos = coroinhasDisponiveis.sort((a, b) => a.escala_total - b.escala_total);
        }

        const numeroCoroinhasNecessario = evento.numero_coroinhas || (ehFinalDeSemana ? 4 : 3);
        let coroinhasSelecionados = [];

        // Para finais de semana e comunidades, tentar incluir um acólito/sub-acólito
        if (ehFinalDeSemana || ehComunidade) {
          const acolitosDisponiveis = coroinhasCandidatos
            .filter(c => c.acolito || c.sub_acolito)
            .sort((a, b) => a.escala_total - b.escala_total);

          if (acolitosDisponiveis.length > 0) {
            coroinhasSelecionados.push(acolitosDisponiveis[0]);
            coroinhasCandidatos = coroinhasCandidatos.filter(c => c.id !== acolitosDisponiveis[0].id);
          }
        }

        // Completar com os demais coroinhas
        while (coroinhasSelecionados.length < numeroCoroinhasNecessario && coroinhasCandidatos.length > 0) {
          const proximo = coroinhasCandidatos.shift()!;
          coroinhasSelecionados.push(proximo);
        }

        // Registrar as escalas
        for (const coroinha of coroinhasSelecionados) {
          await this.periodosRepository.registrarServico(
            coroinha.id,
            periodo_id,
            data,
            evento.horario,
            evento.local
          );

          // Atualizar contador local e incrementar escala
          contadorEscalas.set(coroinha.id, (contadorEscalas.get(coroinha.id) || 0) + 1);
          await this.repository.incrementarEscala(coroinha.id);

          const escala = await this.repository.criar({
            data: data,
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

  async listarCoroinhasDisponiveis(req: Request, res: Response) {
    try {
      const { periodo_id, data, local } = req.params;
      const coroinhas = await this.repository.listarCoroinhasDisponiveis(
        parseInt(periodo_id),
        new Date(data),
        local
      );
      res.json(coroinhas);
    } catch (error) {
      res.status(500).json({
        error: "Erro ao listar coroinhas disponíveis",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }
}
