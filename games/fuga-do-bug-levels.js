// Fases do "Fuga do Bug" (games/fuga-do-bug.html), da mais fácil pra mais difícil.
//
// Coordenadas em TILES de 32px (col, linha), linha 0 = topo, 17 linhas no total.
// O chão padrão tem a superfície na linha 14 (ground(a, z) preenche as colunas
// a..z-1 daí pra baixo); uma coisa "em cima do chão" fica na linha 13.
// Um pulo alcança ~3 tiles de altura e ~5 tiles de distância, então as fases
// respeitam: degrau <= 2 tiles, buraco <= 4 tiles (5 só nas fases finais).
// tests/fuga-do-bug-fases.spec.js roda um solver em CADA fase pra garantir
// que ela tem solução — mexeu numa fase, rode aquele teste.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FugaLevels = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function level(meta, build) {
    const d = Object.assign({
      ground: [], blocks: [], spikes: [], fakes: [], crumbles: [], movers: [], saws: [],
      drops: [], popups: [], springs: [], coins: [], checks: [], start: [2, 13], goal: null,
    }, meta);
    const push = key => (...a) => { d[key].push(a); };
    build({
      ground: push('ground'), block: push('blocks'), spikes: push('spikes'), fake: push('fakes'),
      crumble: push('crumbles'), mover: push('movers'), saw: push('saws'), drop: push('drops'),
      popup: push('popups'), spring: push('springs'), coin: push('coins'), check: push('checks'),
      start: (c, r) => { d.start = [c, r]; }, goal: (c, r) => { d.goal = [c, r]; },
    });
    return d;
  }

  const LEVELS = [
    // ---------------------------------------------------------------- 1
    level({
      name: 'Hello, World', cmd: 'git init', stars: 1, accent: '#7cff3f', cols: 84,
      blurb: 'Um espinho, um buraco, um degrau. Aquecimento: pule com Espaço.',
    }, b => {
      b.ground(0, 26);
      b.coin(9, 12);
      b.spikes(15, 13, 1); b.coin(15, 11);
      b.ground(29, 52); b.coin(27, 10);
      b.check(32, 13);
      b.spikes(40, 13, 2); b.coin(40, 11);
      b.block(46, 12, 3, 2); b.coin(47, 10);
      b.ground(55, 84); b.coin(53, 10);
      b.check(58, 13);
      b.spikes(66, 13, 1);
      b.spikes(71, 13, 2); b.coin(71, 11);
      b.goal(80, 12);
    }),

    // ---------------------------------------------------------------- 2
    level({
      name: 'Primeiros Passos', cmd: 'git add .', stars: 1, accent: '#7cff3f', cols: 100,
      blurb: 'Degraus, plataformas no ar e espinhos embaixo delas.',
    }, b => {
      b.ground(0, 17);
      b.coin(7, 12);
      b.spikes(10, 13, 2); b.coin(10, 11);
      b.block(14, 12, 2, 2);
      b.ground(21, 46); b.coin(19, 10);
      b.check(24, 13);
      b.block(28, 12, 3, 1); b.spikes(29, 13, 2); b.coin(29, 10);
      b.spikes(36, 13, 1); b.spikes(39, 13, 1); b.coin(37, 11);
      b.ground(50, 74); b.coin(48, 10);
      b.block(53, 12, 3, 2);
      b.block(56, 10, 3, 4); b.coin(57, 8);
      b.spikes(62, 13, 3); b.coin(63, 11);
      b.ground(77, 100); b.coin(75, 10);
      b.check(80, 13);
      b.spikes(86, 13, 1); b.spikes(89, 13, 2); b.coin(89, 11);
      b.goal(96, 12);
    }),

    // ---------------------------------------------------------------- 3
    level({
      name: 'Plataforma Suspeita', cmd: 'git commit -m "confia"', stars: 2, accent: '#b4e34a', cols: 112,
      blurb: 'Nem toda plataforma é de verdade. Se ela não te segura, pule por cima.',
    }, b => {
      b.ground(0, 30);
      b.coin(8, 12);
      b.fake(13, 12, 3); b.coin(14, 10); // decoração inofensiva: dá pra cair no chão
      b.spikes(21, 13, 2);
      b.spikes(26, 13, 1);
      b.block(32, 12, 2, 1); b.fake(34, 12, 2); b.block(36, 12, 2, 1); b.coin(33, 10); b.coin(37, 10);
      b.ground(39, 72);
      b.check(41, 13);
      b.spikes(49, 13, 6); b.fake(49, 12, 2); b.block(52, 12, 2, 1); b.coin(52, 10);
      b.check(60, 13);
      b.block(64, 12, 2, 2); b.spikes(66, 13, 2);
      b.ground(76, 112); b.coin(74, 10);
      b.fake(80, 12, 2); b.spikes(80, 13, 2);
      b.block(84, 12, 3, 1); b.coin(85, 10);
      b.check(90, 13);
      b.spikes(94, 13, 4); b.block(94, 11, 1, 1); b.fake(96, 11, 2);
      b.spikes(102, 13, 1);
      b.goal(108, 12);
    }),

    // ---------------------------------------------------------------- 4
    level({
      name: 'Chão que Some', cmd: 'git branch chao-fragil', stars: 2, accent: '#d4c86a', cols: 124,
      blurb: 'Pedras que desmoronam meio segundo depois que você pisa. Não pare.',
    }, b => {
      b.ground(0, 14);
      b.coin(8, 12);
      b.spikes(10, 13, 1);
      b.crumble(16, 13, 1); b.crumble(19, 13, 1); b.crumble(22, 12, 1); b.crumble(25, 13, 1);
      b.crumble(28, 12, 1); b.crumble(31, 13, 1);
      b.coin(22, 10); b.coin(28, 10);
      b.ground(34, 62);
      b.check(37, 13);
      b.spikes(44, 13, 2);
      b.block(48, 12, 4, 1); b.spikes(48, 13, 4); b.coin(49, 10);
      b.check(57, 13);
      b.crumble(64, 13, 1); b.crumble(67, 12, 1); b.crumble(70, 11, 1); b.crumble(73, 12, 1);
      b.crumble(76, 13, 1); b.crumble(79, 12, 1); b.crumble(82, 13, 1);
      b.coin(70, 9); b.coin(79, 10);
      b.ground(85, 124);
      b.check(88, 13);
      b.spikes(95, 13, 2);
      b.crumble(100, 12, 3); b.spikes(100, 13, 3);
      b.spikes(108, 13, 1);
      b.goal(120, 12);
    }),

    // ---------------------------------------------------------------- 5
    level({
      name: 'Serra Elétrica', cmd: 'git merge --no-ff', stars: 3, accent: '#e0b040', cols: 132,
      blurb: 'Serras vão e vêm. Observe o vaivém e passe quando abrir.',
    }, b => {
      b.ground(0, 132);
      b.coin(8, 12);
      b.saw(16, 13, 'x', 3, 150, 0); b.coin(16, 10);
      b.check(24, 13);
      b.saw(32, 13, 'x', 3, 150, 0); b.saw(39, 13, 'x', 3, 150, Math.PI);
      b.coin(35, 10);
      b.check(46, 13);
      b.spikes(52, 13, 2);
      b.saw(58, 12, 'y', 2, 150, 0); b.coin(58, 9);
      b.spikes(64, 13, 1);
      b.check(68, 13);
      b.block(72, 11, 4, 1); b.saw(74, 12, 'x', 3, 130, 0); b.coin(73, 9);
      b.check(84, 13);
      b.saw(90, 13, 'x', 3, 130, 0); b.saw(96, 13, 'x', 3, 130, Math.PI); b.saw(102, 13, 'x', 3, 130, 0);
      b.spikes(108, 13, 2);
      b.saw(114, 12, 'y', 2, 140, 0); b.saw(118, 12, 'y', 2, 140, Math.PI);
      b.goal(128, 12);
    }),

    // ---------------------------------------------------------------- 6
    level({
      name: 'Elevador de Deploy', cmd: 'git stash', stars: 3, accent: '#e89a3c', cols: 140,
      blurb: 'Plataformas que viajam sobre o abismo. Espere a sua e embarque.',
    }, b => {
      b.ground(0, 16);
      b.coin(8, 12);
      b.mover(17, 14, 3, 7, 240, 0);
      b.ground(30, 50);
      b.check(32, 13);
      b.spikes(40, 13, 2);
      b.mover(51, 12, 3, 6, 220, 0); b.coin(56, 8);
      b.ground(62, 80);
      b.check(64, 13);
      b.saw(70, 13, 'x', 3, 150, 0);
      b.mover(81, 13, 3, 5, 200, 0); b.mover(90, 12, 3, 5, 200, Math.PI);
      b.ground(98, 116); b.coin(94, 9);
      b.check(100, 13);
      b.spikes(106, 13, 2);
      b.mover(117, 12, 3, 6, 200, 0);
      b.ground(128, 140); b.coin(122, 9);
      b.goal(136, 12);
    }),

    // ---------------------------------------------------------------- 7
    level({
      name: 'Teto Instável', cmd: 'git rebase -i HEAD~5', stars: 4, accent: '#ef7c3a', cols: 136,
      blurb: 'O teto cai e o chão morde. Quando algo tremer, corra — ou pule.',
    }, b => {
      b.ground(0, 136);
      b.coin(8, 12);
      b.drop(16, 8, 2);
      b.check(26, 13);
      b.popup(32, 13);
      b.drop(40, 8, 2); b.drop(46, 8, 2);
      b.spikes(52, 13, 2);
      b.check(58, 13);
      b.popup(64, 13); b.popup(67, 13);
      b.drop(72, 8, 2);
      b.check(82, 13);
      b.block(86, 12, 3, 2); b.popup(90, 13);
      b.drop(94, 8, 2); b.spikes(98, 13, 2);
      b.check(106, 13);
      b.popup(110, 13); b.drop(114, 8, 2); b.popup(118, 13);
      b.coin(112, 11);
      b.goal(130, 12);
    }),

    // ---------------------------------------------------------------- 8
    level({
      name: 'Molas e Serras', cmd: 'git cherry-pick a1b2c3d', stars: 4, accent: '#ef5a3a', cols: 140,
      blurb: 'Molas te lançam alto. Serras verticais guardam o caminho.',
    }, b => {
      b.ground(0, 22);
      b.spring(12, 13); b.block(16, 8, 5, 1); b.coin(18, 6);
      b.ground(26, 52);
      b.check(28, 13);
      b.saw(36, 11, 'y', 2, 140, 0); b.saw(42, 11, 'y', 2, 140, Math.PI);
      b.spikes(47, 13, 2);
      b.spring(53, 13); b.block(58, 7, 4, 1); b.coin(59, 5);
      b.ground(66, 96);
      b.check(68, 13);
      b.spikes(74, 13, 2); b.saw(80, 12, 'y', 2, 130, 0);
      b.crumble(88, 12, 1); b.crumble(91, 11, 1);
      b.ground(100, 140);
      b.check(102, 13);
      b.spring(108, 13); b.block(113, 8, 4, 1); b.saw(122, 12, 'x', 3, 120, 0);
      b.goal(136, 12);
    }),

    // ---------------------------------------------------------------- 9
    level({
      name: 'Caça ao Bug', cmd: 'git bisect start', stars: 5, accent: '#ee4a4a', cols: 150,
      blurb: 'Tudo junto: falsas, esfarelas, serras, teto e molas. Boa sorte.',
    }, b => {
      b.ground(0, 18);
      b.coin(8, 12);
      b.block(20, 12, 2, 1); b.fake(23, 12, 2); b.crumble(26, 12, 1); b.block(29, 12, 2, 1); b.crumble(33, 13, 1);
      b.ground(36, 60);
      b.check(38, 13);
      b.saw(44, 13, 'x', 3, 120, 0); b.drop(50, 8, 2);
      b.spikes(56, 13, 2);
      b.mover(61, 13, 3, 6, 200, 0);
      b.ground(74, 96);
      b.check(76, 13);
      b.popup(82, 13); b.saw(88, 12, 'y', 2, 120, 0);
      b.spring(97, 13); b.block(102, 8, 3, 1); b.fake(106, 8, 2); b.block(109, 8, 3, 1);
      b.ground(114, 150);
      b.check(116, 13);
      b.spikes(122, 13, 2); b.drop(126, 8, 2); b.saw(132, 13, 'x', 3, 110, 0);
      b.crumble(140, 12, 1);
      b.goal(146, 12);
    }),

    // ---------------------------------------------------------------- 10
    level({
      name: 'O Merge Final', cmd: 'git push --force', stars: 5, accent: '#ff3b30', cols: 170,
      blurb: 'A branch principal te espera. Sem rede de segurança — só o que você aprendeu.',
    }, b => {
      b.ground(0, 16);
      b.coin(8, 12);
      b.crumble(19, 13, 1); b.crumble(22, 12, 1); b.crumble(25, 11, 1); b.crumble(28, 12, 1);
      b.ground(31, 52);
      b.check(33, 13);
      b.saw(40, 13, 'x', 3, 110, 0); b.saw(46, 13, 'x', 3, 110, Math.PI);
      b.mover(53, 12, 3, 6, 180, 0);
      b.ground(66, 90);
      b.check(68, 13);
      b.popup(74, 13); b.drop(78, 8, 2); b.popup(84, 13);
      b.spring(91, 13); b.block(96, 8, 3, 1); b.saw(100, 10, 'y', 2, 120, 0); b.block(104, 8, 3, 1);
      b.ground(110, 140);
      b.check(112, 13);
      b.fake(118, 12, 2); b.spikes(118, 13, 2); b.block(122, 12, 2, 1);
      b.saw(128, 12, 'y', 2, 110, 0); b.saw(132, 12, 'y', 2, 110, Math.PI);
      b.crumble(142, 12, 1); b.crumble(145, 11, 1); b.crumble(148, 12, 1);
      b.ground(152, 170);
      b.check(154, 13);
      b.spikes(158, 13, 2);
      b.goal(166, 12);
    }),
  ];

  return LEVELS;
});
