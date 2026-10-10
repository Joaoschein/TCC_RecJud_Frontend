import type { AuthResponse } from '../types'
import { apiRequest } from './api'

export const TOKEN_KEY = 'rj-system.token'
export const USER_KEY = 'rj-system.user'

export function login(email: string, senha: string) {
  return apiRequest<AuthResponse>('/api/auth/login', undefined, {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })
}
