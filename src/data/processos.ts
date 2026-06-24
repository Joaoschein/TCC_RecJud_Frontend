import type { ProcessoForm } from '../types'

export const emptyProcesso: ProcessoForm = {
  numeroProcesso: '',
  empresa: '',
  vara: '',
  status: 'EM_ANDAMENTO',
  cnpj: '',
  abertura: '',
  valorTotal: undefined,
}
