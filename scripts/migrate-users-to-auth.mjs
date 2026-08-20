#!/usr/bin/env node
// Migração ÚNICA: cria uma conta real no Supabase Auth para cada usuário
// de shared/users-db.js (reaproveitando a senha atual — ninguém precisa
// aprender credencial nova) e popula public.profiles, a tabela que as
// novas policies RLS usam pra saber quem está pedindo o quê.
//
// Pré-requisito: já ter rodado a versão atual de
// sql/supabase-setup-completo.sql no SQL Editor do seu projeto Supabase
// (ela cria public.profiles e as functions current_email()/is_professor()
// que este script alimenta).
//
// Como rodar (localmente, nunca em CI/repositório):
//
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node scripts/migrate-users-to-auth.mjs
//
// A service_role key fica em Project Settings > API no painel do
// Supabase. Ela ignora todo RLS — NUNCA commite essa chave, nunca a
// cole num arquivo do repositório, e não precisa (nem deve) me
// entregar essa chave em nenhum momento.
//
// Idempotente: pode rodar de novo sem medo — usuário que já existe no
// Auth não é recriado (só tem o profile atualizado/confirmado).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Domínio interno do e-mail que o Supabase Auth exige por baixo dos
// panos — nunca aparece pro aluno, a tela de login continua pedindo só
// o username de sempre (ver index.html).
const EMAIL_DOMAIN = 'aluno.portal.local';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (variáveis de ambiente) antes de rodar.');
  process.exit(1);
}

function loadUsersDb() {
  const path = join(__dirname, '..', 'shared', 'users-db.js');
  const source = readFileSync(path, 'utf8');
  // shared/users-db.js é `window.USERS_DB = [...]` — roda o arquivo real
  // (mesma fonte usada pelo login hoje) num sandbox com um `window` falso,
  // em vez de reimplementar/duplicar o parsing dos dados aqui.
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'shared/users-db.js' });
  const users = sandbox.window.USERS_DB;
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('shared/users-db.js não expôs window.USERS_DB (ou está vazio).');
  }
  return users;
}

async function adminFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(body?.msg || body?.message || body?.error_description || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function findExistingAuthUser(authEmail) {
  const result = await adminFetch(`/auth/v1/admin/users?email=${encodeURIComponent(authEmail)}`, { method: 'GET' });
  const users = result?.users || [];
  return users.find(u => u.email === authEmail) || null;
}

async function createOrGetAuthUser(authEmail, senha, nome) {
  const existing = await findExistingAuthUser(authEmail);
  if (existing) return { user: existing, created: false };

  const user = await adminFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: authEmail,
      password: senha,
      email_confirm: true, // não depende de e-mail real — ninguém vai clicar em link de confirmação
      user_metadata: { nome },
    }),
  });
  return { user, created: true };
}

async function upsertProfile({ id, email, nome, role, turma }) {
  await adminFetch('/rest/v1/profiles?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ id, email, nome, role, turma }]),
  });
}

async function main() {
  const users = loadUsersDb();
  console.log(`${users.length} usuários encontrados em shared/users-db.js. Domínio interno: @${EMAIL_DOMAIN}\n`);

  let createdCount = 0;
  let reusedCount = 0;
  let errorCount = 0;

  for (const u of users) {
    const authEmail = `${u.email}@${EMAIL_DOMAIN}`;
    try {
      const { user, created } = await createOrGetAuthUser(authEmail, u.senha, u.nome);
      await upsertProfile({ id: user.id, email: u.email, nome: u.nome, role: u.role, turma: u.turma });
      if (created) {
        createdCount++;
        console.log(`✓ criado       ${u.email}  (${u.role}/${u.turma})`);
      } else {
        reusedCount++;
        console.log(`= já existia   ${u.email}  — profile atualizado`);
      }
    } catch (err) {
      errorCount++;
      console.error(`✗ falhou       ${u.email}: ${err.message}`);
    }
  }

  console.log(`\nConcluído: ${createdCount} criados, ${reusedCount} já existiam, ${errorCount} falharam.`);
  if (errorCount > 0) {
    console.error('Alguns usuários falharam — revise as mensagens acima antes de considerar a migração completa.');
    process.exitCode = 1;
  } else {
    console.log('Teste agora um login de aluno e um de professor no ambiente real antes de fazer deploy do código novo.');
  }
}

main().catch(err => {
  console.error('Erro inesperado:', err);
  process.exitCode = 1;
});
