import { useEffect, useState } from 'react'
import {
  baixarDocumento,
  listarDocumentosProcesso,
  removerDocumento,
  uploadDocumentoProcesso,
} from '../services/documentoService'
import type { DocumentoProcesso, DocumentoUploadForm } from '../types'

type UseDocumentosProcessoOptions = {
  onAuthRequired: () => void
  processoId: string | null
  setStatusMessage: (message: string) => void
  token: string
}

export function useDocumentosProcesso({
  onAuthRequired,
  processoId,
  setStatusMessage,
  token,
}: UseDocumentosProcessoOptions) {
  const [documentosProcesso, setDocumentosProcesso] = useState<DocumentoProcesso[]>([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [savingDocumento, setSavingDocumento] = useState(false)

  useEffect(() => {
    if (!token || !processoId) {
      setDocumentosProcesso([])
      return
    }

    void carregarDocumentosProcesso(processoId)
  }, [processoId, token])

  async function carregarDocumentosProcesso(currentProcessoId: string) {
    if (!token) {
      return
    }

    setLoadingDocumentos(true)
    try {
      const lista = await listarDocumentosProcesso(token, currentProcessoId)
      setDocumentosProcesso(lista)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao listar documentos.'
      setDocumentosProcesso([])
      setStatusMessage(message)
    } finally {
      setLoadingDocumentos(false)
    }
  }

  async function handleUploadDocumento(documento: DocumentoUploadForm) {
    if (!token || !processoId) {
      setStatusMessage('Faca login para enviar documentos.')
      onAuthRequired()
      return
    }

    setSavingDocumento(true)
    try {
      const saved = await uploadDocumentoProcesso(token, processoId, documento)
      setDocumentosProcesso((current) => [saved, ...current])
      setStatusMessage(`Documento ${saved.nome} enviado com sucesso.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar documento.'
      setStatusMessage(message)
    } finally {
      setSavingDocumento(false)
    }
  }

  async function handleDownloadDocumento(documento: DocumentoProcesso) {
    if (!token) {
      setStatusMessage('Faca login para baixar documentos.')
      onAuthRequired()
      return
    }

    try {
      const blob = await baixarDocumento(token, documento.id)
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = documento.nomeArquivo
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao baixar documento.'
      setStatusMessage(message)
    }
  }

  async function handleDeleteDocumento(documento: DocumentoProcesso) {
    if (!token) {
      setStatusMessage('Faca login para excluir documentos.')
      onAuthRequired()
      return
    }

    setSavingDocumento(true)
    try {
      await removerDocumento(token, documento.id)
      setDocumentosProcesso((current) => current.filter((item) => item.id !== documento.id))
      setStatusMessage(`Documento ${documento.nome} removido com sucesso.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao remover documento.'
      setStatusMessage(message)
    } finally {
      setSavingDocumento(false)
    }
  }

  function clearDocumentosProcesso() {
    setDocumentosProcesso([])
  }

  return {
    clearDocumentosProcesso,
    documentosProcesso,
    handleDeleteDocumento,
    handleDownloadDocumento,
    handleUploadDocumento,
    loadingDocumentos,
    savingDocumento,
  }
}
