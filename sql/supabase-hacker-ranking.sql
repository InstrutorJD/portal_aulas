-- ============================================================
-- GitHack OS (jogo Hacker): ranking de "hacker com mais ataques"
-- (games/jogo.html, comando `ranking`), reaproveitando o placar
-- genérico já usado em Campo Minado/Digitação (shared/game-
-- leaderboard.js, tabela game_scores, já criada em
-- sql/supabase-setup-completo.sql).
--
-- Execute este script no SQL Editor do Supabase (depois de
-- sql/supabase-setup-completo.sql, ou de sql/supabase-hacker-game.sql
-- num projeto já existente, já terem sido executados).
-- ============================================================

alter table public.network_nodes add column if not exists attack_count int not null default 0;

-- execute_hack_transfer ganha o incremento do contador de ataques
-- bem-sucedidos do atacante e devolve o total atualizado, pro cliente
-- gravar no placar (game='hacker'). Só conta ataque que realmente rouba
-- JDCoin — tentativa bloqueada por antivírus/carteira criptografada não
-- soma. Mantém a checagem de isolamento por turma da versão final desta
-- função (sql/supabase-setup-completo.sql, Bloco 5).
create or replace function public.execute_hack_transfer(attacker_ip text, target_ip text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_balance        numeric;
  v_attacker_balance      numeric;
  v_target_online         boolean;
  v_target_shielded       boolean;
  v_target_turma          text;
  v_attacker_turma        text;
  v_stolen                numeric;
  v_first_ip              text;
  v_second_ip             text;
  v_attacker_attack_count int;
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

  select jdcoin_balance, is_online, turma into v_target_balance, v_target_online, v_target_turma
  from network_nodes where ip_address = target_ip;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Nó de destino não encontrado.');
  end if;

  select jdcoin_balance, turma into v_attacker_balance, v_attacker_turma
  from network_nodes where ip_address = attacker_ip;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Nó do atacante não encontrado.');
  end if;

  if v_attacker_turma is distinct from v_target_turma then
    return jsonb_build_object('success', false, 'message', 'Falha no ataque: nó fora da sua turma.');
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

  if exists (
    select 1 from node_wallet_locks
    where ip_address = target_ip and expires_at > now()
  ) then
    return jsonb_build_object('success', false, 'message', 'Falha no ataque: A carteira do alvo está criptografada. Quebre a senha primeiro (hack crack).');
  end if;

  v_stolen := round(v_target_balance * 0.5, 2);

  update network_nodes set jdcoin_balance = jdcoin_balance - v_stolen where ip_address = target_ip;
  update network_nodes set jdcoin_balance = jdcoin_balance + v_stolen, attack_count = attack_count + 1
    where ip_address = attacker_ip
    returning attack_count into v_attacker_attack_count;

  return jsonb_build_object(
    'success', true,
    'message', 'Transferência concluída.',
    'target_balance', v_target_balance - v_stolen,
    'attacker_balance', v_attacker_balance + v_stolen,
    'stolen', v_stolen,
    'attacker_attack_count', v_attacker_attack_count
  );
end;
$$;

grant execute on function public.execute_hack_transfer(text, text) to anon, authenticated;
