import { Request, Response, NextFunction } from "express";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Por enquanto, apenas passa adiante sem verificação
  // TODO: Implementar autenticação real quando necessário
  next();
}; 