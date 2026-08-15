// @ts-check
// Valida o bloqueio de Ctrl+C/Ctrl+V ligado pelo professor: o toggle no
// painel grava em classroom_settings, e shared/clipboard-guard.js (incluído
// nas páginas do aluno) passa a cancelar o atalho quando o valor é true.
const { test, expect } = require('@playwright/test');
const { stubSupabaseFake } = require('./helpers');

async function ctrlVPrevented(page) {
  return page.evaluate(() => {
    const ev = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
}

test.describe('shared/clipboard-guard.js', () => {
  test('bloqueia Ctrl+V na plataforma do aluno quando clipboard_blocked=true', async ({ page }) => {
    await stubSupabaseFake(page, {
      classroom_settings: [{ id: 'global', clipboard_blocked: true }],
    });
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno');

    await expect.poll(() => ctrlVPrevented(page)).toBe(true);
    await expect(page.locator('#__clipboardGuardToast')).toBeVisible();
  });

  test('não bloqueia quando clipboard_blocked=false', async ({ page }) => {
    await stubSupabaseFake(page, {
      classroom_settings: [{ id: 'global', clipboard_blocked: false }],
    });
    await page.goto('/turmas/jogos/plataforma.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno');
    await page.waitForTimeout(100); // dá tempo do fetchState (que já resolve false) rodar

    expect(await ctrlVPrevented(page)).toBe(false);
  });

  test('nunca bloqueia o professor, mesmo com clipboard_blocked=true', async ({ page }) => {
    await stubSupabaseFake(page, {
      classroom_settings: [{ id: 'global', clipboard_blocked: true }],
    });
    await page.goto('/turmas/jogos/plataforma.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor');
    await page.waitForTimeout(100);

    expect(await ctrlVPrevented(page)).toBe(false);
  });

  test('funciona também dentro de um jogo (documento separado em iframe)', async ({ page }) => {
    await stubSupabaseFake(page, {
      classroom_settings: [{ id: 'global', clipboard_blocked: true }],
    });
    await page.addInitScript(() => sessionStorage.setItem('githack_authenticated', 'true'));
    await page.goto('/games/digitacao.html?user=breno.silva80&ip=192.168.1.10&saldo=1234.80&role=aluno&name=Breno&turma=jogos');

    await expect.poll(() => ctrlVPrevented(page)).toBe(true);
  });
});

test.describe('professor/painel.html — toggle de copiar/colar', () => {
  test('clicar no botão liga o bloqueio global e grava no Supabase', async ({ page }) => {
    await stubSupabaseFake(page, {
      classroom_settings: [{ id: 'global', clipboard_blocked: false }],
    });
    await page.goto('/professor/painel.html?user=admin&ip=192.168.1.254&saldo=9999.00&role=professor');

    const btn = page.locator('#btnToggleClipboard');
    await expect(btn).toHaveText('Bloquear Copiar/Colar (Todos)');

    await btn.click();
    await expect(btn).toHaveText(/BLOQUEADO/);

    const stored = await page.evaluate(() => window.__FAKE_DB__.classroom_settings.find(r => r.id === 'global'));
    expect(stored.clipboard_blocked).toBe(true);

    // clicar de novo desliga
    await btn.click();
    await expect(btn).toHaveText('Bloquear Copiar/Colar (Todos)');
  });
});
