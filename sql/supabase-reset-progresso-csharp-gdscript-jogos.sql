-- ============================================================
-- RESET DE PROGRESSO ÓRFÃO — trilhas "C#" e "GDScript" (versões
-- ANTIGAS) — turma Jogos Digitais.
--
-- ATUALIZADO: as duas trilhas foram RECONSTRUÍDAS do zero (ver
-- PENDENCIAS.md, "Trilha C# reconstruída" e "Trilha GDScript
-- reconstruída") com módulos NOVOS — 'teoria', 'comparacao',
-- 'pratica-simples' e 'desafios' — diferentes dos antigos
-- 'basico'/'pratica'. Por isso este script filtra por module_key nas
-- DUAS trilhas: só apaga as linhas órfãs da versão ANTIGA (module_key
-- 'basico'/'pratica'), nunca o progresso de verdade das trilhas atuais.
--
-- ⚠️ Se você já rodou uma versão anterior deste script (que apagava
-- 'gdscript' inteira, sem filtro de module_key): essa versão antiga
-- só existia enquanto 'gdscript' estava sem conteúdo nenhum no portal.
-- Agora que a trilha tem conteúdo de novo, NÃO rode aquela versão —
-- ela apagaria progresso de verdade dos alunos na trilha atual.
--
-- MOTIVO: a trilha 'csharp' antiga e a trilha 'gdscript' antiga (e os
-- arquivos de atividade por trás delas, atividades/csharp-basico.html,
-- atividades/csharp-pratica.html, atividades/gdscript-basico.html,
-- atividades/gdscript-pratica.html) foram apagadas do portal a pedido
-- do professor, antes de cada uma ser reconstruída do zero com um
-- formato novo. Progresso salvo de um módulo que não existe mais é só
-- lixo no banco — não corresponde a nenhum módulo que o portal ainda
-- consiga mostrar.
--
-- O QUE É ZERADO:
--   • student_module_progress — linhas de turma='jogos' onde:
--       - trilha_key = 'csharp' E module_key IN ('basico', 'pratica'), OU
--       - trilha_key = 'gdscript' E module_key IN ('basico', 'pratica')
--     (só os módulos das versões ANTIGAS de cada trilha — não toca em
--     'teoria', 'comparacao', 'pratica-simples' nem 'desafios', que são
--     os módulos atuais das duas).
--
-- O QUE NÃO É TOCADO:
--   • Progresso de verdade das trilhas 'csharp' e 'gdscript' atuais
--     (module_key 'teoria', 'comparacao', 'pratica-simples' ou 'desafios').
--   • Qualquer outra trilha/matéria (JS, Cobrinha, fundamentos gerais,
--     testes de jogos, etc.), jogos, chamada, notas, liberação de jogos,
--     turma Sistemas.
--
-- ⚠️ ATENÇÃO — LEIA ANTES DE RODAR:
--   1) Isso é IRREVERSÍVEL. Não existe "desfazer" depois de rodar.
--   2) O progresso do aluno mora em DOIS lugares: aqui no Supabase (só
--      uma cópia sincronizada, usada pros relatórios) E no localStorage
--      do NAVEGADOR de cada aluno (é essa cópia local que decide o que
--      aparece "concluído" na tela dele). O portal não lê mais as chaves
--      de localStorage antigas (`csharp_basico_progress_*`,
--      `csharp_pratica_progress_*`, `gdscript_basico_progress_*`,
--      `gdscript_pratica_progress_*`) nem as reenvia pro Supabase —
--      então rodar só o DELETE abaixo já é suficiente, sem depender de
--      o aluno limpar nada no navegador dele. O passo 2 (limpar
--      localStorage) é só uma limpeza de hygiene, opcional.
--   3) Rode a consulta de PRÉVIA primeiro, confira quem vai ser
--      afetado, e só depois descomente e rode o DELETE.
-- ============================================================

-- PRÉVIA — rode isto primeiro e confira a lista antes de apagar:
select student_email, trilha_key, module_key, progress_current, progress_total, completed, updated_at
from public.student_module_progress
where turma = 'jogos'
  and (
    (trilha_key = 'csharp' and module_key in ('basico', 'pratica'))
    or (trilha_key = 'gdscript' and module_key in ('basico', 'pratica'))
  )
order by trilha_key, student_email, module_key;

-- RESET — descomente as linhas abaixo e rode depois de conferir a prévia:
-- delete from public.student_module_progress
-- where turma = 'jogos'
--   and (
--     (trilha_key = 'csharp' and module_key in ('basico', 'pratica'))
--     or (trilha_key = 'gdscript' and module_key in ('basico', 'pratica'))
--   );

-- ============================================================
-- PASSO 2 (opcional, hygiene) — limpar o progresso local
-- Cada aluno cola isto no console do navegador (F12 → Console),
-- estando no portal (qualquer página do domínio, logado), e aperta
-- Enter. Detecta o próprio usuário pela URL e apaga só as chaves órfãs
-- das versões antigas de C# e GDScript — NÃO mexe nas chaves das
-- trilhas atuais (csharp_teoria_progress_*, csharp_comparacao_progress_*,
-- csharp_pratica_simples_progress_*, csharp_desafios_progress_*,
-- gdscript_teoria_progress_*, gdscript_comparacao_progress_*,
-- gdscript_pratica_simples_progress_*, gdscript_desafios_progress_*)
-- nem em mais nada do aluno. Não é obrigatório (o portal já não lê mais
-- essas chaves antigas, ver aviso acima), mas evita deixar lixo
-- acumulado no localStorage.
-- ============================================================
--
-- (() => {
--   const u = new URLSearchParams(location.search).get('user');
--   if (!u) { console.log('Não achei o parâmetro ?user= na URL atual.'); return; }
--   localStorage.removeItem(`csharp_basico_progress_${u}`);
--   localStorage.removeItem(`csharp_pratica_progress_${u}`);
--   localStorage.removeItem(`gdscript_basico_progress_${u}`);
--   localStorage.removeItem(`gdscript_pratica_progress_${u}`);
--   console.log('Progresso órfão (C# e GDScript antigos) limpo pra', u);
-- })();
