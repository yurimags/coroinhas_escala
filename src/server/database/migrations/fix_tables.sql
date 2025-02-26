-- Primeiro, vamos mover os dados das tabelas em PascalCase para as tabelas em snake_case
INSERT IGNORE INTO periodos_escala (id, data_inicio, data_fim, nome, status, created_at, updated_at)
SELECT id, data_inicio, data_fim, nome, status, created_at, updated_at
FROM PeriodosEscala;

INSERT IGNORE INTO disponibilidades_periodo (id, periodo_id, coroinha_id, disponibilidade_dias, disponibilidade_locais, created_at)
SELECT id, periodo_id, coroinha_id, disponibilidade_dias, disponibilidade_locais, created_at
FROM DisponibilidadesPeriodo;

-- Agora podemos remover as tabelas em PascalCase com segurança
DROP TABLE IF EXISTS DisponibilidadesPeriodo;
DROP TABLE IF EXISTS PeriodosEscala; 