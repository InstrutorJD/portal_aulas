-- Quizz Prático do QuizRush (problemas de código no lugar de múltipla escolha).
-- Rode UMA vez no SQL Editor do Supabase — é seguro rodar de novo (idempotente)
-- e não mexe em nenhuma partida nem resposta já existente. É o mesmo trecho que
-- está no BLOCO 11 de sql/supabase-setup-completo.sql, pra quem já tem o banco
-- montado e não quer rodar o script completo.
--
-- O que muda:
--   attempts    quantas vezes o aluno enviou código naquele problema
--   answer_text o último código enviado (o professor pode conferir depois)
-- As respostas de código usam choice_index = 0 (a coluna continua obrigatória
-- por causa do quiz de múltipla escolha; pra código o valor é ignorado).
--
-- Sem rodar este script o Quizz Prático ainda funciona (a pontuação é gravada
-- do mesmo jeito), só não guarda as tentativas nem o código enviado — e o
-- console do navegador avisa isso.
alter table public.quizrush_answers add column if not exists attempts int not null default 1;
alter table public.quizrush_answers add column if not exists answer_text text;

-- Conferência (opcional): as duas colunas novas devem aparecer aqui.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'quizrush_answers'
  and column_name in ('attempts', 'answer_text');
