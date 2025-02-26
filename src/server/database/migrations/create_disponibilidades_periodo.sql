CREATE TABLE IF NOT EXISTS disponibilidades_periodo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  periodo_id INT NOT NULL,
  coroinha_id INT NOT NULL,
  disponibilidade_dias JSON NOT NULL,
  disponibilidade_locais JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (periodo_id) REFERENCES periodos_escala(id) ON DELETE CASCADE,
  FOREIGN KEY (coroinha_id) REFERENCES coroinhas(id) ON DELETE CASCADE
); 