# Como trabalhamos neste repositório

## ⚠️ Trilha nova? Leia `docs/padrao-trilhas.md` ANTES de tudo

Toda trilha criada daqui pra frente (Jogos e Sistemas) segue o **padrão
novo, com layout de slides**, descrito em `docs/padrao-trilhas.md`:

- Teoria = um arquivo **`.md`** (mesma sintaxe de `materiais/instrucoes-para-ia.md`)
  + uma casca HTML mínima que carrega o motor compartilhado.
- **Nunca** crie um `*-teoria.html` com `STEPS` nem copie uma atividade de
  `turmas/*/atividades/` como modelo — isso é o padrão antigo, só das trilhas
  já construídas (que **não** devem ser alteradas nem migradas).
- Regras de nota, progresso, capacidade MSEP e qualidade das perguntas não
  mudaram — estão no documento.
- Se o documento ainda disser **"MOTOR EM CONSTRUÇÃO"**, não crie a trilha:
  avise o usuário e pergunte como seguir.

Mais de um agente pode trabalhar ao mesmo tempo, cada um na sua **git
worktree** (`.claude/worktrees/<nome>`, branch `worktree-<nome>`).

## Testes: quem roda é o GitHub, não o agente

**Não rode testes localmente**: nem `npx playwright test`, nem `npm test`,
nem um spec isolado. O usuário não quer gastar tokens com isso.

Quem testa é o GitHub Actions (`.github/workflows/deploy.yml`): a cada push
na `main` ele roda a suíte completa (`npm test`) e **só publica o site se
todos os testes passarem**. Código quebrado pode chegar na `main`, mas não
chega no site dos alunos.

Isso também evita um problema real de rodar testes em paralelo: o
Playwright sempre usa a porta 4173 e reaproveita um servidor que já esteja
lá, então os testes de um agente podiam conferir os arquivos da worktree de
outro, sem avisar.

O que continua sendo responsabilidade do agente:

- **Mudou um comportamento de propósito? Atualize os testes que esperam o
  comportamento antigo.** Procure em `tests/` pelo texto, id ou seletor que
  você mudou (ex.: `grep -rn "btnExamGuardAlerts" tests/`). Se não fizer
  isso, o GitHub reprova e o deploy fica travado, inclusive para o
  trabalho do outro agente.
- **Testes novos só quando o usuário pedir.**
- Se o usuário avisar que o GitHub reprovou, aí sim leia o log da falha
  (aba Actions) e corrija.

## Fluxo de cada tarefa

1. Trabalhe **só dentro da sua worktree**. Nunca edite o checkout
   principal (`D:\projetos\portal_aulas\portal_aulas`) nem outra worktree.
2. Antes de começar, traga a `main` mais recente:
   `git fetch origin` e `git rebase origin/main`.
3. Quando o usuário pedir commit/push:
   - Commit no seu branch, com a mensagem neste formato:

     ```
     <resumo curto do que foi feito>

     O que mudou de comportamento (de propósito):
     - <ex.: o botão de perfil do professor agora abre a personalização>

     Testes ajustados: <specs alterados, ou "nenhum">
     SQL: <arquivo em sql/ que o usuário precisa rodar no Supabase, ou "nenhum">
     ```

   - `git fetch origin`, `git rebase origin/main` e
     `git push origin HEAD:main`.
   - Se o Git recusar o push (o outro agente enviou antes), repita o
     rebase e o push.
   - Se o rebase der conflito num trecho que você não entende (código do
     outro agente), pare e pergunte ao usuário.
4. Depois do push, avise o usuário: o que foi enviado, se há SQL para rodar
   no Supabase, e que o GitHub vai testar e publicar em alguns minutos
   (aba **Actions** do repositório).

## Regras para todos

- A pilha do `git stash` é **compartilhada** entre as worktrees. Nunca use
  `git stash` / `git stash pop` puros. Para guardar trabalho, prefira um
  commit temporário.
- Nunca use push forçado (`--force`) e nunca reescreva a `main`.
- Evite mexer na mesma área que o outro agente ao mesmo tempo,
  principalmente nos arquivos grandes e compartilhados
  (`shared/platform-core.js`, `README.md`, `sql/supabase-setup-completo.sql`).
  Se a tarefa exigir, avise o usuário.

## Convenções do projeto

- Tudo em português: interface, comentários, mensagens de commit.
- O `README.md` documenta como cada parte funciona; atualize a seção
  correspondente quando mudar um comportamento.
- Scripts em `sql/` são idempotentes (`if not exists`, `create or replace`).
  `sql/supabase-setup-completo.sql` é a fonte da verdade.
