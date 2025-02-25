import { EscalasRepository } from "../../repositories/EscalasRepository";
import { EscalaItem } from "../../types/Escala";

interface GerarEscalaParams {
  escalaId: number;
  data: Date;
  horario: string;
  local: string;
  numeroCoroinhas: number;
}

export class GerarEscalaUseCase {
  private repository: EscalasRepository;

  constructor() {
    this.repository = new EscalasRepository();
  }

  async execute({
    escalaId,
    data,
    horario,
    local,
    numeroCoroinhas,
  }: GerarEscalaParams) {
    try {
      // Buscar coroinhas disponíveis considerando balanceamento
      const coroinhasDisponiveis =
        await this.repository.buscarCoroinhasDisponiveis(escalaId, data, local);

      if (coroinhasDisponiveis.length < numeroCoroinhas) {
        throw new Error(
          `Não há coroinhas suficientes disponíveis (necessário: ${numeroCoroinhas}, disponível: ${coroinhasDisponiveis.length})`,
        );
      }

      // Selecionar os N primeiros coroinhas (já ordenados por menor quantidade de escalas)
      const coroinhasSelecionados = coroinhasDisponiveis.slice(
        0,
        numeroCoroinhas,
      );

      // Adicionar items na escala
      for (const coroinha of coroinhasSelecionados) {
        await this.repository.adicionarItemEscala(escalaId, {
          coroinha_id: coroinha.id,
          data,
          horario,
          local,
          status: "agendado",
        });
      }

      return {
        success: true,
        message: `${numeroCoroinhas} coroinha(s) escalado(s) com sucesso`,
        coroinhas: coroinhasSelecionados,
      };
    } catch (error) {
      throw new Error(
        `Erro ao gerar escala: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  }
}
