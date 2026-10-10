export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
export const AUTH_EXPIRED_EVENT = 'rj-system:auth-expired'

export class ApiError extends Error {
  errors: string[]
  status: number

  constructor(message: string, status: number, errors: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export async function parseApiError(response: Response, token?: string) {
  if (response.status === 401 && token && localStorage.getItem('rj-system.token') === token) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
  }
  let message = 'Nao foi possivel completar a requisicao.'
  let errors: string[] = []

  try {
    const body = (await response.json()) as { details?: string[]; message?: string; errors?: string[] }
    errors = (body.errors ?? body.details ?? []).filter(Boolean)
    const details = errors.join(', ')
    message = [body.message, details].filter(Boolean).join(': ') || message
  } catch {
    message = response.statusText || message
  }

  return new ApiError(message, response.status, errors)
}

export async function apiRequest<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)

  if (!(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    throw await parseApiError(response, token)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
