-- "Ocultar Jogos" (Gestão → Bloqueios e Liberações) — esconde um jogo/
-- atividade específico da lista do aluno enquanto ainda está em
-- desenvolvimento, sem travar o resto da trilha. Rode UMA vez no SQL
-- Editor do Supabase — é seguro rodar de novo (idempotente). É o mesmo
-- trecho que está logo depois do bloco de trilha_bimestre em
-- sql/supabase-setup-completo.sql, pra quem já tem o banco montado e não
-- quer rodar o script completo de novo.
--
-- Diferente de trilha_bimestre (esconde a TRILHA inteira, por data), aqui
-- é por MÓDULO individual e sem data nenhuma — só um interruptor manual
-- (hidden = true/false) que o professor liga/desliga na Gestão. O
-- professor sempre vê e consegue abrir o módulo normalmente (só com um
-- selo "🚧 Oculto dos alunos"); só o aluno perde o card da lista. O módulo
-- oculto também não entra na conta de "completou tudo" que libera a aba
-- Jogos (ver shared/platform-core.js: isModuleHidden/buildModuleCardsHtml/
-- allModulesComplete).

create table if not exists public.hidden_modules (
  turma text not null,
  trilha_key text not null,
  module_key text not null,
  hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (turma, trilha_key, module_key)
);

create index if not exists idx_hidden_modules_turma on public.hidden_modules (turma);

alter table public.hidden_modules enable row level security;

drop policy if exists "hidden_modules_select_all" on public.hidden_modules;
create policy "hidden_modules_select_all"
  on public.hidden_modules for select
  using (true);

drop policy if exists "hidden_modules_insert_professor" on public.hidden_modules;
create policy "hidden_modules_insert_professor"
  on public.hidden_modules for insert
  with check (public.is_professor());

drop policy if exists "hidden_modules_update_professor" on public.hidden_modules;
create policy "hidden_modules_update_professor"
  on public.hidden_modules for update
  using (public.is_professor())
  with check (public.is_professor());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hidden_modules'
  ) then
    alter publication supabase_realtime add table public.hidden_modules;
  end if;
end $$;
