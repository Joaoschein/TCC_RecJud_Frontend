import type { FormEvent } from 'react'
import type { ProcessoForm } from '../types'
import { emptyProcesso } from '../data/processos'

type ProcessoModalProps = {
  editingProcessoId: string | null
  onClose: () => void
  onProcessoChange: (processo: ProcessoForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  processo: ProcessoForm
  saving: boolean
  statusMessage: string
}

const statusOptions = [
  { label: 'Em andamento', value: 'EM_ANDAMENTO' },
  { label: 'Aguardando aprovacao', value: 'AGUARDANDO_APROVACAO' },
  { label: 'Aprovado', value: 'APROVADO' },
] as const

export function ProcessoModal({
  editingProcessoId,
  onClose,
  onProcessoChange,
  onSubmit,
  processo,
  saving,
  statusMessage,
}: ProcessoModalProps) {
  function handleClose() {
    onProcessoChange(emptyProcesso)
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="process-modal" aria-modal="true" role="dialog">
        <div className="modal-head">
          <div>
            <h2>{editingProcessoId ? 'Editar processo' : 'Novo processo'}</h2>
            <span>{statusMessage}</span>
          </div>
          <button className="modal-close" onClick={handleClose} type="button">
            Fechar
          </button>
        </div>

        <form className="modal-process-form" onSubmit={onSubmit}>
          <input
            disabled={saving}
            onChange={(event) => onProcessoChange({ ...processo, empresa: event.target.value })}
            placeholder="Empresa"
            value={processo.empresa}
          />
          <input
            disabled={saving}
            onChange={(event) => onProcessoChange({ ...processo, numeroProcesso: event.target.value })}
            placeholder="Numero do processo"
            value={processo.numeroProcesso}
          />
          <input
            disabled={saving}
            onChange={(event) => onProcessoChange({ ...processo, cnpj: event.target.value })}
            placeholder="CNPJ"
            value={processo.cnpj}
          />
          <input
            disabled={saving}
            onChange={(event) => onProcessoChange({ ...processo, vara: event.target.value })}
            placeholder="Vara responsavel"
            value={processo.vara}
          />
          <input
            disabled={saving}
            onChange={(event) => onProcessoChange({ ...processo, abertura: event.target.value })}
            placeholder="Abertura"
            type="date"
            value={processo.abertura ?? ''}
          />
          <input
            disabled={saving}
            min="0.01"
            onChange={(event) =>
              onProcessoChange({
                ...processo,
                valorTotal: event.target.value ? Number(event.target.value) : undefined,
              })
            }
            placeholder="Valor total"
            step="0.01"
            type="number"
            value={processo.valorTotal ?? ''}
          />
          <select
            disabled={saving}
            onChange={(event) =>
              onProcessoChange({ ...processo, status: event.target.value as ProcessoForm['status'] })
            }
            value={processo.status}
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
              {saving ? 'Salvando...' : editingProcessoId ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
