import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Sidebar } from './components/Sidebar'
import { emptyCredor } from './data/credores'
import { emptyProcesso } from './data/processos'
import { CredoresPage } from './pages/CredoresPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProcessosPage } from './pages/ProcessosPage'
import type { AppView, AuthResponse, Credor, CredorForm, Processo, ProcessoForm, Usuario } from './types'
import { toCredorPayload } from './utils/credores'
import { getAbertura, getCredoresCount, toProcessoPayload } from './utils/processos'
import './style.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const TOKEN_KEY = 'rj-system.token'
const USER_KEY = 'rj-system.user'

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const rawUser = localStorage.getItem(USER_KEY)
    return rawUser ? (JSON.parse(rawUser) as Usuario) : null
  })
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [processo, setProcesso] = useState<ProcessoForm>(emptyProcesso)
  const [credor, setCredor] = useState<CredorForm>(emptyCredor)
  const [processos, setProcessos] = useState<Processo[]>([])
  const [credores, setCredores] = useState<Credor[]>([])
  const [activeView, setActiveView] = useState<AppView>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [credorSearchTerm, setCredorSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCredorForm, setShowCredorForm] = useState(false)
  const [editingProcessoId, setEditingProcessoId] = useState<string | null>(null)
  const [editingCredorId, setEditingCredorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [statusMessage, setStatusMessage] = useState('API pronta para conectar.')

  const currentUser = usuario ?? {
    email: 'demo@recjud.local',
    id: 'demo',
    nome: 'RecJud',
    role: 'DEMO',
  }

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
    const valorTotal = processos.reduce((sum, item) => sum + (item.valorTotal ?? 0), 0)

    return {
      processosAtivos: processos.filter((item) => !item.status.toLowerCase().includes('encerrado')).length,
      totalCredores,
      valorTotal,
    }
  }, [processos])

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

  useEffect(() => {
    if (!token) {
      return
    }

    void carregarProcessos(token)
    void carregarCredores(token)
  }, [token])

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })

    if (!response.ok) {
      let message = 'Nao foi possivel completar a requisicao.'

      try {
        const body = (await response.json()) as { message?: string; errors?: string[] }
        message = body.message ?? body.errors?.join(', ') ?? message
      } catch {
        message = response.statusText || message
      }

      throw new Error(message)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  async function carregarProcessos(currentToken = token) {
    if (!currentToken) {
      return
    }

    setLoading(true)
    try {
      const lista = await request<Processo[]>('/api/processos', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })
      setProcessos(lista)
      setStatusMessage('Processos carregados com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao listar processos.'
      setStatusMessage(message)
    } finally {
      setLoading(false)
    }
  }

  async function carregarCredores(currentToken = token) {
    if (!currentToken) {
      return
    }

    try {
      const lista = await request<Credor[]>('/api/credores', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })
      setCredores(lista)
    } catch {
      setCredores([])
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    try {
      const auth = await request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      })

      localStorage.setItem(TOKEN_KEY, auth.accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(auth.usuario))
      setToken(auth.accessToken)
      setUsuario(auth.usuario)
      setShowLogin(false)
      setStatusMessage(`Sessao iniciada para ${auth.usuario.nome}.`)
      setEmail('')
      setSenha('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login.'
      setStatusMessage(message)
    } finally {
      setLoading(false)
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
    try {
      const payload = toProcessoPayload(processo)
      const saved = editingProcessoId
        ? await request<Processo>(`/api/processos/${editingProcessoId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await request<Processo>('/api/processos', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      setProcessos((current) =>
        editingProcessoId ? current.map((item) => (item.id === editingProcessoId ? saved : item)) : [saved, ...current],
      )
      setProcesso(emptyProcesso)
      setEditingProcessoId(null)
      setShowCreateForm(false)
      setStatusMessage(`Processo ${saved.numeroProcesso} ${editingProcessoId ? 'atualizado' : 'cadastrado'}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar processo.'
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
      await request<void>(`/api/processos/${id}`, {
        method: 'DELETE',
      })
      setProcessos((current) => current.filter((item) => item.id !== id))
      setStatusMessage('Processo removido com sucesso.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao remover processo.'
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
      const payload = toCredorPayload(credor)
      const saved = editingCredorId
        ? await request<Credor>(`/api/credores/${editingCredorId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await request<Credor>('/api/credores', {
            method: 'POST',
            body: JSON.stringify(payload),
          })
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

  async function handleDeleteCredor(item: Credor) {
    if (!token) {
      setStatusMessage('Faca login para remover credores no backend.')
      setShowLogin(true)
      return
    }

    setSaving(true)
    try {
      await request<void>(`/api/credores/${item.id}`, {
        method: 'DELETE',
      })
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

  function handleCloseCredorModal() {
    setShowCredorForm(false)
    setEditingCredorId(null)
    setCredor(emptyCredor)
  }

  function handleEditProcesso(item: Processo) {
    setProcesso({
      numeroProcesso: item.numeroProcesso,
      empresa: item.empresa,
      cnpj: item.cnpj ?? '',
      vara: item.vara,
      abertura: getAbertura(item) ?? '',
      valorTotal: item.valorTotal,
      status: item.status,
    })
    setEditingProcessoId(item.id)
    setShowCreateForm(true)
    setActiveView('processos')
  }

  function handleNewProcesso() {
    setProcesso(emptyProcesso)
    setEditingProcessoId(null)
    setShowCreateForm((current) => !current)
  }

  function handleCloseProcessoModal() {
    setShowCreateForm(false)
    setEditingProcessoId(null)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken('')
    setUsuario(null)
    setProcessos([])
    setCredores([])
    setShowCredorForm(false)
    setEditingCredorId(null)
    setShowLogin(true)
    setStatusMessage('Sessao finalizada.')
  }

  if (showLogin) {
    return (
      <LoginPage
        email={email}
        loading={loading}
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
      <Sidebar activeView={activeView} onChangeView={setActiveView} onLogout={handleLogout} usuario={usuario} />

      <main className="dashboard-main" id={activeView}>
        {activeView === 'dashboard' ? (
          <DashboardPage
            currentUser={currentUser}
            onViewAllProcessos={() => setActiveView('processos')}
            processos={processos}
            totals={totals}
            usuario={usuario}
          />
        ) : null}

        {activeView === 'processos' ? (
          <ProcessosPage
            editingProcessoId={editingProcessoId}
            filteredProcessos={filteredProcessos}
            onDeleteProcesso={(id) => void handleDeleteProcesso(id)}
            onEditProcesso={handleEditProcesso}
            onNewProcesso={handleNewProcesso}
            onProcessoChange={setProcesso}
            onSearchChange={setSearchTerm}
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
      </main>
    </div>
  )
}
