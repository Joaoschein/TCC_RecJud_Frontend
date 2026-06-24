import type { FormEvent } from 'react'
import { emptyCredor } from '../data/credores'
import type { CredorForm, Processo } from '../types'

type CredorModalProps = {
  credor: CredorForm
  editingCredorId: string | null
  onClose: () => void
  onCredorChange: (credor: CredorForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  processos: Processo[]
  saving: boolean
  statusMessage: string
}

const tipoOptions = [
  { label: 'Trabalhista', value: 'TRABALHISTA' },
  { label: 'Com Garantia Real', value: 'GARANTIA_REAL' },
  { label: 'Quirografario', value: 'QUIROGRAFARIO' },
  { label: 'ME/EPP', value: 'ME_EPP' },
] as const

const statusOptions = [
  { label: 'Habilitado', value: 'HABILITADO' },
  { label: 'Pendente', value: 'PENDENTE' },
  { label: 'Impugnado', value: 'IMPUGNADO' },
] as const

export function CredorModal({
  credor,
  editingCredorId,
  onClose,
  onCredorChange,
  onSubmit,
  processos,
  saving,
  statusMessage,
}: CredorModalProps) {
  function handleClose() {
    onCredorChange(emptyCredor)
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="process-modal" aria-modal="true" role="dialog">
        <div className="modal-head">
          <div>
            <h2>{editingCredorId ? 'Editar credor' : 'Novo credor'}</h2>
            <span>{statusMessage}</span>
          </div>
          <button className="modal-close" onClick={handleClose} type="button">
            Fechar
          </button>
        </div>

        <form className="modal-process-form" onSubmit={onSubmit}>
          <input
            disabled={saving}
            onChange={(event) => onCredorChange({ ...credor, nome: event.target.value })}
            placeholder="Nome do credor"
            value={credor.nome}
          />
          <input
            disabled={saving}
            onChange={(event) => onCredorChange({ ...credor, documento: event.target.value })}
            placeholder="Documento"
            value={credor.documento}
          />
          <select
            disabled={saving}
            onChange={(event) => onCredorChange({ ...credor, processoId: event.target.value })}
            value={credor.processoId}
          >
            <option value="">Selecione o processo</option>
            {processos.map((processo) => (
              <option key={processo.id} value={processo.id}>
                {processo.empresa}
              </option>
            ))}
          </select>
          <select
            disabled={saving}
            onChange={(event) => onCredorChange({ ...credor, tipo: event.target.value as CredorForm['tipo'] })}
            value={credor.tipo}
          >
            {tipoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            disabled={saving}
            min="0.01"
            onChange={(event) =>
              onCredorChange({
                ...credor,
                valor: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            placeholder="Valor"
            step="0.01"
            type="number"
            value={credor.valor ?? ''}
          />
          <select
            disabled={saving}
            onChange={(event) => onCredorChange({ ...credor, status: event.target.value as CredorForm['status'] })}
            value={credor.status}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="modal-actions">
            <button className="secondary-button" onClick={handleClose} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Salvando...' : editingCredorId ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
