import type { Inspecao, Item } from './tipos'

export const ITENS_INICIAIS: Item[] = [
  { nome: 'Freios', critico: true, conforme: null },
  { nome: 'Pneus', critico: true, conforme: null },
  { nome: 'Cinto de segurança', critico: true, conforme: null },
  { nome: 'Limpeza da cabine', critico: false, conforme: null },
  { nome: 'Nível de combustível', critico: false, conforme: null },
]

export const HISTORICO: Inspecao[] = [
  { equipamento: 'CAM-07', operador: 'Ana', data: '2026-10-02', resultado: 'APTO' },
  { equipamento: 'ESC-02', operador: 'Bruno', data: '2026-10-02', resultado: 'INAPTO' },
  { equipamento: 'PC-03', operador: 'Carla', data: '2026-10-01', resultado: 'APTO' },
]
