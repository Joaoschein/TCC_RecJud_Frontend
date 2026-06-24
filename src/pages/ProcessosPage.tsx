import type { FormEvent } from 'react'
import type { Processo, ProcessoForm } from '../types'
import { IconPlus, IconSearch } from '../components/Icons'
import { ProcessoModal } from '../components/ProcessoModal'
import { formatDate, formatFullCurrency, getAbertura, getCredoresCount, statusClass } from '../utils/processos'

type ProcessosPageProps = {
  editingProcessoId: string | null
  filteredProcessos: Processo[]
  onDeleteProcesso: (id: string) => void
  onEditProcesso: (processo: Processo) => void
  onNewProcesso: () => void
  onProcessoChange: (processo: ProcessoForm) => void
  onSearchChange: (value: string) => void
  onSubmitProcesso: (event: FormEvent<HTMLFormElement>) => void
  onToggleModal: (open: boolean) => void
  processo: ProcessoForm
  saving: boolean
  searchTerm: string
  showCreateForm: boolean
  statusMessage: string
}

export function ProcessosPage({
  editingProcessoId,
  filteredProcessos,
  onDeleteProcesso,
  onEditProcesso,
  onNewProcesso,
  onProcessoChange,
  onSearchChange,
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
          <article className="all-process-card" key={item.id}>
            <div className="all-process-content">
              <h2>{item.empresa}</h2>
              <p>{item.numeroProcesso}</p>
              <p>CNPJ: {item.cnpj ?? 'Nao informado'}</p>
              <div className="process-details">
                <span>
                  <strong>Fase:</strong> {item.vara}
                </span>
                <span>
                  <strong>Valor:</strong> {formatFullCurrency(item.valorTotal)}
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
              <span className={`status-pill ${statusClass(item.status)}`}>{item.status}</span>
              <div className="process-actions">
                <button onClick={() => onEditProcesso(item)} type="button">
                  Editar
                </button>
                <button disabled={saving} onClick={() => onDeleteProcesso(item.id)} type="button">
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
          onClose={() => onToggleModal(false)}
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
