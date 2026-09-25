---
aula: 99
data: 2026-09-25
titulo: Teste do passador de slides
turma: Teste
descricao: Aula fictícia para testar o controle pelo celular (📱). Pode apagar depois.
---

# Teste do passador de slides
Leia o QR Code do 📱 e conduza esta aula pelo celular

---

## Slide comum
Se você está vendo este slide depois de tocar em **Próximo** no celular, a conexão funcionou.

> Confira no celular: o título deste slide e o número **2 / 8** devem aparecer lá.

---

## Revelar em etapas
Cada toque em **Próximo** deve mostrar um item:

+ Primeiro item
+ Segundo item
+ Terceiro item — o próximo toque passa de slide

---

## Voltar
Toque em **⟵ Voltar** no celular:

+ Ele esconde este item primeiro
+ E este aqui antes dele
+ Só depois volta para o slide anterior

---

## Pergunta para a turma
Qual botão do celular mostra a resposta certa?

- [ ] Voltar
- [x] 💡 Revelar
- [ ] Nenhum

---

## Código
O **Próximo** também funciona em slides com código:

```js
function passarSlide(celular) {
  celular.enviar('next');
}
```

---

## Deslizar
Em vez dos botões, deslize o dedo na tela do celular:

- Para a **esquerda**: avança
- Para a **direita**: volta

---

# Fim do teste
Tudo funcionou? Então o passador está pronto para as aulas de verdade.
