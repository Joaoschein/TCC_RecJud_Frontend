import type { FormEvent } from 'react'

type LoginPageProps = {
  email: string
  loading: boolean
  onEmailChange: (value: string) => void
  onLogin: (event: FormEvent<HTMLFormElement>) => void
  onSenhaChange: (value: string) => void
  senha: string
  statusMessage: string
}

export function LoginPage({
  email,
  loading,
  onEmailChange,
  onLogin,
  onSenhaChange,
  senha,
  statusMessage,
}: LoginPageProps) {
  return (
    <div className="login-page">
      <main className="login-card">
        <div>
          <span className="brand-mark">RJ</span>
          <h1>RecJud</h1>
          <p>Recuperacao Judicial</p>
        </div>

        <form className="login-form" onSubmit={onLogin}>
          <label>
            E-mail
            <input
              autoComplete="email"
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="seuemail@exemplo.com"
              type="email"
              value={email}
            />
          </label>
          <label>
            Senha
            <input
              autoComplete="current-password"
              onChange={(event) => onSenhaChange(event.target.value)}
              placeholder="Digite sua senha"
              type="password"
              value={senha}
            />
          </label>
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? 'Entrando...' : 'Entrar no sistema'}
          </button>
          <span className="form-message">{statusMessage}</span>
        </form>
      </main>
    </div>
  )
}
