---
aula: 5
data: 2026-10-06
titulo: Ciclo de publicação: Issue, branch e pull request
turma: IA
descricao: Commit, branch, merge e pull request como as revisões de um procedimento operacional
fonte: grande
---

# Quem mudou o procedimento?
Aula 5: o histórico de versões do checklist

---

## O POP que mudou sozinho
+ O **POP** de inspeção do caminhão diz: "freios: conferir **semanalmente**"
+ Ontem estava escrito **diariamente**
+ Quem mudou? Quando? Por quê? Alguém aprovou?
+ Numa mina, uma mudança sem dono pode virar **acidente**
+ No código é igual. Hoje: o **histórico** do seu checklist

---

## Como a mina controla um POP?
Duas pessoas precisam alterar o mesmo POP. O que evita a bagunça?

- [ ] Cada uma edita o arquivo original, ao mesmo tempo
- [ ] A última que salvar ganha
- [x] Cada uma faz um **rascunho**, alguém **revisa** e só então vira a versão oficial
- [ ] Ninguém altera: o POP nunca muda

---

## Roteiro de hoje
- **Abertura** (5 min)
- **Parte 1**: Git, GitHub e o ciclo de uma mudança (25 min)
- **Parte 2**: o ciclo completo no seu repositório (85 min)
- **Fechamento**: checklist de conformidade (5 min)

---

# Parte 1 — O ciclo de uma mudança
Do pedido à versão oficial

---

## Git x GitHub
| | Git | GitHub |
|---|---|---|
| O que é | Programa de **versões** | **Site** que guarda repositórios |
| Onde roda | No **seu** computador (ou Codespace) | Na **nuvem** |
| Funciona sem internet? | ✅ Sim | ❌ Não |
| Faz | commit, branch, merge | Issue, pull request, revisão |

> O `push` e o `pull` são a **ponte** entre os dois.

---

## O POP e o código
| No procedimento (POP) | No Git/GitHub |
|---|---|
| Pedido de alteração | **Issue** |
| Rascunho da nova versão | **Branch** |
| Cada ajuste salvo no rascunho | **Commit** |
| Envio para aprovação | **Pull request** (PR) |
| Revisão aprovada vira oficial | **Merge** na `main` |

---

## Issue: o pedido de mudança
+ Um **cartão** na aba **Issues** do repositório
+ Título claro + descrição + critério de aceite
+ Ganha um **número**: `#1`, `#2`, `#3`...
+ Cada **RF** do seu README vira uma issue
+ Ela fica **aberta** até alguém entregar

---

## Branch: o rascunho
+ A `main` é a **versão oficial**: o que está no ar
+ A branch é uma **cópia de trabalho**, com nome próprio
+ Você erra à vontade lá: a `main` **não muda**
+ Nome diz o que é: `feature/equipamentos`
+ `feature/` = funcionalidade nova · `fix/` = correção

---

## Commit: cada ajuste, com motivo
| ❌ Ruim | ✅ Descritivo |
|---|---|
| `ajustes` | `Adiciona lista de equipamentos` |
| `aaa` | `Cria .gitignore para node_modules` |
| `final agora vai` | `Corrige id do botão Finalizar` |

Verbo no início, **o que** mudou. Quem lê o histórico entende sem abrir o código.

---

## Qual mensagem?
Você criou o arquivo com os equipamentos da mina. Qual commit é o melhor?

- [ ] `arquivo novo`
- [ ] `commit 3`
- [x] `Adiciona equipamentos.json com CAM-07, ESC-02 e PC-03`
- [ ] `mudanças`

---

## Pull request: o pedido de aprovação
+ "Quero levar a minha branch para a `main`"
+ Mostra **tudo** o que mudou, linha por linha
+ Um colega **revisa**: comenta, aprova ou pede mudanças
+ Na descrição, `Closes #3` liga o PR à **issue 3**
+ No **merge**, a issue 3 **fecha sozinha**

---

## Merge: vira oficial
+ O merge junta a branch na `main`
+ Só depois da **revisão**: quem escreveu não aprova o próprio PR
+ A `main` muda **no GitHub**; no Codespace, falta o `git pull`
+ A branch pode ser **apagada**: o histórico fica

---

## O ciclo inteiro
1. **Issue** `#3`: "RF03: listar os equipamentos"
2. **Branch** `feature/equipamentos`
3. **Commits** com mensagens descritivas + `push`
4. **Pull request** com `Closes #3`
5. **Revisão** do colega → **merge** → issue fechada

---

## Onde acontece?
Qual destes passos **só** existe no GitHub, e não no Git?

- [ ] Commit
- [ ] Branch
- [x] Pull request
- [ ] Merge

---

## .gitignore: o que **não** vai
+ Um arquivo de texto com o que o Git deve **ignorar**
+ `node_modules/`: milhares de arquivos, o `npm install` recria
+ `.env`: **senhas** e chaves, nunca vão para o GitHub
+ Só vale para arquivo **ainda não** commitado

---

# Parte 2 — O ciclo no seu repositório
Issue, branch, PR, revisão e merge

---

## Abra o seu projeto
1. Abra o repositório `checklist-inspecao` no GitHub
2. Abra o **Codespace** dele: **Code** → **Codespaces**
3. No terminal: `git pull` (traz o que mudou no site)
4. Confira o **README**: a tabela de requisitos está lá?

---

## Mão na massa: as Issues
1. No GitHub, aba **Issues** → **New issue**
2. Título: `RF01 - O sistema deve registrar a inspeção`
3. Descrição: a **prioridade** e o **critério de aceite**
4. **Create** e repita para **cada RF** do README
5. Anote o número da issue dos **equipamentos**

> Nenhum RF fala de equipamentos? Crie: `O sistema deve listar os equipamentos`.

---

## Mão na massa: o .gitignore
1. No Codespace, crie o arquivo `.gitignore` na **raiz**
2. Escreva uma linha para cada: `node_modules/`, `.next/` e `.env`
3. Teste: `echo "SENHA=123" > .env` e depois `git status`
4. O `.env` **não aparece**? O `.gitignore` funcionou
5. `git add .gitignore`, commit descritivo e `git push`

---

## Mão na massa: a branch
```bash
git switch -c feature/equipamentos
git branch
```

+ O `-c` **cria** a branch e já entra nela
+ O `git branch` lista todas; a de agora tem `*`
+ Daqui em diante, tudo vai para o **rascunho**

---

## Mão na massa: equipamentos.json
Cole no chat do Copilot:

> Crie só o arquivo equipamentos.json na raiz, com uma lista "equipamentos". Cada um com codigo, nome e tipo: CAM-07 Caminhão fora de estrada, ESC-02 Escavadeira e PC-03 Pá carregadeira. Sem comentários.

Revise antes de **Manter**: as chaves têm **aspas duplas**? Tem vírgula sobrando?

---

## Mão na massa: commits na branch
1. `git add equipamentos.json` e commit **descritivo**
2. Acrescente o **TR-04 Trator de esteira** no JSON
3. Outro commit: `Adiciona TR-04 à lista de equipamentos`
4. `git log --oneline`: os seus commits estão aí?
5. `git push -u origin feature/equipamentos`

> O `-u` só na primeira vez: ele liga a branch ao GitHub.

---

## Mão na massa: o pull request
1. No GitHub, apareceu o aviso amarelo: **Compare & pull request**
2. Confira: de `feature/equipamentos` **para** `main`
3. Título: `Lista de equipamentos`
4. Descrição: o que mudou + `Closes #N` (o nº da sua issue)
5. **Create pull request**

> Na issue, apareceu o link para o PR? Está vinculado.

---

## Rodízio: revise o PR do colega
1. Passe o link do seu PR ao colega da **direita**
2. No PR dele: aba **Files changed** (*Arquivos alterados*)
3. Comente uma **linha**: passe o mouse e clique no **+**
4. **Review changes** → escreva o parecer → **Approve**
5. Achou erro? **Request changes** e explique o quê

---

## O que o revisor confere
- ✅ O JSON é **válido**: aspas duplas, sem vírgula sobrando
- ✅ Os **4 equipamentos** estão lá, com código, nome e tipo
- ✅ As mensagens de commit são **descritivas**
- ✅ A descrição tem `Closes #N` com o número **certo**

> Revisar é proteger a `main`: o erro que passa daqui vai para o celular do operador.

---

## Mão na massa: o merge
1. Volte ao **seu** PR: leia a revisão do colega
2. Pediu mudança? Corrija na branch, commit e push: o PR **atualiza**
3. Aprovado: **Merge pull request** → **Confirm merge**
4. Abra a aba **Issues**: a sua issue **fechou**?
5. **Delete branch**: o rascunho já virou oficial

---

## De volta ao Codespace
```bash
git switch main
git pull
git log --oneline
```

O `equipamentos.json` agora está na `main`, junto com o **merge** no histórico.

---

## Qual comando?
Você está na `main` e quer começar um rascunho para o RF dos turnos.

- [ ] `git commit -m "turnos"`
- [x] `git switch -c feature/turnos`
- [ ] `git merge feature/turnos`
- [ ] `git push`

---

## Checklist de conformidade (1/2)
Abra o **seu** repositório no GitHub e confira:

- ✅ Uma **issue** para cada RF do README
- ✅ O `.gitignore` na raiz, com `node_modules/` e `.env`
- ✅ Commits com mensagens **descritivas** (aba **Commits**)
- ✅ A branch `feature/equipamentos` com pelo menos **2 commits**

---

## Checklist de conformidade (2/2)
- ✅ Um **PR** com `Closes #N` na descrição
- ✅ A **revisão** de um colega no seu PR
- ✅ O **merge** feito por você, e a issue **fechada**
- ✅ Você **revisou** o PR de um colega

> Faltou algo? Ainda dá tempo: o histórico mostra **tudo**.

---

## Revisão
O PR foi mesclado, mas a issue continua aberta. O que faltou?

- [ ] Apagar a branch
- [x] O `Closes #N` na descrição do PR
- [ ] Rodar `git pull` no Codespace
- [ ] Aprovar o próprio PR

---

## Revisão
Por que o `.env` vai no `.gitignore`?

- [ ] Porque é um arquivo grande demais
- [x] Porque guarda **senhas** que não podem ir para a nuvem
- [ ] Porque o GitHub não aceita arquivos com ponto
- [ ] Porque o `npm install` recria ele

---

## O que vimos hoje
+ **Git** guarda as versões no seu computador; **GitHub**, na nuvem
+ **Issue** pede, **branch** rascunha, **commit** registra
+ **Pull request** pede aprovação; **merge** torna oficial
+ `Closes #N` fecha a issue no merge
+ Revisar o código do colega **protege** a `main`

---

# Toda mudança tem dono
E o histórico conta quem mudou, quando e por quê
