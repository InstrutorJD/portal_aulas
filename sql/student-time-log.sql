-- Histórico de tempo no portal (Gestão → Relatórios → "Relatório por Aluno").
--
-- Até aqui o portal só sabia o tempo logado de HOJE (student_activity.
-- active_seconds_today, zera todo dia). Esta tabela guarda o tempo por
-- aluno, por DIA e por LOCAL (a atividade/tela em que ele estava, o mesmo
-- `location` do heartbeat — dentro de uma atividade é o ACTIVITY_LOCATION
-- dela, ex. 'bd_nosql_teoria'), pra dar o tempo dos últimos 15 dias e o
-- tempo gasto em cada atividade comparado com a turma.
--
-- Nenhuma gravação nova no navegador: quem preenche é um gatilho no banco,
-- em cima do heartbeat de 15 em 15s que shared/activity-tracker.js já manda
-- pra student_activity. A cada heartbeat, soma o intervalo desde o anterior
-- (só intervalos de até 60s, mesma regra do active_seconds_today) no local
-- em que o aluno estava — e só se ele estava ATIVO (aba visível e mexeu no
-- mouse/teclado nos últimos 2 minutos). Aba escondida ou aluno parado não
-- conta. O dia é o de Brasília (America/Sao_Paulo), não o UTC do servidor.
--
-- Sem histórico retroativo: os números começam a existir quando este
-- script é rodado.
--
-- Idempotente: pode rodar mais de uma vez. Já incluído em
-- sql/supabase-setup-completo.sql (BLOCO 2b).

create table if not exists public.student_time_log (
  student_email text not null,
  turma text,
  dia date not null,
  location text not null,
  seconds int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_email, dia, location)
);

create index if not exists idx_student_time_log_turma_dia
  on public.student_time_log (turma, dia);

alter table public.student_time_log enable row level security;

-- Aluno lê só o próprio; professor lê tudo. Ninguém grava pelo navegador:
-- o gatilho abaixo é security definer, então nem o aluno consegue inflar
-- o próprio tempo escrevendo direto na tabela.
drop policy if exists "student_time_log_select_self_or_professor" on public.student_time_log;
create policy "student_time_log_select_self_or_professor"
  on public.student_time_log for select
  using (public.is_professor() or student_email = public.current_email());

create or replace function public.log_student_time()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gap numeric;
begin
  -- new.updated_at já é o now() do banco (trg_student_activity_daily_seconds
  -- roda antes e sobrescreve o relógio do cliente).
  v_gap := extract(epoch from (new.updated_at - old.updated_at));
  if v_gap > 0 and v_gap <= 60 and old.status = 'active' then
    begin
      insert into public.student_time_log as l (student_email, turma, dia, location, seconds, updated_at)
      values (
        old.student_email,
        coalesce(new.turma, old.turma),
        (now() at time zone 'America/Sao_Paulo')::date,
        coalesce(nullif(old.location, ''), 'desconhecido'),
        round(v_gap)::int,
        now()
      )
      on conflict (student_email, dia, location)
      do update set seconds = l.seconds + excluded.seconds,
                    turma = coalesce(excluded.turma, l.turma),
                    updated_at = now();
    exception when others then
      -- Best-effort: o histórico nunca pode derrubar o heartbeat.
      null;
    end;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_student_activity_time_log on public.student_activity;
create trigger trg_student_activity_time_log
after update on public.student_activity
for each row execute function public.log_student_time();
