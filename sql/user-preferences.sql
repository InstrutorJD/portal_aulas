-- Personalização do portal (fonte, cor de destaque, tema claro/escuro,
-- emoji de avatar, fundo decorativo, cursor do mouse). Rode UMA vez no SQL
-- Editor do Supabase — é seguro rodar de novo (idempotente). É o mesmo
-- trecho que está logo depois do BLOCO 15 de sql/supabase-setup-completo.sql,
-- pra quem já tem o banco montado e não quer rodar o script completo de novo.
--
-- O que isso cria:
--   • user_preferences — uma linha por email (aluno OU professor) com as
--     preferências visuais escolhidas na modal "🎨 Personalizar" (botão de
--     perfil do portal). Self-service via RLS (cada um só lê/escreve a
--     própria linha por email = current_email()) — sem RPC, mesmo padrão
--     de student_activity_state (sincronização de progresso).

create table if not exists public.user_preferences (
  email text primary key,
  font_family text not null default 'pixel'
    check (font_family in ('pixel', 'traditional', 'rounded', 'serif')),
  accent_key text not null default 'padrao',
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  avatar_emoji text not null default '👤',
  bg_pattern boolean not null default false,
  cursor_key text not null default 'default',
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_select_self" on public.user_preferences;
drop policy if exists "user_preferences_select_self_or_professor" on public.user_preferences;
create policy "user_preferences_select_self_or_professor"
  on public.user_preferences for select
  using (public.is_professor() or email = public.current_email());

drop policy if exists "user_preferences_insert_self" on public.user_preferences;
create policy "user_preferences_insert_self"
  on public.user_preferences for insert
  with check (email = public.current_email());

drop policy if exists "user_preferences_update_self" on public.user_preferences;
create policy "user_preferences_update_self"
  on public.user_preferences for update
  using (email = public.current_email())
  with check (email = public.current_email());
