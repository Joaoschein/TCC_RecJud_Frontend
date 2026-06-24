import type { CredorForm } from '../types'

export const emptyCredor: CredorForm = {
  documento: '',
  nome: '',
  processoId: '',
  status: 'PENDENTE',
  tipo: 'QUIROGRAFARIO',
  valor: undefined,
}
