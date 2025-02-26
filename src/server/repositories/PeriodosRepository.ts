async obterCoroinhasDisponiveis(periodo_id: number, data: Date, local: string, dia: string): Promise<Coroinha[]> {
  const [rows] = await connection.query(
    `SELECT 
      c.id,
      c.nome,
      c.acolito,
      c.sub_acolito,
      c.disponibilidade_dias,
      c.disponibilidade_locais,
      COUNT(e.id) as total_servicos
    FROM Coroinhas c
    LEFT JOIN Escalas e ON e.coroinha_id = c.id AND e.periodo_id = ?
    WHERE 
      (c.disponibilidade_dias LIKE ? OR JSON_CONTAINS(c.disponibilidade_dias, ?)) AND
      (c.disponibilidade_locais LIKE ? OR JSON_CONTAINS(c.disponibilidade_locais, ?))
    GROUP BY c.id
    ORDER BY total_servicos ASC`,
    [periodo_id, `%${dia}%`, JSON.stringify(dia), `%${local}%`, JSON.stringify(local)]
  );

  return rows as Coroinha[];
} 