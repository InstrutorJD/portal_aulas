-- ============================================================
-- Usuário SUBSTITUTO — quem dá a aula quando o professor precisa se
-- ausentar. Rode UMA vez no SQL Editor do Supabase (idempotente — seguro
-- rodar de novo). Mesmo trecho do bloco "Substituto" de
-- sql/supabase-setup-completo.sql.
--
-- O que o substituto PODE FAZER:
--   - ligar/desligar "Copiar e Colar" e "Jogos" (classroom_settings,
--     student_overrides);
--   - fazer a chamada (attendance);
--   - gerar o token de visto / pular etapa (gerar_professor_token);
--   - conduzir QuizRush e Corrida do Bug como anfitrião (sessões).
-- O que ele só VÊ: alunos das turmas, progresso, notas, relatórios em tempo
-- real e alertas de saída de tela.
-- O que ele NÃO faz (continua só com is_professor()): notas, pesos,
-- bimestres, liberação por trilha, "Mostrar Notas", arquivar/reativar
-- aluno — nenhuma policy abaixo dá escrita nisso.
--
-- Na TELA, shared/session.js apresenta o substituto como professor (pra
-- aulas/jogos se comportarem igual) com a marca `substituto: true`, e a
-- aba Gestão esconde o que ele não usa. Mas a segurança de verdade é AQUI:
-- o papel no banco continua 'substituto', e is_professor() continua falso
-- pra ele.
-- ============================================================

-- 1) Papel novo em profiles.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('aluno', 'professor', 'substituto'));

-- 2) Quem é substituto (mesmo padrão de is_professor(): security definer
--    pra poder ler profiles de dentro de uma policy sem recursão de RLS).
create or replace function public.is_substituto()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'substituto');
$$;
grant execute on function public.is_substituto() to authenticated;

-- 3) Leitura (policies ADICIONAIS — somam com as que já existem, nenhuma
--    policy do professor é alterada).
drop policy if exists "profiles_select_substituto" on public.profiles;
create policy "profiles_select_substituto" on public.profiles
  for select using (public.is_substituto());

drop policy if exists "student_activity_select_substituto" on public.student_activity;
create policy "student_activity_select_substituto" on public.student_activity
  for select using (public.is_substituto());

drop policy if exists "student_overrides_select_substituto" on public.student_overrides;
create policy "student_overrides_select_substituto" on public.student_overrides
  for select using (public.is_substituto());

drop policy if exists "attendance_select_substituto" on public.attendance;
create policy "attendance_select_substituto" on public.attendance
  for select using (public.is_substituto());

drop policy if exists "grades_select_substituto" on public.grades;
create policy "grades_select_substituto" on public.grades
  for select using (public.is_substituto());

drop policy if exists "student_module_progress_select_substituto" on public.student_module_progress;
create policy "student_module_progress_select_substituto" on public.student_module_progress
  for select using (public.is_substituto());

drop policy if exists "student_activity_state_select_substituto" on public.student_activity_state;
create policy "student_activity_state_select_substituto" on public.student_activity_state
  for select using (public.is_substituto());

drop policy if exists "exam_guard_events_select_substituto" on public.exam_guard_events;
create policy "exam_guard_events_select_substituto" on public.exam_guard_events
  for select using (public.is_substituto());

-- 4) Escrita — SÓ o que o substituto pode fazer.
-- "Copiar e Colar" (Gestão → Bloqueios e Liberações).
drop policy if exists "classroom_settings_insert_substituto" on public.classroom_settings;
create policy "classroom_settings_insert_substituto" on public.classroom_settings
  for insert with check (public.is_substituto());
drop policy if exists "classroom_settings_update_substituto" on public.classroom_settings;
create policy "classroom_settings_update_substituto" on public.classroom_settings
  for update using (public.is_substituto()) with check (public.is_substituto());

-- "Jogos" (liberação dos jogos pra turma).
drop policy if exists "student_overrides_insert_substituto" on public.student_overrides;
create policy "student_overrides_insert_substituto" on public.student_overrides
  for insert with check (public.is_substituto());
drop policy if exists "student_overrides_update_substituto" on public.student_overrides;
create policy "student_overrides_update_substituto" on public.student_overrides
  for update using (public.is_substituto()) with check (public.is_substituto());

-- Chamada.
drop policy if exists "attendance_insert_substituto" on public.attendance;
create policy "attendance_insert_substituto" on public.attendance
  for insert with check (public.is_substituto());
drop policy if exists "attendance_update_substituto" on public.attendance;
create policy "attendance_update_substituto" on public.attendance
  for update using (public.is_substituto()) with check (public.is_substituto());

-- QuizRush e Corrida do Bug como anfitrião (conduzir a aula).
drop policy if exists "quizrush_sessions_insert_substituto" on public.quizrush_sessions;
create policy "quizrush_sessions_insert_substituto" on public.quizrush_sessions
  for insert with check (public.is_substituto());
drop policy if exists "quizrush_sessions_update_substituto" on public.quizrush_sessions;
create policy "quizrush_sessions_update_substituto" on public.quizrush_sessions
  for update using (public.is_substituto()) with check (public.is_substituto());
drop policy if exists "corridadobug_sessions_insert_substituto" on public.corridadobug_sessions;
create policy "corridadobug_sessions_insert_substituto" on public.corridadobug_sessions
  for insert with check (public.is_substituto());
drop policy if exists "corridadobug_sessions_update_substituto" on public.corridadobug_sessions;
create policy "corridadobug_sessions_update_substituto" on public.corridadobug_sessions
  for update using (public.is_substituto()) with check (public.is_substituto());

-- 5) Token de visto / pular etapa: professor OU substituto. O visto mostra
--    o nome de quem gerou o token ("Visto dado por ..."). Só existe um
--    token válido por vez — gerar um novo invalida o anterior, de quem for.
create or replace function public.gerar_professor_token()
returns table(token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_expires timestamptz;
begin
  if not (public.is_professor() or public.is_substituto()) then
    raise exception 'Só o professor (ou o substituto) pode gerar um token.';
  end if;

  delete from public.professor_tokens where public.professor_tokens.expires_at > now();

  v_token := lpad(floor(random() * 1000000)::int::text, 6, '0');
  v_expires := now() + interval '10 minutes';

  insert into public.professor_tokens (token, expires_at, created_by)
  values (v_token, v_expires, auth.uid());

  return query select v_token, v_expires;
end;
$$;

create or replace function public.professor_token_atual()
returns table(token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_professor() or public.is_substituto()) then
    raise exception 'Só o professor (ou o substituto) pode ver o token atual.';
  end if;

  return query
    select pt.token, pt.expires_at
    from public.professor_tokens pt
    where pt.expires_at > now()
    order by pt.created_at desc
    limit 1;
end;
$$;

-- ============================================================
-- 6) CRIAR A CONTA DO SUBSTITUTO (uma vez por pessoa)
--
--  a) No painel do Supabase: Authentication → Users → Add user →
--     Create new user:
--       Email:    <usuario>@aluno.portal.local   (ex.: substituto@aluno.portal.local)
--       Password: a senha que ele vai usar
--       [x] Auto Confirm User
--     (O login do portal pede só o <usuario> — o "@aluno.portal.local" é
--     interno, igual ao de todo mundo.)
--
--  b) Depois, troque os dois valores abaixo (usuário e nome) e rode:
-- ============================================================
insert into public.profiles (id, email, nome, role, turma)
select u.id, 'substituto', 'Professor Substituto', 'substituto', 'all'
from auth.users u
where u.email = 'substituto@aluno.portal.local'
on conflict (id) do update
  set role = 'substituto', nome = excluded.nome, email = excluded.email, turma = 'all';
