-- ============================================================
-- Tabela de atividade/presença dos alunos (painel do professor)
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

create table if not exists public.student_activity (
  id uuid primary key default gen_random_uuid(),

  -- identificação do aluno (mesma chave usada no login: USERS_JSON[].email)
  student_email text not null unique,
  student_name text,
  turma text,

  -- status calculado no cliente: 'active' | 'idle' | 'offline'
  status text not null default 'offline' check (status in ('active', 'idle', 'offline')),

  -- chave curta de localização (ex: 'js_basico', 'js_intermediario', 'csharp',
  -- 'jogos_hacker', 'jogos_digitacao', 'jogos_campo_minado', 'aulas', 'jogos', 'professor')
  location text not null default 'offline',

  -- texto amigável para exibir no painel (ex: "Duelo 3: Escudo Par/Ímpar")
  location_label text,

  -- dados extras estruturados (ex: {"challenge_id":3,"total":7,"progress":2})
  detail jsonb,

  -- último momento em que o aluno de fato interagiu (mouse/teclado/clique)
  last_interaction_at timestamptz not null default now(),

  -- último "heartbeat" enviado pelo cliente (usado para detectar quem ficou offline)
  updated_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- Acelera a checagem de "quem está com heartbeat desatualizado (offline)"
create index if not exists idx_student_activity_updated_at
  on public.student_activity (updated_at);

-- ============================================================
-- Row Level Security
-- Este app não usa Supabase Auth (login é feito na própria aplicação),
-- então liberamos leitura/escrita públicas via a chave publishable,
-- no mesmo padrão já usado pelas tabelas network_nodes / node_permissions.
-- ============================================================

alter table public.student_activity enable row level security;

create policy "student_activity_select_all"
  on public.student_activity for select
  using (true);

create policy "student_activity_insert_all"
  on public.student_activity for insert
  with check (true);

create policy "student_activity_update_all"
  on public.student_activity for update
  using (true)
  with check (true);

-- ============================================================
-- Realtime: permite o painel do professor assinar mudanças ao vivo
-- (mesmo padrão usado hoje para network_nodes / node_permissions / node_shields)
-- ============================================================

alter publication supabase_realtime add table public.student_activity;
