import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Sidebar } from './components/Sidebar'
import { emptyCredor } from './data/credores'
import { emptyProcesso } from './data/processos'
import { CredoresPage } from './pages/CredoresPage'
import { DashboardPage } from './pages/DashboardPage'
import { DocumentosPage } from './pages/DocumentosPage'
import { LoginPage } from './pages/LoginPage'
import { ProcessoDetailPage } from './pages/ProcessoDetailPage'
import { ProcessosPage } from './pages/ProcessosPage'
import { RelatoriosPage } from './pages/RelatoriosPage'
import type {
  AppView,
  Credor,
  CredorForm,
  DocumentoProcessoListItem,
  EventoTimeline,
  Processo,
  ProcessoFieldErrors,
  ProcessoForm,
} from './types'
import { useAuth } from './hooks/useAuth'
import { useDocumentosProcesso } from './hooks/useDocumentosProcesso'
import { atualizarCredor, criarCredor, importarCredores, listarCredores, removerCredor } from './services/credorService'
import { baixarDocumento, listarDocumentosProcesso } from './services/documentoService'
import {
  atualizarProcesso,
  atualizarTimelineProcesso,
  criarProcesso,
  listarProcessos,
  removerProcesso,
} from './services/processoService'
import { getAbertura, getCredoresCount } from './utils/processos'
import { ApiError } from './services/api'
import './styles/index.css'

export default function App() {
  const {
    authLoading,
    email,
    handleLogin,
    handleLogout: handleAuthLogout,
    senha,
    setEmail,
    setSenha,
    setShowLogin,
    setStatusMessage,
    showLogin,
    statusMessage,
    token,
    usuario,
  } = useAuth()
  const [processo, setProcesso] = useState<ProcessoForm>(emptyProcesso)
  const [credor, setCredor] = useState<CredorForm>(emptyCredor)
  const [processos, setProcessos] = useState<Processo[]>([])
  const [credores, setCredores] = useState<Credor[]>([])
  const [documentos, setDocumentos] = useState<DocumentoProcessoListItem[]>([])
  const [activeView, setActiveView] = useState<AppView>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [credorSearchTerm, setCredorSearchTerm] = useState('')
  const [documentoSearchTerm, setDocumentoSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCredorForm, setShowCredorForm] = useState(false)
  const [editingProcessoId, setEditingProcessoId] = useState<string | null>(null)
  const [editingCredorId, setEditingCredorId] = useState<string | null>(null)
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null)
  const [loadingDocumentosGlobais, setLoadingDocumentosGlobais] = useState(false)
  const [processoFieldErrors, setProcessoFieldErrors] = useState<ProcessoFieldErrors>({})
  const [saving, setSaving] = useState(false)

  const {
    clearDocumentosProcesso,
    documentosProcesso,
    handleDeleteDocumento,
    handleDownloadDocumento,
    handleUploadDocumento,
    loadingDocumentos,
    savingDocumento,
  } = useDocumentosProcesso({
    onAuthRequired: () => setShowLogin(true),
    processoId: selectedProcessoId,
    setStatusMessage,
    token,
  })

  const filteredProcessos = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return processos
    }

    return processos.filter((item) =>
      [item.empresa, item.numeroProcesso, item.cnpj]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    )
  }, [processos, searchTerm])

  const totals = useMemo(() => {
    const totalCredores = processos.reduce((sum, item) => sum + getCredoresCount(item), 0)
    const passivoSujeito = processos.reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)

    return {
      processosAtivos: processos.filter((item) => !item.status.toLowerCase().includes('encerrado')).length,
      totalCredores,
      valorTotal: passivoSujeito,
    }
  }, [processos])

  const selectedProcesso = useMemo(
    () => processos.find((item) => item.id === selectedProcessoId) ?? null,
    [processos, selectedProcessoId],
  )

  const filteredCredores = useMemo(() => {
    const normalizedSearch = credorSearchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return credores
    }

    return credores.filter((item) =>
      [item.nome, item.documento, item.processoNome, item.numeroProcesso]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    )
  }, [credorSearchTerm, credores])

  const filteredDocumentos = useMemo(() => {
    const normalizedSearch = documentoSearchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return documentos
    }

    return documentos.filter((documento) =>
      [documento.nome, documento.nomeArquivo, documento.processoNome, documento.processoNumero, documento.tipo]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    )
  }, [documentoSearchTerm, documentos])

  function mapProcessoFieldErrors(errors: string[]) {
    const allowedFields: Record<string, keyof ProcessoFieldErrors> = {
      abertura: 'abertura',
      administradorjudicial: 'administradorJudicial',
      cnpj: 'cnpj',
      comarca: 'comarca',
      empresa: 'empresa',
      juizresponsavel: 'juizResponsavel',
      numeroprocesso: 'numeroProcesso',
      status: 'status',
      vara: 'vara',
    }

    return errors.reduce<ProcessoFieldErrors>((acc, error) => {
      const separatorIndex = error.indexOf(':')

      if (separatorIndex <= 0) {
        return acc
      }

      const rawField = error.slice(0, separatorIndex).trim()
      const rawFieldName = rawField.split('.').pop() ?? rawField
      const field = allowedFields[rawFieldName.replace(/[^a-zA-Z]/g, '').toLowerCase()]
      const message = error.slice(separatorIndex + 1).trim()

      if (field) {
        acc[field] = message || error
      }

      return acc
    }, {})
  }

  function clearProcessoFieldError(field: keyof ProcessoFieldErrors) {
    setProcessoFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  useEffect(() => {
    if (!token) {
      return
    }

    void carregarProcessos(token)
    void carregarCredores(token)
  }, [token])

  useEffect(() => {
    if (!token || activeView !== 'documentos') {
      return
    }

    void carregarDocumentosGlobais()
  }, [activeView, processos, token])

  async function carregarProcessos(currentToken = token) {
    if (!currentToken) {
      return
    }

    try {
      const lista = await listarProcessos(currentToken)
      setProcessos(lista)
      setStatusMessage('Processos carregados com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao listar processos.'
      setStatusMessage(message)
    }
  }

  async function carregarCredores(currentToken = token) {
    if (!currentToken) {
      return
    }

    try {
      const lista = await listarCredores(currentToken)
      setCredores(lista)
    } catch {
      setCredores([])
    }
  }

  async function carregarDocumentosGlobais() {
    if (!token) {
      return
    }

    setLoadingDocumentosGlobais(true)
    try {
      const listas = await Promise.all(
        processos.map(async (processoAtual) => {
          const documentosProcessoAtual = await listarDocumentosProcesso(token, processoAtual.id)

          return documentosProcessoAtual.map((documento) => ({
            ...documento,
            processoNome: processoAtual.empresa,
            processoNumero: processoAtual.numeroProcesso,
          }))
        }),
      )

      setDocumentos(listas.flat())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao listar documentos.'
      setDocumentos([])
      setStatusMessage(message)
    } finally {
      setLoadingDocumentosGlobais(false)
    }
  }

  async function handleDownloadDocumentoGlobal(documento: DocumentoProcessoListItem) {
    if (!token) {
      setStatusMessage('Faca login para baixar documentos.')
      setShowLogin(true)
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

  async function handleSubmitProcesso(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      setStatusMessage('Faca login para salvar processos no backend.')
      setShowLogin(true)
      return
    }

    setSaving(true)
    setProcessoFieldErrors({})
    try {
      const saved = editingProcessoId
        ? await atualizarProcesso(token, editingProcessoId, processo)
        : await criarProcesso(token, processo)

      setProcessos((current) =>
        editingProcessoId ? current.map((item) => (item.id === editingProcessoId ? saved : item)) : [saved, ...current],
      )
      setProcesso(emptyProcesso)
      setEditingProcessoId(null)
      setProcessoFieldErrors({})
      setShowCreateForm(false)
      setStatusMessage(`Processo ${saved.numeroProcesso} ${editingProcessoId ? 'atualizado' : 'cadastrado'}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar processo.'
      if (error instanceof ApiError || (typeof error === 'object' && error !== null && 'errors' in error)) {
        const apiErrors = error instanceof ApiError ? error.errors : ((error as { errors?: string[] }).errors ?? [])
        setProcessoFieldErrors(mapProcessoFieldErrors(apiErrors))
      }
      setStatusMessage(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProcesso(id: string) {
    if (!token) {
      setStatusMessage('Faca login para remover processos no backend.')
      setShowLogin(true)
      return
    }

    setSaving(true)
    try {
      await removerProcesso(token, id)
      setProcessos((current) => current.filter((item) => item.id !== id))
      if (selectedProcessoId === id) {
        setSelectedProcessoId(null)
      }
      setStatusMessage('Processo removido com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao remover processo.'
      setStatusMessage(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateTimeline(timeline: EventoTimeline[]) {
    if (!token || !selectedProcesso) {
      setStatusMessage('Faca login para salvar a timeline no backend.')
      setShowLogin(true)
      return
    }

    setSaving(true)
    try {
      const saved = await atualizarTimelineProcesso(token, selectedProcesso.id, timeline)
      setProcessos((current) => current.map((item) => (item.id === saved.id ? saved : item)))
      setStatusMessage('Timeline atualizada com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar timeline.'
      setStatusMessage(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitCredor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      setStatusMessage('Faca login para salvar credores no backend.')
      setShowLogin(true)
      return
    }

    setSaving(true)
    try {
      const previousCredor = editingCredorId ? credores.find((item) => item.id === editingCredorId) : null
      const saved = editingCredorId
        ? await atualizarCredor(token, editingCredorId, credor)
        : await criarCredor(token, credor)
      const processoSelecionado = processos.find((item) => item.id === credor.processoId)
      const savedWithProcesso = {
        ...saved,
        processoNome: processoSelecionado?.empresa ?? saved.processoNome,
      }

      setCredores((current) =>
        editingCredorId
          ? current.map((item) => (item.id === editingCredorId ? savedWithProcesso : item))
          : [savedWithProcesso, ...current],
      )
      setProcessos((current) =>
        current.map((item) => {
          const movedFromProcesso = previousCredor?.processoId && previousCredor.processoId !== credor.processoId

          if (movedFromProcesso && item.id === previousCredor.processoId) {
            return adjustProcessoCredores(item, -1)
          }

          if (!editingCredorId && item.id === credor.processoId) {
            return adjustProcessoCredores(item, 1, saved)
          }

          if (movedFromProcesso && item.id === credor.processoId) {
            return adjustProcessoCredores(item, 1, saved)
          }

          if (editingCredorId && item.id === credor.processoId && Array.isArray(item.credores)) {
            return {
              ...item,
              credores: item.credores.map((credorDoProcesso) =>
                credorDoProcesso.id === editingCredorId ? saved : credorDoProcesso,
              ),
            }
          }

          return item
        }),
      )
      setCredor(emptyCredor)
      setEditingCredorId(null)
      setShowCredorForm(false)
      setStatusMessage(`Credor ${saved.nome} ${editingCredorId ? 'atualizado' : 'cadastrado'}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar credor.'
      setStatusMessage(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleImportCredores(items: CredorForm[]) {
    if (!token) {
      setStatusMessage('Faca login para importar credores.')
      setShowLogin(true)
      return 0
    }

    setSaving(true)
    try {
      const response = await importarCredores(token, items)
      await Promise.all([carregarCredores(token), carregarProcessos(token)])
      setStatusMessage(`${response.totalImportados} credores importados com sucesso.`)
      return response.totalImportados
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao importar credores.'
      setStatusMessage(message)
      throw error
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteCredor(item: Credor) {
    if (!token) {
      setStatusMessage('Faca login para remover credores no backend.')
      setShowLogin(true)
      return
    }

    setSaving(true)
    try {
      await removerCredor(token, item.id)
      setCredores((current) => current.filter((credorAtual) => credorAtual.id !== item.id))
      setProcessos((current) =>
        current.map((processoAtual) =>
          processoAtual.id === item.processoId ? adjustProcessoCredores(processoAtual, -1) : processoAtual,
        ),
      )
      setStatusMessage('Credor removido com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao remover credor.'
      setStatusMessage(message)
    } finally {
      setSaving(false)
    }
  }

  function adjustProcessoCredores(processoAtual: Processo, amount: 1 | -1, credorAtualizado?: Credor): Processo {
    if (Array.isArray(processoAtual.credores)) {
      if (amount > 0 && credorAtualizado) {
        return { ...processoAtual, credores: [...processoAtual.credores, credorAtualizado] }
      }

      return {
        ...processoAtual,
        credores: processoAtual.credores.slice(0, Math.max(0, processoAtual.credores.length - 1)),
      }
    }

    return {
      ...processoAtual,
      credores: Math.max(0, (processoAtual.credores ?? 0) + amount),
    }
  }

  function handleEditCredor(item: Credor) {
    setCredor({
      documento: item.documento,
      nome: item.nome,
      processoId: item.processoId ?? '',
      status: item.status as CredorForm['status'],
      tipo: (item.tipo ?? 'QUIROGRAFARIO') as CredorForm['tipo'],
      valor: item.valor,
    })
    setEditingCredorId(item.id)
    setShowCredorForm(true)
    setActiveView('credores')
  }

  function handleNewCredor() {
    setCredor(emptyCredor)
    setEditingCredorId(null)
    setShowCredorForm(true)
  }

  function handleChangeView(view: AppView) {
    setActiveView(view)
    setSelectedProcessoId(null)
    clearDocumentosProcesso()
  }

  function handleCloseCredorModal() {
    setShowCredorForm(false)
    setEditingCredorId(null)
    setCredor(emptyCredor)
  }

  function handleEditProcesso(item: Processo) {
    setProcessoFieldErrors({})
    setProcesso({
      numeroProcesso: item.numeroProcesso,
      empresa: item.empresa,
      cnpj: item.cnpj ?? '',
      vara: item.vara,
      juizResponsavel: item.juizResponsavel ?? '',
      comarca: item.comarca ?? '',
      administradorJudicial: item.administradorJudicial ?? '',
      abertura: getAbertura(item) ?? '',
      status: item.status,
      timeline: item.timeline ?? [],
    })
    setEditingProcessoId(item.id)
    setShowCreateForm(true)
    setSelectedProcessoId(null)
    setActiveView('processos')
  }

  function handleNewProcesso() {
    setProcessoFieldErrors({})
    setProcesso(emptyProcesso)
    setEditingProcessoId(null)
    setSelectedProcessoId(null)
    setShowCreateForm((current) => !current)
  }

  function handleCloseProcessoModal() {
    setShowCreateForm(false)
    setEditingProcessoId(null)
    setProcessoFieldErrors({})
  }

  function handleLogout() {
    handleAuthLogout()
    setProcessos([])
    setCredores([])
    setDocumentos([])
    clearDocumentosProcesso()
    setSelectedProcessoId(null)
    setShowCredorForm(false)
    setEditingCredorId(null)
    setShowLogin(true)
    setStatusMessage('Sessao finalizada.')
  }

  if (showLogin) {
    return (
      <LoginPage
        email={email}
        loading={authLoading}
        onEmailChange={setEmail}
        onLogin={handleLogin}
        onSenhaChange={setSenha}
        senha={senha}
        statusMessage={statusMessage}
      />
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar activeView={activeView} onChangeView={handleChangeView} onLogout={handleLogout} usuario={usuario} />

      <main className="dashboard-main" id={activeView}>
        {activeView === 'dashboard' ? (
          <DashboardPage
            onSelectProcesso={(item) => {
              setSelectedProcessoId(item.id)
              setActiveView('processos')
            }}
            onViewAllProcessos={() => handleChangeView('processos')}
            processos={processos}
            totals={totals}
          />
        ) : null}

        {activeView === 'processos' && selectedProcesso ? (
          <ProcessoDetailPage
            documentos={documentosProcesso}
            loadingDocumentos={loadingDocumentos}
            onBack={() => setSelectedProcessoId(null)}
            onDeleteCredor={(item) => void handleDeleteCredor(item)}
            onDeleteDocumento={(item) => void handleDeleteDocumento(item)}
            onDownloadDocumento={(item) => void handleDownloadDocumento(item)}
            onEditCredor={handleEditCredor}
            onUpdateTimeline={(timeline) => void handleUpdateTimeline(timeline)}
            onUploadDocumento={(item) => void handleUploadDocumento(item)}
            processo={selectedProcesso}
            saving={saving || savingDocumento}
            statusMessage={statusMessage}
          />
        ) : null}

        {activeView === 'processos' && !selectedProcesso ? (
          <ProcessosPage
            editingProcessoId={editingProcessoId}
            fieldErrors={processoFieldErrors}
            filteredProcessos={filteredProcessos}
            onDeleteProcesso={(id) => void handleDeleteProcesso(id)}
            onEditProcesso={handleEditProcesso}
            onFieldErrorClear={clearProcessoFieldError}
            onNewProcesso={handleNewProcesso}
            onProcessoChange={setProcesso}
            onSearchChange={setSearchTerm}
            onSelectProcesso={(item) => setSelectedProcessoId(item.id)}
            onSubmitProcesso={handleSubmitProcesso}
            onToggleModal={(open) => (open ? setShowCreateForm(true) : handleCloseProcessoModal())}
            processo={processo}
            saving={saving}
            searchTerm={searchTerm}
            showCreateForm={showCreateForm}
            statusMessage={statusMessage}
          />
        ) : null}

        {activeView === 'credores' ? (
          <CredoresPage
            credor={credor}
            credores={filteredCredores}
            editingCredorId={editingCredorId}
            onCredorChange={setCredor}
            onDeleteCredor={(item) => void handleDeleteCredor(item)}
            onEditCredor={handleEditCredor}
            onImportCredores={handleImportCredores}
            onNewCredor={handleNewCredor}
            onSearchChange={setCredorSearchTerm}
            onSubmitCredor={handleSubmitCredor}
            onToggleModal={(open) => (open ? setShowCredorForm(true) : handleCloseCredorModal())}
            processos={processos}
            saving={saving}
            searchTerm={credorSearchTerm}
            showCredorForm={showCredorForm}
            statusMessage={statusMessage}
          />
        ) : null}

        {activeView === 'documentos' ? (
          <DocumentosPage
            documentos={filteredDocumentos}
            loading={loadingDocumentosGlobais}
            onDownloadDocumento={(item) => void handleDownloadDocumentoGlobal(item)}
            onViewDocumento={(item) => {
              setSelectedProcessoId(item.processoId)
              setActiveView('processos')
            }}
            onSearchChange={setDocumentoSearchTerm}
            searchTerm={documentoSearchTerm}
          />
        ) : null}

        {activeView === 'relatorios' ? <RelatoriosPage credores={credores} processos={processos} /> : null}
      </main>
    </div>
  )
}
