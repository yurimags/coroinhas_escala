import * as XLSX from "xlsx";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CoroinhaPlanilha {
  Nome: string;
  'Acólito': string;
  'Sub-Acólito': string;
  Segunda: string;
  Terça: string;
  Quarta: string;
  Quinta: string;
  Sexta: string;
  Sábado: string;
  Domingo: string;
  Paróquia: string;
  RainhaDaPaz: string;
  CristoRei: string;
  BomPastor: string;
  Escala: number;
}

function converterSimNaoParaBoolean(valor: string): boolean {
  return valor.toLowerCase() === 'sim';
}

function getDiasDisponiveis(coroinha: CoroinhaPlanilha): string[] {
  const dias = [];
  if (converterSimNaoParaBoolean(coroinha.Segunda)) dias.push('Segunda');
  if (converterSimNaoParaBoolean(coroinha.Terça)) dias.push('Terça');
  if (converterSimNaoParaBoolean(coroinha.Quarta)) dias.push('Quarta');
  if (converterSimNaoParaBoolean(coroinha.Quinta)) dias.push('Quinta');
  if (converterSimNaoParaBoolean(coroinha.Sexta)) dias.push('Sexta');
  if (converterSimNaoParaBoolean(coroinha.Sábado)) dias.push('Sábado');
  if (converterSimNaoParaBoolean(coroinha.Domingo)) dias.push('Domingo');
  return dias;
}

function getLocaisDisponiveis(coroinha: CoroinhaPlanilha): string[] {
  const locais = [];
  if (converterSimNaoParaBoolean(coroinha.Paróquia)) locais.push('Paróquia');
  if (converterSimNaoParaBoolean(coroinha.RainhaDaPaz)) locais.push('Rainha da Paz');
  if (converterSimNaoParaBoolean(coroinha.CristoRei)) locais.push('Cristo Rei');
  if (converterSimNaoParaBoolean(coroinha.BomPastor)) locais.push('Bom Pastor');
  return locais;
}

export async function importarExcel(file: File) {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    for (const row of jsonData) {
      const coroinha = {
        nome: row['Nome'],
        acolito: converterSimNaoParaBoolean(row['Acólito'] || 'não'),
        sub_acolito: converterSimNaoParaBoolean(row['Sub-Acólito'] || 'não'),
        disponibilidade_dias: JSON.stringify(
          (row['Disponibilidade'] || '').split(',').map((d: string) => d.trim())
        ),
        disponibilidade_locais: JSON.stringify(
          (row['Locais'] || '').split(',').map((l: string) => l.trim())
        ),
        escala: 0
      };

      await prisma.coroinhas.create({
        data: coroinha
      });
    }

    return { success: true, message: 'Dados importados com sucesso!' };
  } catch (error) {
    console.error('Erro ao importar Excel:', error);
    return { 
      success: false, 
      message: 'Erro ao importar dados do Excel',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
} 