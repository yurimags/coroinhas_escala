import React, { useState, useEffect } from 'react';
import { CronogramaSemanal } from '../types/CronogramaSemanal';
import { prisma } from '../lib/prisma';

const useCronograma = (semanaId: number) => {
  const [cronograma, setCronograma] = useState<CronogramaSemanal[]>([]);

  useEffect(() => {
    const carregarCronograma = async () => {
      const dados = await prisma.cronograma_semanal.findMany({
        where: { semana_id: semanaId },
        include: {
          escalas: {
            include: {
              coroinha: true
            }
          }
        }
      });
      setCronograma(dados);
    };
    carregarCronograma();
  }, [semanaId]);

  return cronograma;
};

export default useCronograma; 