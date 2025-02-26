-- Tabela de Períodos de Escala
CREATE TABLE IF NOT EXISTS PeriodosEscala (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    nome VARCHAR(50) NOT NULL,
    status ENUM('ativo', 'inativo', 'finalizado') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Disponibilidades Específicas por Período
CREATE TABLE IF NOT EXISTS DisponibilidadesPeriodo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    periodo_id INT NOT NULL,
    coroinha_id INT NOT NULL,
    disponibilidade_dias JSON,
    disponibilidade_locais JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (periodo_id) REFERENCES PeriodosEscala(id) ON DELETE CASCADE,
    FOREIGN KEY (coroinha_id) REFERENCES Coroinhas(id) ON DELETE CASCADE
);

-- Tabela de Histórico de Serviços
CREATE TABLE IF NOT EXISTS HistoricoServicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coroinha_id INT NOT NULL,
    periodo_id INT NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    local VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coroinha_id) REFERENCES Coroinhas(id) ON DELETE CASCADE,
    FOREIGN KEY (periodo_id) REFERENCES PeriodosEscala(id) ON DELETE CASCADE
);

-- Alteração na tabela Escalas para incluir período
ALTER TABLE Escalas 
ADD COLUMN periodo_id INT,
ADD FOREIGN KEY (periodo_id) REFERENCES PeriodosEscala(id) ON DELETE CASCADE; 