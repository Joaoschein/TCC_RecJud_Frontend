import type { AppView, Usuario } from '../types'
import { IconDashboard, IconDocument, IconUsers } from './Icons'

type SidebarProps = {
  activeView: AppView
  onChangeView: (view: AppView) => void
  onLogout: () => void
  usuario: Usuario | null
}

export function Sidebar({ activeView, onChangeView, onLogout, usuario }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">RJ</span>
        <div>
          <strong>RecJud</strong>
          <span>Recuperacao Judicial</span>
        </div>
      </div>

      <nav className="nav-menu" aria-label="Menu principal">
        <button
          className={`nav-item ${activeView === 'dashboard' ? 'nav-item-active' : ''}`}
          onClick={() => onChangeView('dashboard')}
          type="button"
        >
          <IconDashboard />
          Dashboard
        </button>
        <button
          className={`nav-item ${activeView === 'processos' ? 'nav-item-active' : ''}`}
          onClick={() => onChangeView('processos')}
          type="button"
        >
          <IconDocument />
          Processos
        </button>
        <button
          className={`nav-item ${activeView === 'credores' ? 'nav-item-active' : ''}`}
          onClick={() => onChangeView('credores')}
          type="button"
        >
          <IconUsers />
          Credores
        </button>
      </nav>

      <button className="logout-button" onClick={onLogout} type="button">
        {usuario ? 'Sair' : 'Entrar'}
      </button>
    </aside>
  )
}
