-- ============================================================
-- GitHack OS (jogo Hacker): correções e IP de sessão rotativo.
-- Execute este script no SQL Editor do Supabase.
-- Pressupõe que as tabelas network_nodes, node_permissions e
-- node_shields já existem (criadas anteriormente no painel).
-- ============================================================

-- ------------------------------------------------------------
-- 1) execute_hack_transfer: agora valida no servidor (não só no
--    cliente) que o alvo está online e sem antivírus ativo antes
--    de mover saldo. Trava as duas linhas sempre na mesma ordem
--    (por ip_address) para evitar deadlock quando dois hacks
--    acontecem ao mesmo tempo em direções opostas.
-- ------------------------------------------------------------

create or replace function public.execute_hack_transfer(attacker_ip text, target_ip text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_balance   numeric;
  v_attacker_balance numeric;
  v_target_online    boolean;
  v_target_shielded  boolean;
  v_stolen           numeric;
  v_first_ip         text;
  v_second_ip        text;
begin
  if attacker_ip = target_ip then
    return jsonb_build_object('success', false, 'message', 'Não é possível atacar o próprio nó.');
  end if;

  if attacker_ip < target_ip then
    v_first_ip := attacker_ip; v_second_ip := target_ip;
  else
    v_first_ip := target_ip; v_second_ip := attacker_ip;
  end if;

  perform 1 from network_nodes where ip_address = v_first_ip for update;
  perform 1 from network_nodes where ip_address = v_second_ip for update;

  select jdcoin_balance, is_online into v_target_balance, v_target_online
  from network_nodes where ip_address = target_ip;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Nó de destino não encontrado.');
  end if;

  if v_target_online is distinct from true then
    return jsonb_build_object('success', false, 'message', 'Host offline. IP inalcançável na rede.');
  end if;

  select exists (
    select 1 from node_shields
    where ip_address = target_ip
      and is_shielded = true
      and (expires_at is null or expires_at > now())
  ) into v_target_shielded;

  if v_target_shielded then
    return jsonb_build_object('success', false, 'message', 'Falha no ataque: O nó de destino ativou o Antivírus.');
  end if;

  select jdcoin_balance into v_attacker_balance
  from network_nodes where ip_address = attacker_ip;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Nó do atacante não encontrado.');
  end if;

  v_stolen := round(v_target_balance * 0.5, 2);

  update network_nodes set jdcoin_balance = jdcoin_balance - v_stolen where ip_address = target_ip;
  update network_nodes set jdcoin_balance = jdcoin_balance + v_stolen where ip_address = attacker_ip;

  return jsonb_build_object(
    'success', true,
    'message', 'Transferência concluída.',
    'target_balance', v_target_balance - v_stolen,
    'attacker_balance', v_attacker_balance + v_stolen,
    'stolen', v_stolen
  );
end;
$$;

grant execute on function public.execute_hack_transfer(text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 2) IP de sessão rotativo: adiciona uma coluna separada da
--    identidade (ip_address, PK), então carteira, pastas e
--    blindagem não precisam mudar de chave. A cada "ip connect"
--    o aluno recebe um endereço sorteado da faixa 192.168.1.100-
--    199 (fora da faixa de identidade .10-.26/.254), liberado de
--    volta ao pool no "ip disconnect".
-- ------------------------------------------------------------

alter table public.network_nodes add column if not exists current_ip text;

-- Garante que dois alunos online nunca fiquem com o mesmo endereço ao mesmo tempo.
create unique index if not exists network_nodes_current_ip_unique
  on public.network_nodes (current_ip)
  where current_ip is not null;

create or replace function public.assign_session_ip(p_ip_address text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate text;
  v_attempt   int := 0;
begin
  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 50 then
      raise exception 'Não há endereços de rede livres no momento.';
    end if;

    v_candidate := '192.168.1.' || (100 + floor(random() * 100)::int);

    begin
      update network_nodes
      set current_ip = v_candidate, is_online = true
      where ip_address = p_ip_address;

      if not found then
        raise exception 'Nó % não encontrado.', p_ip_address;
      end if;

      return v_candidate;
    exception when unique_violation then
      continue;
    end;
  end loop;
end;
$$;

create or replace function public.release_session_ip(p_ip_address text)
returns void
language sql
security definer
set search_path = public
as $$
  update network_nodes set current_ip = null, is_online = false where ip_address = p_ip_address;
$$;

grant execute on function public.assign_session_ip(text) to anon, authenticated;
grant execute on function public.release_session_ip(text) to anon, authenticated;
