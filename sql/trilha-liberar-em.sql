-- "Liberar em" (Gestão → Bloqueios e Liberações → Liberação por Trilha):
-- data opcional, dentro do bimestre da trilha, a partir da qual ela
-- aparece pro aluno. Antes dessa data a trilha fica escondida do aluno
-- (o professor continua vendo), mesmo com o bimestre já em andamento —
-- evita aluno fazer atividade adiantado dos colegas.
-- null = libera junto com o início do bimestre (comportamento de antes).
--
-- Idempotente: pode rodar mais de uma vez. Já incluído em
-- sql/supabase-setup-completo.sql.

alter table public.trilha_bimestre add column if not exists liberar_em date;
