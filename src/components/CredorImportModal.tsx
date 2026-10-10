import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { CredorForm, CredorImportPreview, Processo } from '../types'
import { parseCredoresXlsx } from '../utils/credorImport'
import { formatFullCurrency } from '../utils/processos'

type CredorImportModalProps = {
  onClose: () => void
  onImport: (credores: CredorForm[]) => Promise<number>
  processos: Processo[]
  saving: boolean
}

export function CredorImportModal({ onClose, onImport, processos, saving }: CredorImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processoId, setProcessoId] = useState(processos[0]?.id ?? '')
  const [status, setStatus] = useState<CredorForm['status']>('HABILITADO')
  const [preview, setPreview] = useState<CredorImportPreview | null>(null)
  const [parseMessage, setParseMessage] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [parsing, setParsing] = useState(false)

  const canImport = Boolean(preview?.itens.length) && preview?.invalidos.length === 0 && !saving && !parsing
  const previewRows = useMemo(() => preview?.itens.slice(0, 8) ?? [], [preview])
  const tipoLabels: Record<CredorForm['tipo'], string> = {
    GARANTIA_REAL: 'Garantia Real',
    ME_EPP: 'ME/EPP',
    QUIROGRAFARIO: 'Quirografario',
    TRABALHISTA: 'Trabalhista',
  }

  useEffect(() => {
    if (!file || !processoId) {
      setPreview(null)
      setParseMessage('')
      return
    }

    let cancelled = false
    setParsing(true)
    setParseMessage('Lendo planilha...')
    setImportMessage('')

    parseCredoresXlsx(file, processoId, status)
      .then((nextPreview) => {
        if (cancelled) {
          return
        }

        setPreview(nextPreview)
        setParseMessage(
          `${nextPreview.itens.length} credores validos, ${nextPreview.invalidos.length} linhas com erro, ${nextPreview.agrupados} agrupamentos.`,
        )
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        const message = error instanceof Error ? error.message : 'Nao foi possivel ler a planilha.'
        setPreview(null)
        setParseMessage(message)
      })
      .finally(() => {
        if (!cancelled) {
          setParsing(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [file, processoId, status])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!preview || !canImport) {
      return
    }

    setImportMessage('Importando credores...')
    try {
      const total = await onImport(preview.itens)
      setImportMessage(`${total} credores importados com sucesso.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel importar os credores.'
      setImportMessage(message)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-labelledby="importar-credores-title" className="process-modal creditor-import-modal">
        <div className="modal-head">
          <div>
            <h2 id="importar-credores-title">Importar credores</h2>
            <span>Upload, pre-visualizacao, validacao e importacao em lote</span>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            Fechar
          </button>
        </div>

        <form className="modal-process-form creditor-import-form" onSubmit={handleSubmit}>
          <label>
            Processo
            <select onChange={(event) => setProcessoId(event.target.value)} required value={processoId}>
              {processos.map((processo) => (
                <option key={processo.id} value={processo.id}>
                  {processo.empresa} - {processo.numeroProcesso}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status inicial
            <select onChange={(event) => setStatus(event.target.value as CredorForm['status'])} value={status}>
              <option value="HABILITADO">Habilitado</option>
              <option value="PENDENTE">Pendente</option>
              <option value="IMPUGNADO">Impugnado</option>
            </select>
          </label>

          <label className="file-field">
            Planilha .xlsx
            <input accept=".xlsx" onChange={handleFileChange} required type="file" />
          </label>

          {parseMessage ? <p className="form-message">{parseMessage}</p> : null}
          {importMessage ? <p className="form-message">{importMessage}</p> : null}

          {preview ? (
            <div className="creditor-import-summary">
              <div>
                <span>Linhas lidas</span>
                <strong>{preview.linhasLidas}</strong>
              </div>
              <div>
                <span>Validos</span>
                <strong>{preview.itens.length}</strong>
              </div>
              <div>
                <span>Com erro</span>
                <strong>{preview.invalidos.length}</strong>
              </div>
              <div>
                <span>Agrupados</span>
                <strong>{preview.agrupados}</strong>
              </div>
            </div>
          ) : null}

          {previewRows.length > 0 ? (
            <div className="creditor-import-preview">
              <h3>Previa da importacao</h3>
              <div className="creditor-table-wrap">
                <table className="creditor-table creditor-import-table">
                  <thead>
                    <tr>
                      <th>Credor</th>
                      <th>Documento</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Linhas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((item) => (
                      <tr key={`${item.documento}-${item.tipo}`}>
                        <td>
                          <strong>{item.nome}</strong>
                        </td>
                        <td>{item.documento}</td>
                        <td>{tipoLabels[item.tipo]}</td>
                        <td>
                          <strong>{formatFullCurrency(item.valor)}</strong>
                        </td>
                        <td>{item.linhasOrigem.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {preview?.invalidos.length ? (
            <div className="creditor-import-errors">
              <h3>Linhas com erro</h3>
              {preview.invalidos.slice(0, 6).map((item) => (
                <p key={item.linha}>
                  Linha {item.linha}: {item.motivo}
                </p>
              ))}
            </div>
          ) : null}

          <div className="modal-actions">
            <button className="secondary-button" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={!canImport} type="submit">
              {saving ? 'Importando...' : 'Importar credores'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
