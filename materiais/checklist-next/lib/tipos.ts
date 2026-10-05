export type Item = {
  nome: string
  critico: boolean
  conforme: boolean | null
}

export type Resultado = 'APTO' | 'INAPTO'

export type Inspecao = {
  equipamento: string
  operador: string
  data: string
  resultado: Resultado
}
