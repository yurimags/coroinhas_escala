import { EscalasRepository } from "../../repositories/EscalasRepository";
import { DisponibilidadeEscala } from "../../types/Escala";

export class CriarEscalaUseCase {
  private repository: EscalasRepository;

  constructor() {
    this.repository = new EscalasRepository();
  }

  async execute(
    dataInicio: Date,
    dataFim: Date,
    disponibilidades: DisponibilidadeEscala[],
  ) {
    try {
      // Criar nova escala e suas tabelas
      const escalaId = await this.repository.criarNovaEscala(
        dataInicio,
        dataFim,
      );

      // Definir disponibilidades personalizadas
      await this.repository.definirDisponibilidadePersonalizada(
        escalaId,
        disponibilidades,
      );

      return {
        success: true,
        escalaId,
        message: "Escala criada com sucesso",
      };
    } catch (error) {
      throw new Error(
        `Erro ao criar escala: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  }
}
