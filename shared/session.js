// Identidade via Supabase Auth — substitui a leitura de ?user=/?role=/
// ?turma= da URL que existia antes desta migração. Como a sessão do
// Supabase fica no localStorage do domínio, qualquer página/iframe do
// mesmo site já enxerga quem está logado sem precisar receber nada por
// parâmetro — e ninguém consegue mais "virar professor" só editando a
// URL, porque quem decide o papel agora é a linha em public.profiles
// associada à sessão autenticada, não uma string que o cliente escreveu.
//
// Inclua depois de supabase-config.js e da lib @supabase/supabase-js,
// e antes de qualquer script que precise saber quem está logado.
window.PortalSession = (function () {
  // Domínio interno do e-mail que o Supabase Auth exige por baixo dos
  // panos — nunca aparece pro aluno; a tela de login continua pedindo
  // só o username de sempre. Mesma constante usada em
  // scripts/migrate-users-to-auth.mjs.
  const EMAIL_DOMAIN = 'aluno.portal.local';

  let sbClient = null;
  function client() {
    if (sbClient) return sbClient;
    const SUPABASE_URL = window.SUPABASE_URL;
    const SUPABASE_KEY = window.SUPABASE_ANON_KEY;
    if (!window.supabase || !SUPABASE_URL || !SUPABASE_KEY) return null;
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return sbClient;
  }

  function authEmailFromUsername(username) {
    return `${username}@${EMAIL_DOMAIN}`;
  }

  // Cache em memória: dura a vida da página (cada iframe tem a sua),
  // evita reconsultar profiles em toda chamada dentro da mesma página.
  let cachedUser = null;
  let pendingLookup = null;

  async function getUser() {
    if (cachedUser) return cachedUser;
    if (pendingLookup) return pendingLookup;

    pendingLookup = (async () => {
      const sb = client();
      if (!sb) return null;

      const { data: authData, error: authError } = await sb.auth.getUser();
      if (authError || !authData || !authData.user) return null;

      const { data: profile, error: profileError } = await sb
        .from('profiles')
        .select('email, nome, role, turma')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError || !profile) return null;

      cachedUser = { ...profile };
      return cachedUser;
    })();

    const result = await pendingLookup;
    pendingLookup = null;
    return result;
  }

  // loginPath: caminho relativo até index.html a partir da página atual
  // (ex.: '../index.html', '../../../index.html') — cada chamador sabe
  // a própria profundidade, igual já era feito nos redirects manuais.
  async function requireUser(loginPath) {
    const user = await getUser();
    if (!user) {
      window.location.href = loginPath;
      return null;
    }
    return user;
  }

  async function signIn(username, senha) {
    const sb = client();
    if (!sb) return { data: null, error: { message: 'Supabase não configurado.' } };
    return sb.auth.signInWithPassword({
      email: authEmailFromUsername((username || '').trim().toLowerCase()),
      password: senha,
    });
  }

  async function signOut() {
    const sb = client();
    cachedUser = null;
    if (sb) await sb.auth.signOut();
  }

  return { client, getUser, requireUser, signIn, signOut, authEmailFromUsername };
})();
