import type { EventoTimeline, Processo } from '../types'
import { IconAlert, IconCalendar, IconCheck, IconClock, IconDocument, IconTrend, IconUsers } from '../components/Icons'
import { MetricCard } from '../components/MetricCard'
import { formatDate, formatMetricCurrency, getAbertura, statusClass } from '../utils/processos'

type DashboardPageProps = {
  onSelectProcesso: (processo: Processo) => void
  onViewAllProcessos: () => void
  processos: Processo[]
  totals: {
    processosAtivos: number
    totalCredores: number
    valorTotal: number
  }
}

type ProximaAtividade = {
  evento: EventoTimeline
  processo: Processo
  status: 'near' | 'overdue' | 'pending'
}

function getActivityStatus(evento: EventoTimeline): ProximaAtividade['status'] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(`${evento.data}T00:00:00`)
  const diffInDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000)

  if (diffInDays < 0) {
    return 'overdue'
  }

  if (diffInDays <= 15) {
    return 'near'
  }

  return 'pending'
}

function getProximasAtividades(processos: Processo[]) {
  return processos
    .flatMap((processo) =>
      (processo.timeline ?? [])
        .filter((evento) => evento.status !== 'CUMPRIDO')
        .map((evento) => ({
          evento,
          processo,
          status: getActivityStatus(evento),
        })),
    )
    .sort((first, second) => first.evento.data.localeCompare(second.evento.data))
    .slice(0, 4)
}

export function DashboardPage({
  onSelectProcesso,
  onViewAllProcessos,
  processos,
  totals,
}: DashboardPageProps) {
  const proximasAtividades = getProximasAtividades(processos)

  return (
    <>
      <header className="dashboard-header">
        <div>
          <p>Visao geral dos processos de recuperacao judicial</p>
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
          label="Passivo Sujeito a Recuperacao Judicial"
          tone="purple"
          value={formatMetricCurrency(totals.valorTotal)}
        />
      </section>

      <div className="dashboard-content-grid">
        <section className="process-panel">
          <div className="section-head">
            <h2>Processos Recentes</h2>
            <button className="link-button" onClick={onViewAllProcessos} type="button">
              Ver todos
            </button>
          </div>

          <div className="process-list">
            {processos.slice(0, 3).map((item) => (
              <article
                className="process-card process-card-clickable"
                key={item.id}
                onClick={() => onSelectProcesso(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectProcesso(item)
                  }
                }}
                role="button"
                tabIndex={0}
              >
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

        <section className="upcoming-panel" aria-labelledby="proximas-atividades">
          <div className="section-head">
            <h2 id="proximas-atividades">Proximas Atividades</h2>
          </div>

          {proximasAtividades.length === 0 ? (
            <div className="empty-process-list">Nenhum prazo pendente nas timelines.</div>
          ) : (
            <div className="upcoming-list">
              {proximasAtividades.map(({ evento, processo, status }) => (
                <article className={`upcoming-card upcoming-card-${status}`} key={`${processo.id}-${evento.id}`}>
                  <span className="upcoming-icon">
                    {status === 'overdue' ? <IconAlert /> : null}
                    {status === 'near' ? <IconClock /> : null}
                    {status === 'pending' ? <IconCheck /> : null}
                  </span>
                  <div>
                    <h3>
                      {evento.titulo} - {processo.empresa}
                    </h3>
                    <p>
                      <IconCalendar />
                      {formatDate(evento.data)}
                    </p>
                    <span>{evento.descricao || 'Prazo'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
