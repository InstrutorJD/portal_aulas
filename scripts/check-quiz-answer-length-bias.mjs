#!/usr/bin/env node
// Detecta o viés "a resposta certa é sempre a mais comprida" nos quizzes de
// teoria (STEPS[].question em turmas/*/atividades/*.html). A ordem das
// opções já é embaralhada na tela (commit 18dff4a), mas isso não esconde o
// COMPRIMENTO do texto — um aluno atento ainda consegue "ler" qual é a
// certa só de olhar qual frase é mais longa/detalhada, sem saber o
// conteúdo. Rode com:
//
//   node scripts/check-quiz-answer-length-bias.mjs
//
// Só leitura — não edita nenhum arquivo. Lista os casos onde a opção certa
// é a mais comprida das 4, ordenados por quanto ela se destaca das outras
// (maior diferença primeiro), pra priorizar quais reescrever.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function findActivityFiles() {
  const dirs = [
    join(ROOT, 'turmas', 'jogos', 'atividades'),
    join(ROOT, 'turmas', 'sistemas', 'atividades'),
  ];
  const files = [];
  for (const dir of dirs) {
    for (const name of readdirSync(dir)) {
      if (name.endsWith('.html')) files.push(join(dir, name));
    }
  }
  return files;
}

// Extrai texto de dentro de aspas simples/duplas, respeitando escapes —
// as opções são sempre strings literais simples (sem template strings).
function extractStrings(raw) {
  const out = [];
  const re = /'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = re.exec(raw))) out.push((m[1] ?? m[2]).replace(/\\'/g, "'").replace(/\\"/g, '"'));
  return out;
}

// question: { prompt: '...', options: [...], correctIndex: N, ... } — os 3
// campos sempre aparecem nessa ordem nos arquivos atuais (ver STEPS em
// qualquer turmas/*/atividades/*-teoria.html ou csharp-basico.html).
const QUESTION_RE = /prompt:\s*(['"])((?:\\.|(?!\1).)*)\1[\s\S]*?options:\s*\[([\s\S]*?)\][\s\S]*?correctIndex:\s*(\d+)/g;

// Atividades práticas de múltipla escolha (ex.: vida-*/mundo-*, redes-*)
// usam CHALLENGES[] com o texto da pergunta em `desc`, não `prompt` — mesmo
// padrão options/correctIndex logo depois.
const CHALLENGE_RE = /desc:\s*(['"])((?:\\.|(?!\1).)*)\1[\s\S]*?options:\s*\[([\s\S]*?)\][\s\S]*?correctIndex:\s*(\d+)/g;

function stripTags(s) { return s.replace(/<[^>]+>/g, ''); }

function scanWith(re, src) {
  const results = [];
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(src))) {
    const prompt = m[2];
    const optionsRaw = m[3];
    const correctIndex = Number(m[4]);
    const options = extractStrings(optionsRaw).map(stripTags);
    if (options.length < 2 || correctIndex >= options.length) continue;
    const lengths = options.map(o => o.length);
    const correctLen = lengths[correctIndex];
    const others = lengths.filter((_, i) => i !== correctIndex);
    const maxOther = Math.max(...others);
    const isLongest = correctLen > maxOther;
    results.push({ prompt, options, correctIndex, correctLen, maxOther, isLongest, margin: correctLen - maxOther });
  }
  return results;
}

function scanFile(path) {
  const src = readFileSync(path, 'utf8');
  return [...scanWith(QUESTION_RE, src), ...scanWith(CHALLENGE_RE, src)];
}

function main() {
  const files = findActivityFiles();
  let total = 0;
  let flagged = [];

  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    for (const q of scanFile(file)) {
      total++;
      if (q.isLongest) flagged.push({ file: rel, ...q });
    }
  }

  flagged.sort((a, b) => b.margin - a.margin);

  console.log(`Perguntas analisadas: ${total}`);
  console.log(`Resposta certa é a opção mais comprida em: ${flagged.length} (${((flagged.length / total) * 100).toFixed(1)}%)\n`);

  for (const f of flagged) {
    console.log(`[${f.file}] +${f.margin} caracteres além da 2ª mais longa`);
    console.log(`  Pergunta: ${f.prompt}`);
    f.options.forEach((o, i) => {
      const mark = i === f.correctIndex ? '✓' : ' ';
      console.log(`   ${mark} (${o.length}) ${o}`);
    });
    console.log('');
  }
}

main();
