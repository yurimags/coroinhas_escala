-- Tabela de Períodos de Escala
CREATE TABLE IF NOT EXISTS periodos_escala (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    nome VARCHAR(50) NOT NULL,
    status ENUM('ativo', 'inativo', 'finalizado') DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Disponibilidades Específicas por Período
CREATE TABLE IF NOT EXISTS disponibilidades_periodo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    periodo_id INT NOT NULL,
    coroinha_id INT NOT NULL,
    disponibilidade_dias JSON,
    disponibilidade_locais JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (periodo_id) REFERENCES periodos_escala(id) ON DELETE CASCADE,
    FOREIGN KEY (coroinha_id) REFERENCES coroinhas(id) ON DELETE CASCADE
);

-- Tabela de Eventos do Período
CREATE TABLE IF NOT EXISTS eventos_periodo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    periodo_id INT NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    local VARCHAR(100) NOT NULL,
    numero_coroinhas INT NOT NULL DEFAULT 1,
    dia_semana VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (periodo_id) REFERENCES periodos_escala(id) ON DELETE CASCADE
);

-- Tabela de Histórico de Serviços
CREATE TABLE IF NOT EXISTS servicos_realizados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coroinha_id INT NOT NULL,
    periodo_id INT NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    local VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coroinha_id) REFERENCES coroinhas(id) ON DELETE CASCADE,
    FOREIGN KEY (periodo_id) REFERENCES periodos_escala(id) ON DELETE CASCADE
);

-- Alteração na tabela Escalas para incluir período
ALTER TABLE escalas 
ADD COLUMN IF NOT EXISTS periodo_id INT,
ADD FOREIGN KEY (periodo_id) REFERENCES periodos_escala(id) ON DELETE CASCADE;