import type { ProcessoForm } from '../types'

export const emptyProcesso: ProcessoForm = {
  numeroProcesso: '',
  empresa: '',
  vara: '',
  juizResponsavel: '',
  comarca: '',
  administradorJudicial: '',
  status: 'EM_ANDAMENTO',
  cnpj: '',
  abertura: '',
}
