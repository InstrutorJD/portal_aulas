'use client'

import { useState } from 'react'
import ItemChecklist from '@/components/ItemChecklist'
import CaixaResultado from '@/components/CaixaResultado'
import { avaliarInspecao, faltaMarcar } from '@/lib/avaliar'
import { ITENS_INICIAIS } from '@/lib/dados'
import type { Item, Resultado } from '@/lib/tipos'

export default function PaginaInspecao() {
  const [itens, setItens] = useState<Item[]>(ITENS_INICIAIS)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  function marcar(nome: string, conforme: boolean) {
    setItens(itens.map((item) => (item.nome === nome ? { ...item, conforme } : item)))
    setResultado(null)
  }

  function finalizar() {
    if (faltaMarcar(itens)) {
      alert('Marque todos os itens antes de finalizar.')
      return
    }
    setResultado(avaliarInspecao(itens))
  }

  return (
    <main>
      <h1>Inspeção do CAM-07</h1>
      {itens.map((item) => (
        <ItemChecklist key={item.nome} item={item} onMarcar={marcar} />
      ))}
      <button className="finalizar" onClick={finalizar}>
        Finalizar
      </button>
      <CaixaResultado resultado={resultado} />
    </main>
  )
}
