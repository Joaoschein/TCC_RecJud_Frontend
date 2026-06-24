import type { Processo, Usuario } from '../types'
import { IconCalendar, IconClock, IconDocument, IconTrend, IconUsers } from '../components/Icons'
import { MetricCard } from '../components/MetricCard'
import { formatDate, formatMetricCurrency, getAbertura, statusClass } from '../utils/processos'

type DashboardPageProps = {
  currentUser: Usuario
  onViewAllProcessos: () => void
  processos: Processo[]
  totals: {
    processosAtivos: number
    totalCredores: number
    valorTotal: number
  }
  usuario: Usuario | null
}

export function DashboardPage({ currentUser, onViewAllProcessos, processos, totals, usuario }: DashboardPageProps) {
  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visao geral dos processos de recuperacao judicial</p>
        </div>
        <div className="user-avatar" title={usuario?.nome}>
          {currentUser.nome.charAt(0).toUpperCase()}
        </div>
      </header>

      <section className="metric-grid" aria-label="Resumo dos processos">
        <MetricCard
          delta="Dados do banco"
          icon={<IconDocument />}
          label="Processos Ativos"
          tone="blue"
          value={String(totals.processosAtivos)}
        />
        <MetricCard
          delta="Dados do banco"
          icon={<IconUsers />}
          label="Total de Credores"
          tone="green"
          value={String(totals.totalCredores)}
        />
        <MetricCard
          delta="Dados do banco"
          icon={<IconTrend />}
          label="Valor Total"
          tone="purple"
          value={formatMetricCurrency(totals.valorTotal)}
        />
      </section>

      <section className="process-panel">
        <div className="section-head">
          <h2>Processos Recentes</h2>
          <button className="link-button" onClick={onViewAllProcessos} type="button">
            Ver todos
          </button>
        </div>

        <div className="process-list">
          {processos.slice(0, 3).map((item) => (
            <article className="process-card" key={item.id}>
              <div className="process-primary">
                <h3>{item.empresa}</h3>
                <p>{item.numeroProcesso}</p>
                <span>
                  <IconClock />
                  {item.eventoAtual ?? item.vara}
                </span>
              </div>
              <div className="process-meta">
                <span className={`status-pill ${statusClass(item.status)}`}>{item.status}</span>
                <span className="date-pill">
                  <IconCalendar />
                  {formatDate(item.dataEvento ?? getAbertura(item))}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
