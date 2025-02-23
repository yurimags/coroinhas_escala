import React, { useEffect, useState } from 'react';
import { CoroinhasTable } from '@/components/servers/CoroinhasTable';
import { toast } from '@/components/ui/use-toast';

interface Coroinha {
  id: number;
  nome: string;
  acolito: boolean;
  sub_acolito: boolean;
  disponibilidade_dias: string[];
  disponibilidade_locais: string[];
}

export default function ServersPage() {
  const [coroinhas, setCoroinhas] = useState<Coroinha[]>([]);

  const fetchCoroinhas = async () => {
    try {
      const response = await fetch('/api/coroinhas?sort=nome');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }

      const data = await response.json();
      setCoroinhas(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCoroinhas();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <CoroinhasTable 
        coroinhas={coroinhas} 
        onUpdate={fetchCoroinhas} 
      />
    </div>
  );
} 