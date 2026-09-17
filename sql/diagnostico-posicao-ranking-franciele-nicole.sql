-- Diagnóstico pontual: aluna "Franciele" aparece na posição 21 do ranking
-- (badge 🏆 / aba Perfil), enquanto "Nicole" aparece em 1º — apesar de, pelo
-- relato do professor, terem as MESMAS atividades concluídas.
--
-- O ranking (computeRanking em shared/platform-core.js) calcula o % de cada
-- aluno somando o progresso de public.student_module_progress, casando pelo
-- student_email = profiles.email de quem está logado. Se a aluna tiver
-- progresso salvo sob um student_email DIFERENTE do email atual em
-- profiles (ex.: username trocado/corrigido, cadastro duplicado, ou o
-- progresso foi gravado antes de uma correção de usuário), o ranking
-- simplesmente não encontra essas linhas — ela aparece com % baixo mesmo
-- tendo feito tudo. Este script é só leitura, não altera nada.
--
-- COMO USAR: troque 'Franciele' e 'Nicole' abaixo pelos nomes reais (ou só
-- parte do nome) se a busca por ILIKE não achar ninguém.

-- 1) Localiza o(s) perfil(is) de cada uma — confira se aparece SÓ 1 linha
--    por aluna. Mais de 1 linha = cadastro duplicado (2 identidades
--    diferentes, progresso pode estar dividido entre as duas).
select id, email, nome, role, turma
from public.profiles
where nome ilike '%Franciele%' or nome ilike '%Nicole%'
order by nome;

-- 2) Progresso completo de cada uma.
select student_email, trilha_key, module_key, progress_current, progress_total, completed, updated_at
from public.student_module_progress
where student_email = 'franciele.alencar'
order by trilha_key, module_key;

select student_email, trilha_key, module_key, progress_current, progress_total, completed, updated_at
from public.student_module_progress
where student_email = 'nicole.santos21'
order by trilha_key, module_key;

-- 3) Comparação rápida: total de linhas e de concluídas de cada uma — se
--    o relato do professor está certo (mesmas atividades feitas), os 2
--    números de cada coluna devem ser parecidos entre as duas.
select student_email, count(*) as total_linhas, count(*) filter (where completed) as concluidas
from public.student_module_progress
where student_email in ('franciele.alencar', 'nicole.santos21')
group by student_email;

-- 4) A PARTE QUE MAIS IMPORTA — existe progresso da Franciele salvo sob
--    um username DIFERENTE do que está hoje em profiles? Troca 'Franciele'
--    pelo nome real. Isso aparece quando o aluno foi recadastrado (username
--    corrigido, conta duplicada) e o progresso antigo ficou "órfão" — não
--    aparece pra ninguém, porque nenhum profiles.email atual bate com ele.
select smp.student_email, count(*) as linhas, count(*) filter (where smp.completed) as concluidas
from public.student_module_progress smp
where smp.student_email not in (select email from public.profiles)
group by smp.student_email
order by linhas desc;

-- 5) Confirma a turma — se a Franciele estiver com turma diferente da
--    Nicole em profiles (ex.: 'jogos' vs 'sistemas', ou string diferente
--    do que turmas/*/config.js espera), o ranking dela é calculada numa
--    lista de colegas completamente diferente (ver turmaStudents() em
--    shared/platform-core.js) — o que também explicaria a diferença.
--    length(turma) e turma::bytea ajudam a pegar espaço em branco invisível
--    que uma coluna de texto simples não mostra.
select email, nome, turma, length(turma) as tam_turma, turma = 'sistemas' as bate_exato
from public.profiles where nome ilike '%Franciele%' or nome ilike '%Nicole%';

-- 6) Panorama da turma inteira — soma bruta de progress_current/progress_total
--    (aproximação do % real, sem o peso exato por módulo do config.js, mas
--    suficiente pra ver ONDE a Franciele cai entre TODOS os alunos de
--    'sistemas', não só comparada com a Nicole. Repare a POSIÇÃO dela nesta
--    lista (row_number) — se ela não aparecer perto do topo aqui também,
--    o problema é mesmo nos dados, não no front-end/cache.
select
  student_email,
  count(*) filter (where completed) as concluidos,
  round(100.0 * sum(least(progress_current::numeric / nullif(progress_total,0), 1)) / count(*), 1) as pct_aprox,
  row_number() over (order by sum(least(progress_current::numeric / nullif(progress_total,0), 1)) desc) as posicao_aprox
from public.student_module_progress smp
where turma = 'sistemas'
group by student_email
order by posicao_aprox
limit 30;
