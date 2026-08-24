// "Dar visto": verifica usuário/senha de PROFESSOR dentro de uma atividade
// que o portal não consegue corrigir sozinho (ex.: projeto no GitHub
// Codespaces + Supabase) — o professor confere o resultado pessoalmente e
// autoriza a conclusão digitando a própria credencial na tela do aluno.
//
// Cuidado central: NUNCA usar window.PortalSession.signIn() aqui. Aquele
// client é o mesmo da sessão principal (persiste em localStorage) — logar
// como professor por ali trocaria a sessão do aluno pela do professor na
// aba/origem inteira. Este helper cria um client Supabase à parte, com
// persistSession:false, só pra validar a senha e o papel — a sessão dele
// nunca é salva e é encerrada (signOut) logo depois de checar, sucesso ou
// não. shared/session.js e supabase-js precisam já estar carregados antes
// deste arquivo.
window.PortalProfessorVisto = (function () {
  async function verificar(username, senha) {
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
      return { ok: false, erro: 'Supabase não configurado nesta atividade.' };
    }
    if (!window.PortalSession || !username || !senha) {
      return { ok: false, erro: 'Informe usuário e senha do professor.' };
    }

    const temp = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const email = window.PortalSession.authEmailFromUsername(username.trim().toLowerCase());
    const { data: authData, error: authError } = await temp.auth.signInWithPassword({ email, password: senha });
    if (authError || !authData || !authData.user) {
      return { ok: false, erro: 'Usuário ou senha incorretos.' };
    }

    const { data: profile, error: profileError } = await temp
      .from('profiles').select('role, nome').eq('id', authData.user.id).maybeSingle();

    // Sempre desloga o client temporário antes de devolver o resultado —
    // best-effort, não deve travar a resposta se falhar.
    try { await temp.auth.signOut(); } catch (e) {}

    if (profileError || !profile) {
      return { ok: false, erro: 'Não foi possível confirmar o perfil dessa conta.' };
    }
    if (profile.role !== 'professor') {
      return { ok: false, erro: 'Essas credenciais não são de um professor.' };
    }
    return { ok: true, nome: profile.nome };
  }

  return { verificar };
})();
