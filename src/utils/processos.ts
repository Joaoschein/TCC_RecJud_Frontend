import type { Processo, ProcessoForm } from '../types'

export function formatFullCurrency(value?: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value ?? 0)
}

export function formatMetricCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 1,
    notation: 'compact',
    style: 'currency',
  }).format(value)
}

export function formatDate(value?: string) {
  if (!value) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

export function getAbertura(processo: Processo) {
  return processo.abertura ?? processo.dataAbertura
}

export function getCredoresCount(processo: Processo) {
  if (Array.isArray(processo.credores)) {
    return processo.credores.length
  }

  return processo.credores ?? 0
}

export function toProcessoPayload(processo: ProcessoForm) {
  return {
    numeroProcesso: processo.numeroProcesso,
    empresa: processo.empresa,
    cnpj: processo.cnpj ?? '',
    vara: processo.vara,
    juizResponsavel: processo.juizResponsavel ?? '',
    comarca: processo.comarca ?? '',
    administradorJudicial: processo.administradorJudicial ?? '',
    abertura: processo.abertura ?? processo.dataAbertura ?? '',
    status: processo.status,
    timeline: processo.timeline ?? [],
  }
}

export function statusClass(status: string) {
  const normalized = status.toLowerCase()

  if (normalized.includes('aprovado')) {
    return 'status-approved'
  }

  if (normalized.includes('aguardando')) {
    return 'status-waiting'
  }

  return 'status-active'
}

export function formatStatus(status: string) {
  const labels: Record<string, string> = {
    AGUARDANDO_APROVACAO: 'Aguardando aprovacao',
    APROVADO: 'Aprovado',
    EM_ANDAMENTO: 'Em andamento',
  }

  return labels[status] ?? status
}
