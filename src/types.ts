import type { ReactNode } from 'react'

export type Usuario = {
  id: string
  nome: string
  email: string
  role: string
}

export type AuthResponse = {
  tokenType: string
  accessToken: string
  expiresIn: number
  usuario: Usuario
}

export type CredorResumo = {
  id: string
  nome: string
  documento: string
  tipo?: string
  tipoDescricao?: string
  valor: number
  status: string
  dataCadastro?: string
}

export type Credor = CredorResumo & {
  classe?: number
  numeroProcesso?: string
  processoId?: string
  processoNome?: string
}

export type CredorForm = {
  documento: string
  nome: string
  processoId: string
  status: 'HABILITADO' | 'PENDENTE' | 'IMPUGNADO'
  tipo: 'TRABALHISTA' | 'GARANTIA_REAL' | 'QUIROGRAFARIO' | 'ME_EPP'
  valor?: number
}

export type Processo = {
  id: string
  numeroProcesso: string
  empresa: string
  vara: string
  status: StatusProcesso
  cnpj?: string
  credores?: number | CredorResumo[]
  abertura?: string
  dataAbertura?: string
  valorTotal?: number
  eventoAtual?: string
  dataEvento?: string
}

export type StatusProcesso = 'EM_ANDAMENTO' | 'AGUARDANDO_APROVACAO' | 'APROVADO'

export type ProcessoForm = Omit<Processo, 'id'>

export type AppView = 'dashboard' | 'processos' | 'credores'

export type MetricCardProps = {
  label: string
  value: string
  delta: string
  tone: 'blue' | 'green' | 'purple'
  icon: ReactNode
}
