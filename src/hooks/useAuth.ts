import { useEffect, useState } from 'react'
import { AUTH_EXPIRED_EVENT } from '../services/api'
import type { FormEvent } from 'react'
import { login, TOKEN_KEY, USER_KEY } from '../services/authService'
import type { Usuario } from '../types'

export function useAuth() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const rawUser = localStorage.getItem(USER_KEY)
    try {
      return rawUser ? (JSON.parse(rawUser) as Usuario) : null
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  })
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showLogin, setShowLogin] = useState(() => !localStorage.getItem(TOKEN_KEY))
  const [authLoading, setAuthLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('API pronta para conectar.')

  useEffect(() => {
    function expireSession() {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setToken('')
      setUsuario(null)
      setShowLogin(true)
      setStatusMessage('Sessao expirada. Faca login novamente.')
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession)
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthLoading(true)
    try {
      const auth = await login(email, senha)

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
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken('')
    setUsuario(null)
    setShowLogin(true)
    setStatusMessage('Sessao finalizada.')
  }

  return {
    authLoading,
    email,
    handleLogin,
    handleLogout,
    senha,
    setEmail,
    setSenha,
    setShowLogin,
    setStatusMessage,
    showLogin,
    statusMessage,
    token,
    usuario,
  }
}
