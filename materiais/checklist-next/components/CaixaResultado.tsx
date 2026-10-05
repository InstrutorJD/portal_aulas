import type { Resultado } from '@/lib/tipos'

type Props = {
  resultado: Resultado | null
}

export default function CaixaResultado({ resultado }: Props) {
  if (resultado === null) {
    return null
  }
  if (resultado === 'APTO') {
    return <p className="resultado apto">✅ APTO: liberado para o turno</p>
  }
  return <p className="resultado inapto">⛔ INAPTO: procure a manutenção</p>
}
