import type { Credor, CredorForm } from '../types'

export function toCredorPayload(credor: CredorForm) {
  return {
    nome: credor.nome,
    documento: credor.documento,
    processoId: credor.processoId,
    tipo: credor.tipo,
    valor: Number(credor.valor ?? 0),
    status: credor.status,
  }
}

export function credorTipoLabel(credor: Credor) {
  return credor.tipoDescricao ?? credor.tipo ?? 'Nao informado'
}

export function credorProcessoLabel(credor: Credor) {
  return credor.processoNome ?? credor.numeroProcesso ?? 'Processo nao informado'
}

export function credorStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function credorStatusClass(status: string) {
  const normalized = status.toLowerCase()

  if (normalized.includes('habilitado')) {
    return 'status-approved'
  }

  if (normalized.includes('pendente')) {
    return 'status-waiting'
  }

  if (normalized.includes('impugnado')) {
    return 'status-rejected'
  }

  return 'status-active'
}

export function credorTipoClass(tipo: string) {
  const normalized = tipo.toLowerCase()

  if (normalized.includes('garantia')) {
    return 'type-secured'
  }

  if (normalized.includes('fiscal')) {
    return 'type-tax'
  }

  if (normalized.includes('trabalhista')) {
    return 'type-labor'
  }

  return 'type-unsecured'
}
