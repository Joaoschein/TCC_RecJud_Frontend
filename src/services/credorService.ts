import type { Credor, CredorForm, CredorImportResponse } from '../types'
import { toCredorPayload } from '../utils/credores'
import { apiRequest } from './api'

export function listarCredores(token: string) {
  return apiRequest<Credor[]>('/api/credores', token)
}

export function criarCredor(token: string, credor: CredorForm) {
  return apiRequest<Credor>('/api/credores', token, {
    method: 'POST',
    body: JSON.stringify(toCredorPayload(credor)),
  })
}

export function atualizarCredor(token: string, id: string, credor: CredorForm) {
  return apiRequest<Credor>(`/api/credores/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(toCredorPayload(credor)),
  })
}

export function removerCredor(token: string, id: string) {
  return apiRequest<void>(`/api/credores/${id}`, token, {
    method: 'DELETE',
  })
}

export function importarCredores(token: string, credores: CredorForm[]) {
  return apiRequest<CredorImportResponse>('/api/credores/importar', token, {
    method: 'POST',
    body: JSON.stringify({
      credores: credores.map(toCredorPayload),
    }),
  })
}
