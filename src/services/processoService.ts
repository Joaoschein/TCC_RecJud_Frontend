import type { EventoTimeline, Processo, ProcessoForm } from '../types'
import { toProcessoPayload } from '../utils/processos'
import { apiRequest } from './api'

export function listarProcessos(token: string) {
  return apiRequest<Processo[]>('/api/processos', token)
}

export function criarProcesso(token: string, processo: ProcessoForm) {
  return apiRequest<Processo>('/api/processos', token, {
    method: 'POST',
    body: JSON.stringify(toProcessoPayload(processo)),
  })
}

export function atualizarProcesso(token: string, id: string, processo: ProcessoForm) {
  return apiRequest<Processo>(`/api/processos/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(toProcessoPayload(processo)),
  })
}

export function atualizarTimelineProcesso(token: string, id: string, timeline: EventoTimeline[]) {
  return apiRequest<Processo>(`/api/processos/${id}/timeline`, token, {
    method: 'PUT',
    body: JSON.stringify(timeline),
  })
}

export function removerProcesso(token: string, id: string) {
  return apiRequest<void>(`/api/processos/${id}`, token, {
    method: 'DELETE',
  })
}
