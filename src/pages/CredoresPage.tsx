import type { FormEvent } from 'react'
import { CredorModal } from '../components/CredorModal'
import type { Credor, CredorForm, Processo } from '../types'
import { IconPlus, IconSearch, IconUsers } from '../components/Icons'
import { formatDate, formatFullCurrency } from '../utils/processos'
import {
  credorProcessoLabel,
  credorStatusClass,
  credorStatusLabel,
  credorTipoClass,
  credorTipoLabel,
} from '../utils/credores'

type CredoresPageProps = {
  credor: CredorForm
  credores: Credor[]
  editingCredorId: string | null
  onDeleteCredor: (credor: Credor) => void
  onEditCredor: (credor: Credor) => void
  onNewCredor: () => void
  onCredorChange: (credor: CredorForm) => void
  onSearchChange: (value: string) => void
  onSubmitCredor: (event: FormEvent<HTMLFormElement>) => void
  onToggleModal: (open: boolean) => void
  processos: Processo[]
  saving: boolean
  searchTerm: string
  showCredorForm: boolean
  statusMessage: string
}

export function CredoresPage({
  credor,
  credores,
  editingCredorId,
  onDeleteCredor,
  onEditCredor,
  onCredorChange,
  onNewCredor,
  onSearchChange,
  onSubmitCredor,
  onToggleModal,
  processos,
  saving,
  searchTerm,
  showCredorForm,
  statusMessage,
}: CredoresPageProps) {
  const totalCredores = credores.length
  const valorTotal = credores.reduce((sum, credor) => sum + credor.valor, 0)
  const habilitados = credores.filter((credor) => credor.status.toLowerCase().includes('habilitado')).length
  const pendentes = credores.filter((credor) => credor.status.toLowerCase().includes('pendente')).length
  const percentualHabilitado = totalCredores > 0 ? Math.round((habilitados / totalCredores) * 1000) / 10 : 0

  return (
    <>
      <header className="dashboard-header page-header">
        <div>
          <h1>Credores</h1>
          <p>Gerencie todos os credores dos processos</p>
        </div>
        <button className="new-process-button" onClick={onNewCredor} type="button">
          <IconPlus />
          Novo Credor
        </button>
      </header>

      <section className="creditor-metric-grid" aria-label="Resumo dos credores">
        <article className="creditor-metric-card">
          <span className="creditor-metric-icon">
            <IconUsers />
          </span>
          <div>
            <p>Total de Credores</p>
            <strong>{totalCredores}</strong>
            <span>Em todos os processos</span>
          </div>
        </article>
        <article className="creditor-metric-card">
          <span className="creditor-metric-icon">
            <IconUsers />
          </span>
          <div>
            <p>Valor Total</p>
            <strong>{formatFullCurrency(valorTotal)}</strong>
            <span>Soma de todos os creditos</span>
          </div>
        </article>
        <article className="creditor-metric-card">
          <span className="creditor-metric-icon">
            <IconUsers />
          </span>
          <div>
            <p>Credores Habilitados</p>
            <strong>{habilitados}</strong>
            <span>{percentualHabilitado}% do total</span>
          </div>
        </article>
        <article className="creditor-metric-card">
          <span className="creditor-metric-icon">
            <IconUsers />
          </span>
          <div>
            <p>Pendentes</p>
            <strong>{pendentes}</strong>
            <span>Aguardando habilitacao</span>
          </div>
        </article>
      </section>

      <section className="creditor-toolbar" aria-label="Ferramentas de credores">
        <label className="search-field">
          <IconSearch />
          <input
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome, documento ou processo..."
            type="search"
            value={searchTerm}
          />
        </label>
      </section>

      <section className="creditor-table-card">
        <h2>Lista de Credores</h2>
        <div className="creditor-table-wrap">
          <table className="creditor-table">
            <thead>
              <tr>
                <th>Credor</th>
                <th>Documento</th>
                <th>Processo</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {credores.map((credor) => {
                const tipo = credorTipoLabel(credor)

                return (
                  <tr key={credor.id}>
                    <td>
                      <strong>{credor.nome}</strong>
                    </td>
                    <td>{credor.documento}</td>
                    <td>{credorProcessoLabel(credor)}</td>
                    <td>
                      <span className={`type-pill ${credorTipoClass(tipo)}`}>{tipo}</span>
                    </td>
                    <td>
                      <strong>{formatFullCurrency(credor.valor)}</strong>
                    </td>
                    <td>
                      <span className={`status-pill ${credorStatusClass(credor.status)}`}>
                        {credorStatusLabel(credor.status)}
                      </span>
                    </td>
                    <td>{credor.dataCadastro ? formatDate(credor.dataCadastro) : '-'}</td>
                    <td>
                      <div className="process-actions">
                        <button onClick={() => onEditCredor(credor)} type="button">
                          Editar
                        </button>
                        <button disabled={saving} onClick={() => onDeleteCredor(credor)} type="button">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {credores.length === 0 ? <div className="empty-process-list">Nenhum credor encontrado.</div> : null}
      </section>

      {showCredorForm ? (
        <CredorModal
          credor={credor}
          editingCredorId={editingCredorId}
          onClose={() => onToggleModal(false)}
          onCredorChange={onCredorChange}
          onSubmit={onSubmitCredor}
          processos={processos}
          saving={saving}
          statusMessage={statusMessage}
        />
      ) : null}
    </>
  )
}
