// "Dar visto" / "Pular etapa": confirma que quem está mexendo na tela é
// o professor SEM pedir login/senha reais dentro de uma atividade que o
// portal não consegue corrigir sozinha — a versão anterior pedia usuário
// e senha de verdade numa tela que fisicamente é do aluno, e foi assim
// que a senha do professor vazou uma vez (ver PENDENCIAS.md).
//
// Em vez disso, o professor gera um TOKEN de 6 dígitos (válido por 30
// minutos) na própria sessão dele — aba Gestão, gerarProfessorToken()/
// professorTokenAtual() em shared/platform-core.js — e só digita esse
// token aqui. A verificação roda pela RPC verificar_professor_token
// (sql/supabase-setup-completo.sql, bloco 13), que nunca expõe a lista
// de tokens nem qualquer credencial — só devolve se o token bate e o
// nome de quem gerou.
//
// Sem client separado nem persistSession:false: como não há mais
// signInWithPassword aqui, não existe risco de "roubar" a sessão do
// aluno logado na mesma aba — a RPC é só uma consulta, usando o client
// principal (window.PortalSession.client()).
//
// Inclua depois de supabase-config.js, da lib @supabase/supabase-js e
// de shared/session.js.
window.PortalProfessorVisto = (function () {
  async function verificarToken(token) {
    const tokenLimpo = (token || '').trim();
    if (!tokenLimpo) {
      return { ok: false, erro: 'Informe o token do professor.' };
    }
    const sb = window.PortalSession ? window.PortalSession.client() : null;
    if (!sb) {
      return { ok: false, erro: 'Supabase não configurado nesta atividade.' };
    }

    const { data, error } = await sb.rpc('verificar_professor_token', { p_token: tokenLimpo });
    if (error) {
      return { ok: false, erro: 'Não foi possível verificar o token agora. Tente de novo.' };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.valido) {
      return { ok: false, erro: 'Token inválido ou expirado. Peça um token novo ao professor.' };
    }
    return { ok: true, nome: row.nome };
  }

  return { verificarToken };
})();
