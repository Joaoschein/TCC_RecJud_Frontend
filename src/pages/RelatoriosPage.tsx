import { useMemo, useState } from 'react'
import { IconChevronDown, IconDownload, IconTrend } from '../components/Icons'
import type { Credor, Processo } from '../types'
import { formatFullCurrency, getAbertura, getCredoresCount } from '../utils/processos'

type RelatoriosPageProps = {
  credores: Credor[]
  processos: Processo[]
}

type ChartItem = {
  color: string
  label: string
  value: number
  valueLabel: string
}

const creditorTypeLabels: Record<string, string> = {
  GARANTIA_REAL: 'Garantia Real',
  ME_EPP: 'ME/EPP',
  QUIROGRAFARIO: 'Quirografario',
  TRABALHISTA: 'Trabalhista',
}

const statusLabels: Record<string, string> = {
  AGUARDANDO_APROVACAO: 'Aguardando',
  APROVADO: 'Aprovado',
  EM_ANDAMENTO: 'Em andamento',
}

const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatMonths(value: number) {
  return `${value.toFixed(1)} meses`
}

function getProcessYear(processo: Processo) {
  const sourceDate = getAbertura(processo) ?? processo.dataEvento

  if (!sourceDate) {
    return null
  }

  const year = new Date(`${sourceDate}T00:00:00`).getFullYear()

  return Number.isNaN(year) ? null : year
}

function getMonthsSince(value?: string) {
  if (!value) {
    return 0
  }

  const start = new Date(`${value}T00:00:00`)

  if (Number.isNaN(start.getTime())) {
    return 0
  }

  const now = new Date()
  const months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth()

  return Math.max(0, months)
}

function buildConicGradient(items: ChartItem[]) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  if (!total) {
    return '#e5e7eb'
  }

  let current = 0

  return items
    .map((item) => {
      const start = current
      const size = (item.value / total) * 100
      current += size

      return `${item.color} ${start}% ${current}%`
    })
    .join(', ')
}

function ReportMetricCard({
  description,
  label,
  tone,
  value,
}: {
  description: string
  label: string
  tone: 'blue' | 'green' | 'orange' | 'purple'
  value: string
}) {
  return (
    <article className="report-metric-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{description}</span>
      </div>
      <div className={`report-metric-icon report-metric-icon-${tone}`}>
        <IconTrend />
      </div>
    </article>
  )
}

function PieChart({ items, title }: { items: ChartItem[]; title: string }) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const gradient = buildConicGradient(items)

  return (
    <section className="report-chart-card" aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>
      <h2 id={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>{title}</h2>

      <div className="report-chart-area">
        {total > 0 ? (
          <div className="report-pie-wrap">
            {items.map((item, index) => {
              const percent = (item.value / total) * 100
              const pieValue = item.valueLabel.includes('R$') ? `${percent.toFixed(0)}%` : String(item.value)

              return (
                <span className={`report-pie-label report-pie-label-${index + 1}`} key={item.label}>
                  {item.label}: {pieValue}
                </span>
              )
            })}
            <div className="report-pie" style={{ background: `conic-gradient(${gradient})` }} />
          </div>
        ) : (
          <div className="report-empty-chart">Sem dados para o periodo.</div>
        )}
      </div>

      <div className="report-legend">
        {items.map((item) => (
          <div className="report-legend-row" key={item.label}>
            <span>
              <i style={{ background: item.color }} />
              {item.label}
            </span>
            <strong>{item.valueLabel}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RelatoriosPage({ credores, processos }: RelatoriosPageProps) {
  const years = useMemo(() => {
    const processYears = processos.map(getProcessYear).filter((year): year is number => year !== null)
    const currentYear = new Date().getFullYear()
    const uniqueYears = Array.from(new Set([currentYear, ...processYears]))

    return uniqueYears.sort((first, second) => second - first)
  }, [processos])

  const [selectedYear, setSelectedYear] = useState(String(years[0] ?? new Date().getFullYear()))

  const report = useMemo(() => {
    const yearNumber = Number(selectedYear)
    const filteredProcessos = processos.filter((processo) => {
      const year = getProcessYear(processo)

      return year === yearNumber || year === null
    })
    const filteredProcessoIds = new Set(filteredProcessos.map((processo) => processo.id))
    const filteredCredores = credores.filter((credor) => !credor.processoId || filteredProcessoIds.has(credor.processoId))
    const approvedProcessos = filteredProcessos.filter((processo) => processo.status === 'APROVADO')
    const totalValue = filteredProcessos.reduce((sum, processo) => sum + (processo.valorTotal ?? 0), 0)
    const approvedValue = approvedProcessos.reduce((sum, processo) => sum + (processo.valorTotal ?? 0), 0)
    const totalCredores = filteredProcessos.reduce((sum, processo) => sum + getCredoresCount(processo), 0)
    const creditorCount = filteredCredores.length || totalCredores
    const approvalRate = filteredProcessos.length ? (approvedProcessos.length / filteredProcessos.length) * 100 : 0
    const recoveryRate = totalValue ? (approvedValue / totalValue) * 100 : 0
    const averageCreditors = filteredProcessos.length ? creditorCount / filteredProcessos.length : 0
    const averageMonths = filteredProcessos.length
      ? filteredProcessos.reduce((sum, processo) => sum + getMonthsSince(getAbertura(processo)), 0) / filteredProcessos.length
      : 0

    const creditorDistributionSource = filteredCredores.length
      ? filteredCredores
      : filteredProcessos.flatMap((processo) => (Array.isArray(processo.credores) ? processo.credores : []))

    const creditorDistribution = Object.entries(
      creditorDistributionSource.reduce<Record<string, { count: number; value: number }>>((acc, credor) => {
        const key = credor.tipo ?? 'QUIROGRAFARIO'
        acc[key] = acc[key] ?? { count: 0, value: 0 }
        acc[key].count += 1
        acc[key].value += credor.valor ?? 0

        return acc
      }, {}),
    ).map(([key, item], index) => ({
      color: chartColors[index % chartColors.length],
      label: creditorTypeLabels[key] ?? key,
      value: item.count,
      valueLabel: formatFullCurrency(item.value),
    }))

    const statusDistribution = Object.entries(
      filteredProcessos.reduce<Record<string, number>>((acc, processo) => {
        acc[processo.status] = (acc[processo.status] ?? 0) + 1

        return acc
      }, {}),
    ).map(([key, value], index) => ({
      color: chartColors[index % chartColors.length],
      label: statusLabels[key] ?? key,
      value,
      valueLabel: `${value} ${value === 1 ? 'processo' : 'processos'}`,
    }))

    return {
      approvalRate,
      averageCreditors,
      averageMonths,
      creditorDistribution,
      filteredProcessos,
      recoveryRate,
      statusDistribution,
    }
  }, [credores, processos, selectedYear])

  function handleExportPdf() {
    window.print()
  }

  return (
    <>
      <header className="dashboard-header page-header report-header">
        <div>
          <h1>Relatorios</h1>
          <p>Analises e estatisticas dos processos de recuperacao judicial</p>
        </div>
        <div className="report-actions">
          <label className="report-year-select">
            <select onChange={(event) => setSelectedYear(event.target.value)} value={selectedYear}>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <IconChevronDown />
          </label>
          <button className="tool-button" onClick={handleExportPdf} type="button">
            <IconDownload />
            Exportar PDF
          </button>
        </div>
      </header>

      <section className="report-metric-grid" aria-label="Indicadores dos relatorios">
        <ReportMetricCard
          description={`${report.filteredProcessos.filter((processo) => processo.status === 'APROVADO').length} de ${
            report.filteredProcessos.length
          } processos concluidos`}
          label="Taxa de Aprovacao"
          tone="green"
          value={formatPercent(report.approvalRate)}
        />
        <ReportMetricCard
          description="Do pedido a homologacao"
          label="Tempo Medio"
          tone="blue"
          value={formatMonths(report.averageMonths)}
        />
        <ReportMetricCard
          description="Valor medio recuperado"
          label="Taxa de Recuperacao"
          tone="purple"
          value={formatPercent(report.recoveryRate)}
        />
        <ReportMetricCard
          description="Media de credores"
          label="Credores por Processo"
          tone="orange"
          value={report.averageCreditors.toFixed(1)}
        />
      </section>

      <div className="report-chart-grid">
        <PieChart items={report.creditorDistribution} title="Distribuicao por Tipo de Credor" />
        <PieChart items={report.statusDistribution} title="Status dos Processos" />
      </div>
    </>
  )
}
