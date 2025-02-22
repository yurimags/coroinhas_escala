import React, { useState, useEffect } from 'react';
import { getConfiguracoes } from '../lib/config';

const LocalSelect = () => {
  const [locais, setLocais] = useState<string[]>([]);

  useEffect(() => {
    const carregarLocais = async () => {
      const config = await getConfiguracoes();
      setLocais(config.locais);
    };
    carregarLocais();
  }, []);

  return (
    <select className="form-select">
      {locais.map(local => (
        <option key={local} value={local}>{local}</option>
      ))}
    </select>
  );
}

export default LocalSelect; 