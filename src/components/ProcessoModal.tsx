import type { FormEvent } from 'react'
import type { ProcessoFieldErrors, ProcessoForm } from '../types'
import { emptyProcesso } from '../data/processos'

type ProcessoModalProps = {
  editingProcessoId: string | null
  fieldErrors: ProcessoFieldErrors
  onClose: () => void
  onFieldErrorClear: (field: keyof ProcessoFieldErrors) => void
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
  fieldErrors,
  onClose,
  onFieldErrorClear,
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

        <form className="modal-process-form" noValidate onSubmit={onSubmit}>
          <label className={fieldErrors.empresa ? 'field-error' : ''}>
            Empresa
            <input
              aria-invalid={Boolean(fieldErrors.empresa)}
              disabled={saving}
              onChange={(event) => {
                onFieldErrorClear('empresa')
                onProcessoChange({ ...processo, empresa: event.target.value })
              }}
              placeholder="Empresa"
              value={processo.empresa}
            />
            {fieldErrors.empresa ? <span className="field-message">{fieldErrors.empresa}</span> : null}
          </label>
          <label className={fieldErrors.numeroProcesso ? 'field-error' : ''}>
            Numero do processo
            <input
              aria-invalid={Boolean(fieldErrors.numeroProcesso)}
              disabled={saving}
              onChange={(event) => {
                onFieldErrorClear('numeroProcesso')
                onProcessoChange({ ...processo, numeroProcesso: event.target.value })
              }}
              placeholder="Numero do processo"
              value={processo.numeroProcesso}
            />
            {fieldErrors.numeroProcesso ? <span className="field-message">{fieldErrors.numeroProcesso}</span> : null}
          </label>
          <label className={fieldErrors.cnpj ? 'field-error' : ''}>
            CNPJ
            <input
              aria-invalid={Boolean(fieldErrors.cnpj)}
              disabled={saving}
              onChange={(event) => {
                onFieldErrorClear('cnpj')
                onProcessoChange({ ...processo, cnpj: event.target.value })
              }}
              placeholder="CNPJ"
              value={processo.cnpj}
            />
            {fieldErrors.cnpj ? <span className="field-message">{fieldErrors.cnpj}</span> : null}
          </label>
          <label className={fieldErrors.vara ? 'field-error' : ''}>
            Vara
            <input
              aria-invalid={Boolean(fieldErrors.vara)}
              disabled={saving}
              onChange={(event) => {
                onFieldErrorClear('vara')
                onProcessoChange({ ...processo, vara: event.target.value })
              }}
              placeholder="Vara responsavel"
              value={processo.vara}
            />
            {fieldErrors.vara ? <span className="field-message">{fieldErrors.vara}</span> : null}
          </label>
          <label className={fieldErrors.juizResponsavel ? 'field-error' : ''}>
            Juiz responsavel
            <input
              aria-invalid={Boolean(fieldErrors.juizResponsavel)}
              disabled={saving}
              onChange={(event) => {
                onFieldErrorClear('juizResponsavel')
                onProcessoChange({ ...processo, juizResponsavel: event.target.value })
              }}
              placeholder="Ex: Dr. Jose Silva Santos"
              value={processo.juizResponsavel ?? ''}
            />
            {fieldErrors.juizResponsavel ? (
              <span className="field-message">{fieldErrors.juizResponsavel}</span>
            ) : null}
          </label>
          <label className={fieldErrors.comarca ? 'field-error' : ''}>
            Comarca
            <input
              aria-invalid={Boolean(fieldErrors.comarca)}
              disabled={saving}
              onChange={(event) => {
                onFieldErrorClear('comarca')
                onProcessoChange({ ...processo, comarca: event.target.value })
              }}
              placeholder="Ex: Maceio - AL"
              value={processo.comarca ?? ''}
            />
            {fieldErrors.comarca ? <span className="field-message">{fieldErrors.comarca}</span> : null}
          </label>
          <label className={fieldErrors.administradorJudicial ? 'field-error' : ''}>
            Administrador judicial
            <input
              aria-invalid={Boolean(fieldErrors.administradorJudicial)}
              disabled={saving}
              onChange={(event) => {
                onFieldErrorClear('administradorJudicial')
                onProcessoChange({ ...processo, administradorJudicial: event.target.value })
              }}
              placeholder="Ex: Maria Oliveira - OAB/AL 12345"
              value={processo.administradorJudicial ?? ''}
            />
            {fieldErrors.administradorJudicial ? (
              <span className="field-message">{fieldErrors.administradorJudicial}</span>
            ) : null}
          </label>
          <label className={fieldErrors.abertura ? 'field-error' : ''}>
            Abertura
            <input
              aria-invalid={Boolean(fieldErrors.abertura)}
              disabled={saving}
              onChange={(event) => {
                onFieldErrorClear('abertura')
                onProcessoChange({ ...processo, abertura: event.target.value })
              }}
              type="date"
              value={processo.abertura ?? ''}
            />
            {fieldErrors.abertura ? <span className="field-message">{fieldErrors.abertura}</span> : null}
          </label>
          <label className={fieldErrors.status ? 'field-error' : ''}>
            Status
            <select
              aria-invalid={Boolean(fieldErrors.status)}
              disabled={saving}
              onChange={(event) => {
                onFieldErrorClear('status')
                onProcessoChange({ ...processo, status: event.target.value as ProcessoForm['status'] })
              }}
              value={processo.status}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.status ? <span className="field-message">{fieldErrors.status}</span> : null}
          </label>
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
