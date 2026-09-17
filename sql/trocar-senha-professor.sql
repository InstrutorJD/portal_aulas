-- Troca a senha de uma conta de professor/admin diretamente em auth.users
-- (Supabase Auth), sem precisar do painel Authentication > Users nem da
-- service_role key.
--
-- COMO USAR:
--   1) Troque 'USERNAME_AQUI' pelo username da conta (o mesmo valor que
--      está em public.profiles.email — NÃO é o e-mail interno do Auth).
--      Ex.: se o professor loga como "jairon", o e-mail interno gerado por
--      scripts/migrate-users-to-auth.mjs é "jairon@aluno.portal.local".
--   2) Troque 'NOVA_SENHA_AQUI' pela senha nova desejada.
--   3) Rode o bloco inteiro no SQL Editor do Supabase.
--
-- pgcrypto já vem habilitado por padrão em todo projeto Supabase (schema
-- "extensions"), então crypt()/gen_salt() funcionam sem setup adicional.
--
-- ATENÇÃO — isso troca a senha de login de verdade da conta. Depois de
-- rodar, avise a pessoa dona da conta (ela vai precisar da senha nova pra
-- entrar) e não deixe este arquivo com a senha em texto puro salvo em
-- lugar nenhum depois de usado.

update auth.users
set encrypted_password = extensions.crypt('NOVA_SENHA_AQUI', extensions.gen_salt('bf')),
    updated_at = now()

where email = 'USERNAME_AQUI@aluno.portal.local'
returning id, email, updated_at;

-- Se a linha acima devolver 0 linhas, confira:
--   - o username está exatamente igual ao que está em public.profiles.email
--     (select email, role from public.profiles where role in ('professor','admin');)
--   - o domínio é mesmo '@aluno.portal.local' (ver EMAIL_DOMAIN em
--     scripts/migrate-users-to-auth.mjs — é o mesmo domínio pra aluno e
--     professor, apesar do nome)
