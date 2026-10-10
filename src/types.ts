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

export type CredorImportItem = CredorForm & {
  classeOriginal: string
  linhasOrigem: number[]
  natureza?: string
  origem?: string
}

export type CredorImportInvalidRow = {
  documento?: string
  linha: number
  nome?: string
  motivo: string
}

export type CredorImportPreview = {
  agrupados: number
  invalidos: CredorImportInvalidRow[]
  itens: CredorImportItem[]
  linhasLidas: number
}

export type CredorImportResponse = {
  totalImportados: number
  credores: Credor[]
}

export type Processo = {
  id: string
  numeroProcesso: string
  empresa: string
  vara: string
  juizResponsavel?: string
  comarca?: string
  administradorJudicial?: string
  status: StatusProcesso
  cnpj?: string
  credores?: number | CredorResumo[]
  abertura?: string
  dataAbertura?: string
  valorTotal?: number
  eventoAtual?: string
  dataEvento?: string
  timeline?: EventoTimeline[]
}

export type StatusProcesso = 'EM_ANDAMENTO' | 'AGUARDANDO_APROVACAO' | 'APROVADO'

export type StatusEventoTimeline = 'PENDENTE' | 'CUMPRIDO'

export type EventoTimeline = {
  id?: string
  titulo: string
  descricao?: string
  data: string
  status: StatusEventoTimeline
}

export type ProcessoForm = Omit<Processo, 'id'>

export type ProcessoFieldErrors = Partial<
  Record<
    | 'abertura'
    | 'administradorJudicial'
    | 'cnpj'
    | 'comarca'
    | 'empresa'
    | 'juizResponsavel'
    | 'numeroProcesso'
    | 'status'
    | 'vara',
    string
  >
>

export type DocumentoProcesso = {
  id: string
  processoId: string
  nome: string
  nomeArquivo: string
  contentType: string
  tamanhoBytes: number
  tipo?: string
  dataUpload: string
}

export type DocumentoProcessoListItem = DocumentoProcesso & {
  processoNome: string
  processoNumero: string
}

export type DocumentoUploadForm = {
  arquivo: File
  nome: string
  tipo?: string
}

export type AppView = 'dashboard' | 'processos' | 'credores' | 'documentos' | 'relatorios'

export type MetricCardProps = {
  label: string
  value: string
  delta: string
  tone: 'blue' | 'green' | 'purple'
  icon: ReactNode
}
