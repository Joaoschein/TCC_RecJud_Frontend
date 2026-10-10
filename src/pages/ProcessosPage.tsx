import type { FormEvent } from 'react'
import type { Processo, ProcessoFieldErrors, ProcessoForm } from '../types'
import { IconPlus, IconSearch } from '../components/Icons'
import { ProcessoModal } from '../components/ProcessoModal'
import {
  formatDate,
  formatFullCurrency,
  formatStatus,
  getAbertura,
  getCredoresCount,
  statusClass,
} from '../utils/processos'

type ProcessosPageProps = {
  editingProcessoId: string | null
  fieldErrors: ProcessoFieldErrors
  filteredProcessos: Processo[]
  onDeleteProcesso: (id: string) => void
  onEditProcesso: (processo: Processo) => void
  onFieldErrorClear: (field: keyof ProcessoFieldErrors) => void
  onNewProcesso: () => void
  onProcessoChange: (processo: ProcessoForm) => void
  onSearchChange: (value: string) => void
  onSelectProcesso: (processo: Processo) => void
  onSubmitProcesso: (event: FormEvent<HTMLFormElement>) => void
  onToggleModal: (open: boolean) => void
  processo: ProcessoForm
  saving: boolean
  searchTerm: string
  showCreateForm: boolean
  statusMessage: string
}

function getProximaDataTimeline(processo: Processo) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const proximoEvento = (processo.timeline ?? [])
    .filter((evento) => evento.status !== 'CUMPRIDO')
    .filter((evento) => {
      const eventDate = new Date(`${evento.data}T00:00:00`)

      return !Number.isNaN(eventDate.getTime()) && eventDate >= today
    })
    .sort((first, second) => first.data.localeCompare(second.data))[0]

  return proximoEvento ? `${proximoEvento.titulo} - ${formatDate(proximoEvento.data)}` : 'sem datas futuras'
}

export function ProcessosPage({
  editingProcessoId,
  fieldErrors,
  filteredProcessos,
  onDeleteProcesso,
  onEditProcesso,
  onFieldErrorClear,
  onNewProcesso,
  onProcessoChange,
  onSearchChange,
  onSelectProcesso,
  onSubmitProcesso,
  onToggleModal,
  processo,
  saving,
  searchTerm,
  showCreateForm,
  statusMessage,
}: ProcessosPageProps) {
  return (
    <>
      <header className="dashboard-header page-header">
        <div>
          <h1>Processos</h1>
          <p>Gerencie todos os processos de recuperacao judicial</p>
        </div>
        <button className="new-process-button" onClick={onNewProcesso} type="button">
          <IconPlus />
          Novo Processo
        </button>
      </header>

      <section className="process-toolbar" aria-label="Ferramentas de processos">
        <label className="search-field">
          <IconSearch />
          <input
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por empresa, numero do processo ou CNPJ..."
            type="search"
            value={searchTerm}
          />
        </label>
        </section>

      <section className="all-process-list" aria-label="Todos os processos cadastrados">
        {filteredProcessos.map((item) => (
          <article
            className="all-process-card all-process-card-clickable"
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
            <div className="all-process-content">
              <h2>{item.empresa}</h2>
              <p>{item.numeroProcesso}</p>
              <p>CNPJ: {item.cnpj ?? 'Nao informado'}</p>
              <div className="process-details">
                <span>
                  <strong>Proxima Data:</strong> {getProximaDataTimeline(item)}
                </span>
                <span>
                  <strong>Passivo Sujeito a Recuperacao Judicial:</strong> {formatFullCurrency(item.valorTotal)}
                </span>
                <span>
                  <strong>Credores:</strong> {getCredoresCount(item)}
                </span>
                <span>
                  <strong>Abertura:</strong> {formatDate(getAbertura(item))}
                </span>
              </div>
            </div>
            <div className="process-card-side">
              <span className={`status-pill ${statusClass(item.status)}`}>{formatStatus(item.status)}</span>
              <div className="process-actions">
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onEditProcesso(item)
                  }}
                  type="button"
                >
                  Editar
                </button>
                <button
                  disabled={saving}
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeleteProcesso(item.id)
                  }}
                  type="button"
                >
                  Excluir
                </button>
              </div>
            </div>
          </article>
        ))}

        {filteredProcessos.length === 0 ? (
          <div className="empty-process-list">Nenhum processo encontrado para a busca.</div>
        ) : null}
      </section>

      {showCreateForm ? (
        <ProcessoModal
          editingProcessoId={editingProcessoId}
          fieldErrors={fieldErrors}
          onClose={() => onToggleModal(false)}
          onFieldErrorClear={onFieldErrorClear}
          onProcessoChange={onProcessoChange}
          onSubmit={onSubmitProcesso}
          processo={processo}
          saving={saving}
          statusMessage={statusMessage}
        />
      ) : null}
    </>
  )
}
