-- Ativa Realtime na tabela grades — quando o professor clica em "Salvar"
-- em Lançar Notas (Gestão), o aluno que estiver com a aba Perfil aberta na
-- hora vê a "NOTA" de cada matéria atualizar sozinha, sem precisar
-- recarregar a página (ver shared/platform-core.js: watchGrades/
-- renderPerfilTab). Rode UMA vez no SQL Editor do Supabase — é seguro
-- rodar de novo (idempotente). É o mesmo trecho que está logo depois das
-- políticas de public.grades em sql/supabase-setup-completo.sql, pra quem
-- já tem o banco montado e não quer rodar o script completo de novo.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'grades'
  ) then
    alter publication supabase_realtime add table public.grades;
  end if;
end $$;
