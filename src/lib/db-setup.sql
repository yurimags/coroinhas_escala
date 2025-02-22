-- Criar tabela de coroinhas
CREATE TABLE IF NOT EXISTS coroinhas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    comunidade VARCHAR(50) NOT NULL,
    disponibilidade_dias JSONB DEFAULT '[]',
    disponibilidade_locais JSONB DEFAULT '[]',
    sub_acolito BOOLEAN DEFAULT FALSE,
    acolito BOOLEAN DEFAULT FALSE,
    escala INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de cronograma semanal
CREATE TABLE IF NOT EXISTS cronograma_semanal (
    id SERIAL PRIMARY KEY,
    semana_id INTEGER,
    data DATE NOT NULL,
    dia_semana VARCHAR(20) NOT NULL,
    horario TIME NOT NULL,
    local VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de escalas
CREATE TABLE IF NOT EXISTS escalas (
    id SERIAL PRIMARY KEY,
    coroinha_id INTEGER REFERENCES coroinhas(id),
    cronograma_id INTEGER REFERENCES cronograma_semanal(id),
    data DATE NOT NULL,
    funcao VARCHAR(30) NOT NULL,
    contador_escala INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (coroinha_id) REFERENCES coroinhas(id),
    FOREIGN KEY (cronograma_id) REFERENCES cronograma_semanal(id)
);

-- Criar tabela de histórico
CREATE TABLE IF NOT EXISTS historico_escalacoes (
    id SERIAL PRIMARY KEY,
    coroinha_id INTEGER REFERENCES coroinhas(id),
    semana_id INTEGER,
    data DATE NOT NULL,
    local VARCHAR(50) NOT NULL,
    horario TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (coroinha_id) REFERENCES coroinhas(id)
);

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    max_escalas_dia INTEGER DEFAULT 2,
    requer_funcao_match BOOLEAN DEFAULT TRUE,
    locais JSONB DEFAULT '["Igreja Matriz", "Capela"]',
    horarios JSONB DEFAULT '["07:00", "09:00", "18:00", "19:30"]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para criar tabela semanal
CREATE OR REPLACE FUNCTION criar_tabela_semanal(
    nome_tabela text,
    data_inicio date,
    data_fim date,
    dados_default jsonb
) RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id serial primary key,
            coroinha_id integer references coroinhas(id),
            nome varchar(100) not null,
            disponibilidade_dias jsonb,
            disponibilidade_locais jsonb,
            sub_acolito boolean default false,
            acolito boolean default false,
            escala integer default 0,
            created_at timestamp with time zone default now()
        )', nome_tabela);
        
    EXECUTE format('
        INSERT INTO %I (coroinha_id, nome, disponibilidade_dias, disponibilidade_locais, sub_acolito, acolito, escala)
        SELECT id, nome, disponibilidade_dias, disponibilidade_locais, sub_acolito, acolito, escala
        FROM coroinhas', nome_tabela);
END;
$$ LANGUAGE plpgsql;

-- Inserir dados iniciais de coroinhas
INSERT INTO coroinhas (nome, comunidade, disponibilidade_dias, disponibilidade_locais, sub_acolito, acolito)
VALUES 
    ('João Silva', 'Matriz', '["domingo", "sábado"]', '["Igreja Matriz"]', true, false),
    ('Maria Santos', 'Capela', '["domingo", "quarta"]', '["Capela"]', false, true),
    ('Pedro Oliveira', 'Matriz', '["domingo", "sábado"]', '["Igreja Matriz", "Capela"]', true, true)
ON CONFLICT DO NOTHING;

-- Inserir configurações iniciais
INSERT INTO configuracoes (max_escalas_dia, requer_funcao_match, locais, horarios)
VALUES (2, true, '["Igreja Matriz", "Capela"]', '["07:00", "09:00", "18:00", "19:30"]')
ON CONFLICT DO NOTHING;
