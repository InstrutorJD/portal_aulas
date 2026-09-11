# Projeto Mural — Como o Mural Conversa com a Internet

## 1. Apresentação
4ª etapa do projeto Mural — um módulo extra dentro da trilha JÁ EXISTENTE "Serviços de Internet e Modelos" (Redes de Computadores), não uma trilha nova. O aluno usa o próprio Mural (banco já criado na matéria anterior) pra observar, na prática, como o navegador conversa com a internet.

---

## 2. Situação-problema
O time de Redes da PixelForge Studios precisa garantir que a comunicação entre o navegador do usuário e o servidor do Mural (Supabase) é entendida e monitorável. Você vai abrir o Mural, inspecionar o tráfego real com o DevTools e responder sobre o que está vendo.

---

## 3. Tecnologias utilizadas
- Navegador (DevTools, aba Network);
- O próprio Mural (rodando localmente ou publicado).

---

## 4. Objetivos da atividade
- Identificar método, URL, headers e corpo de uma requisição HTTP real.
- Explicar o papel do DNS na resolução do domínio do Supabase.
- Reconhecer HTTPS e por que ele importa pra dados de login.
- Ler status codes (200, 201, 401, 403) e relacioná-los a RLS.
- Relacionar a requisição observada à camada de aplicação do modelo TCP/IP.

---

# ETAPA 1 — Requisição HTTP

## Conceito
Uma requisição HTTP tem método (GET/POST/...), URL, headers e, em alguns casos, corpo.

## Comando
Abra o DevTools (Network) com o Mural rodando, faça login ou carregue o feed, e encontre a requisição pro seu projeto Supabase. Anote método, URL e 2 headers.

---

# ETAPA 2 — DNS

## Conceito
DNS traduz um domínio (nome) em endereço IP, pra o navegador saber pra onde mandar a requisição.

## Comando
Identifique o domínio `*.supabase.co` na requisição e explique o que aconteceria se o DNS não conseguisse resolvê-lo.

---

# ETAPA 3 — HTTPS

## Conceito
HTTPS criptografa a comunicação — essencial quando trafegam dados como senha.

## Comando
Confira o cadeado do navegador e o protocolo (`https://`) na URL da requisição.

---

# ETAPA 4 — Status code

## Conceito
O status code (200 OK, 201 Created, 401 Unauthorized, 403 Forbidden) diz o resultado da requisição.

## Comando
Force um erro (ex.: desative temporariamente uma policy de RLS no Supabase) e leia o status code retornado na aba Network.

---

# ETAPA 5 — Camada de aplicação

## Conceito
No modelo TCP/IP, HTTP roda na camada de aplicação — a mais próxima do usuário.

## Comando
Relacione a requisição observada com a camada de aplicação, explicando o que aconteceria se essa camada não existisse.

---

# CHECKLIST DE ENTREGA
- [ ] Requisição HTTP real identificada (método/URL/headers).
- [ ] Domínio Supabase e papel do DNS explicados.
- [ ] HTTPS conferido.
- [ ] Status code de erro observado e explicado.
- [ ] Camada de aplicação relacionada à requisição.

---

# REFLEXÃO FINAL
1. O que muda pro usuário se o site não usasse HTTPS?
2. Por que um erro de RLS aparece como 401/403 e não como 500?

---

# RELAÇÃO COM O PLANO DE ENSINO
A capacidade de "Serviços de Internet e Modelos" (Redes de Computadores) já cobre reconhecer tipos/características de serviços de internet e camadas de modelo — esta atividade aplica isso ao tráfego real gerado pelo próprio projeto Mural, em vez de cenários fictícios de central de chamados.

---

# CAPACIDADE PRINCIPAL A SER TRABALHADA
> **Reconhecer tipos e características (classificação, estrutura e modelos).**

---

# OBSERVAÇÃO PARA O DOCENTE
Esta é a menor peça do projeto interdisciplinar — pensada como um MÓDULO EXTRA (`pratica-mural`, `requires: 'pratica'`) dentro da trilha já existente "Serviços de Internet e Modelos", não uma trilha nova, pra não duplicar a capacidade sem necessidade.
