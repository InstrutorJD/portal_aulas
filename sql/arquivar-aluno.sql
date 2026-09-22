-- Arquivamento de aluno (Gestão → Alunos). Rode UMA vez no SQL Editor do
-- Supabase — é seguro rodar de novo (idempotente) e não mexe em nenhum
-- aluno já cadastrado. É o mesmo trecho que está logo depois do BLOCO 0
-- de sql/supabase-setup-completo.sql, pra quem já tem o banco montado e
-- não quer rodar o script completo de novo.
--
-- O que isso cria:
--   • profiles.archived_at — soft-delete, não apaga NADA. Um aluno
--     arquivado some das listas ativas do portal (Gestão, Chamada, Notas,
--     Ranking, relatórios — turmaStudents() passa a filtrar
--     "archived_at is null"), mas notas/chamada/progresso/placares já
--     lançados continuam no banco como histórico.
--   • arquivar_aluno(email) — bloqueia o login (auth.users.banned_until)
--     e derruba a sessão ativa (auth.sessions), além de marcar
--     archived_at. Só o professor pode chamar; só funciona em conta com
--     role='aluno' (nunca arquiva um professor).
--   • reativar_aluno(email) — desfaz tudo: devolve o aluno pra todo lugar
--     e destrava o login.
--
-- Sem rodar este script, o botão "Arquivar"/"Reativar" da aba Gestão
-- falha (a function não existe no seu banco ainda).

alter table public.profiles add column if not exists archived_at timestamptz;

create or replace function public.arquivar_aluno(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_role text;
begin
  if not public.is_professor() then
    raise exception 'Só o professor pode arquivar um aluno.';
  end if;

  select id, role into v_id, v_role from public.profiles where email = p_email;
  if v_id is null then
    return jsonb_build_object('success', false, 'message', 'Aluno não encontrado.');
  end if;
  if v_role <> 'aluno' then
    return jsonb_build_object('success', false, 'message', 'Só é possível arquivar uma conta de aluno.');
  end if;

  update public.profiles set archived_at = now() where id = v_id;
  update auth.users set banned_until = 'infinity' where id = v_id;
  delete from auth.sessions where user_id = v_id;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.reativar_aluno(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_professor() then
    raise exception 'Só o professor pode reativar um aluno.';
  end if;

  select id into v_id from public.profiles where email = p_email and role = 'aluno';
  if v_id is null then
    return jsonb_build_object('success', false, 'message', 'Aluno não encontrado.');
  end if;

  update public.profiles set archived_at = null where id = v_id;
  update auth.users set banned_until = null where id = v_id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.arquivar_aluno(text) to authenticated;
grant execute on function public.reativar_aluno(text) to authenticated;

-- Conferência (opcional): a coluna nova deve aparecer aqui.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles' and column_name = 'archived_at';
