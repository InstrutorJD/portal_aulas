import { HISTORICO } from '@/lib/dados'

export default function PaginaHistorico() {
  return (
    <main>
      <h1>Histórico de inspeções</h1>
      <ul className="historico">
        {HISTORICO.map((inspecao) => (
          <li key={inspecao.equipamento + inspecao.data}>
            <strong>{inspecao.equipamento}</strong> · {inspecao.operador} · {inspecao.data} ·{' '}
            {inspecao.resultado === 'APTO' ? '✅ APTO' : '⛔ INAPTO'}
          </li>
        ))}
      </ul>
    </main>
  )
}
