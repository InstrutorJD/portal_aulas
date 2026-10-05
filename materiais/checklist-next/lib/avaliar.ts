import type { Item, Resultado } from './tipos'

export function avaliarInspecao(itens: Item[]): Resultado {
  for (const item of itens) {
    if (item.critico && item.conforme === false) {
      return 'INAPTO'
    }
  }
  return 'APTO'
}

export function faltaMarcar(itens: Item[]): boolean {
  for (const item of itens) {
    if (item.conforme === null) {
      return true
    }
  }
  return false
}
