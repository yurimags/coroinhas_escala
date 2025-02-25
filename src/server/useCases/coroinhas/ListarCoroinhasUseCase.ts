import { CoroinhasRepository } from "../../repositories/CoroinhasRepository";

export class ListarCoroinhasUseCase {
  private repository: CoroinhasRepository;

  constructor() {
    this.repository = new CoroinhasRepository();
  }

  async execute() {
    return await this.repository.listar();
  }
}
