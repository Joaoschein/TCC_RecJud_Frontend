import type { DocumentoProcesso, DocumentoUploadForm } from '../types'
import { API_URL, apiRequest, parseApiError } from './api'

export function listarDocumentosProcesso(token: string, processoId: string) {
  return apiRequest<DocumentoProcesso[]>(`/api/processos/${processoId}/documentos`, token)
}

export function uploadDocumentoProcesso(token: string, processoId: string, documento: DocumentoUploadForm) {
  const formData = new FormData()
  formData.append('arquivo', documento.arquivo)
  formData.append('nome', documento.nome)

  if (documento.tipo) {
    formData.append('tipo', documento.tipo)
  }

  return apiRequest<DocumentoProcesso>(`/api/processos/${processoId}/documentos`, token, {
    method: 'POST',
    body: formData,
  })
}

export async function baixarDocumento(token: string, documentoId: string) {
  const response = await fetch(`${API_URL}/api/documentos/${documentoId}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw await parseApiError(response, token)
  }

  return response.blob()
}

export function removerDocumento(token: string, documentoId: string) {
  return apiRequest<void>(`/api/documentos/${documentoId}`, token, {
    method: 'DELETE',
  })
}
