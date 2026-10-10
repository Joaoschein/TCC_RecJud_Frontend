import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  IconArrowLeft,
  IconAlert,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconClock,
  IconDocument,
  IconDownload,
  IconMoney,
  IconPlus,
  IconUsers,
} from '../components/Icons'
import type {
  Credor,
  CredorResumo,
  DocumentoProcesso,
  DocumentoUploadForm,
  EventoTimeline,
  Processo,
  StatusEventoTimeline,
} from '../types'
import { credorStatusClass, credorStatusLabel, credorTipoClass, credorTipoLabel } from '../utils/credores'
import {
  formatDate,
  formatFullCurrency,
  formatStatus,
  getAbertura,
  getCredoresCount,
  statusClass,
} from '../utils/processos'

type ProcessoDetailTab = 'documentos' | 'timeline' | 'credores'

type ProcessoDetailPageProps = {
  documentos: DocumentoProcesso[]
  loadingDocumentos: boolean
  onBack: () => void
  onDeleteDocumento: (documento: DocumentoProcesso) => void
  onDeleteCredor: (credor: Credor) => void
  onDownloadDocumento: (documento: DocumentoProcesso) => void
  onEditCredor: (credor: Credor) => void
  onUpdateTimeline: (timeline: EventoTimeline[]) => void
  onUploadDocumento: (documento: DocumentoUploadForm) => void
  processo: Processo
  saving: boolean
  statusMessage: string
}

const tiposDocumento = ['Peticao', 'Decisao', 'Relacao de Credores', 'Demonstracao Financeira', 'Outro']

const detailTabs: Array<{ id: ProcessoDetailTab; label: string }> = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'credores', label: 'Credores' },
]

const emptyEventoTimeline: EventoTimeline = {
  data: '',
  descricao: '',
  status: 'PENDENTE',
  titulo: '',
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(0)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function formatDocumentType(documento: DocumentoProcesso) {
  if (documento.tipo) {
    return documento.tipo
  }

  const extension = documento.nomeArquivo.split('.').pop()
  return extension ? extension.toUpperCase() : 'Arquivo'
}

function getCredores(processo: Processo) {
  return Array.isArray(processo.credores) ? processo.credores : []
}

function toProcessoCredor(processo: Processo, credor: CredorResumo): Credor {
  return {
    ...credor,
    numeroProcesso: processo.numeroProcesso,
    processoId: processo.id,
    processoNome: processo.empresa,
  }
}

function getTimelineStatus(evento: EventoTimeline) {
  if (evento.status === 'CUMPRIDO') {
    return 'done'
  }

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

function timelineStatusLabel(status: ReturnType<typeof getTimelineStatus>) {
  const labels = {
    done: 'Cumprido',
    near: 'Perto de vencer',
    overdue: 'Vencido',
    pending: 'Pendente',
  }

  return labels[status]
}

function sortTimeline(timeline: EventoTimeline[]) {
  return [...timeline].sort((first, second) => first.data.localeCompare(second.data))
}

export function ProcessoDetailPage({
  documentos,
  loadingDocumentos,
  onBack,
  onDeleteCredor,
  onDeleteDocumento,
  onDownloadDocumento,
  onEditCredor,
  onUpdateTimeline,
  onUploadDocumento,
  processo,
  saving,
  statusMessage,
}: ProcessoDetailPageProps) {
  const [activeTab, setActiveTab] = useState<ProcessoDetailTab>('timeline')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [documentoNome, setDocumentoNome] = useState('')
  const [documentoTipo, setDocumentoTipo] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [timelineDraft, setTimelineDraft] = useState<EventoTimeline[]>([])

  function handleSubmitDocumento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!arquivo) {
      return
    }

    onUploadDocumento({
      arquivo,
      nome: documentoNome || arquivo.name,
      tipo: documentoTipo || undefined,
    })
    setDocumentoNome('')
    setDocumentoTipo('')
    setArquivo(null)
    setShowUploadModal(false)
  }

  const credores = getCredores(processo)
  const timeline = sortTimeline(processo.timeline ?? [])

  function openTimelineModal() {
    setTimelineDraft(timeline.length > 0 ? timeline : [{ ...emptyEventoTimeline }])
    setShowTimelineModal(true)
  }

  function updateTimelineDraft(index: number, changes: Partial<EventoTimeline>) {
    setTimelineDraft((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...changes } : item)))
  }

  function addTimelineDraftItem() {
    setTimelineDraft((current) => [...current, { ...emptyEventoTimeline }])
  }

  function removeTimelineDraftItem(index: number) {
    setTimelineDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function handleSubmitTimeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onUpdateTimeline(timelineDraft.filter((item) => item.titulo.trim() && item.data))
    setShowTimelineModal(false)
  }

  return (
    <section className="process-detail-page" aria-label={`Detalhes do processo ${processo.empresa}`}>
      <button className="back-button" onClick={onBack} type="button">
        <IconArrowLeft />
        Voltar para Processos
      </button>

      <header className="process-detail-header">
        <div>
          <div className="process-title-row">
            <h1>{processo.empresa}</h1>
            <span className={`status-pill ${statusClass(processo.status)}`}>{formatStatus(processo.status)}</span>
          </div>
          <p>{processo.numeroProcesso}</p>
        </div>

        <button className="new-process-button" onClick={() => setShowUploadModal(true)} type="button">
          <IconPlus />
          Adicionar Documento
        </button>
      </header>

      <div className="process-summary-grid" aria-label="Resumo do processo">
        <article className="process-summary-card">
          <span className="summary-icon summary-icon-blue">
            <IconBuilding />
          </span>
          <div>
            <p>CNPJ</p>
            <strong>{processo.cnpj || 'Nao informado'}</strong>
          </div>
        </article>

        <article className="process-summary-card">
          <span className="summary-icon summary-icon-green">
            <IconMoney />
          </span>
          <div>
            <p>Passivo Sujeito a Recuperacao Judicial</p>
            <strong>{formatFullCurrency(processo.valorTotal)}</strong>
          </div>
        </article>

        <article className="process-summary-card">
          <span className="summary-icon summary-icon-purple">
            <IconUsers />
          </span>
          <div>
            <p>Credores</p>
            <strong>{getCredoresCount(processo)}</strong>
          </div>
        </article>

        <article className="process-summary-card">
          <span className="summary-icon summary-icon-orange">
            <IconCalendar />
          </span>
          <div>
            <p>Abertura</p>
            <strong>{formatDate(getAbertura(processo))}</strong>
          </div>
        </article>
      </div>

      <nav className="process-detail-tabs" aria-label="Navegacao dos detalhes do processo">
        {detailTabs.map((tab) => (
          <button
            className={activeTab === tab.id ? 'process-detail-tab process-detail-tab-active' : 'process-detail-tab'}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'documentos' ? (
        <section className="process-documents-panel" aria-labelledby="documentos-processo">
          <h2 id="documentos-processo">Documentos do Processo</h2>

          {loadingDocumentos ? <div className="empty-process-list">Carregando documentos...</div> : null}

          {!loadingDocumentos && documentos.length === 0 ? (
            <div className="empty-process-list">Nenhum documento enviado para este processo.</div>
          ) : null}

          {!loadingDocumentos && documentos.length > 0 ? (
            <div className="document-list">
              {documentos.map((documento) => (
                <article className="document-row" key={documento.id}>
                  <div className="document-info">
                    <span className="document-icon">
                      <IconDocument />
                    </span>
                    <div>
                      <h3>{documento.nome}</h3>
                      <p>
                        {formatDocumentType(documento)} - {formatFileSize(documento.tamanhoBytes)} -{' '}
                        {formatDate(documento.dataUpload)}
                      </p>
                    </div>
                  </div>
                  <div className="document-actions">
                    <button
                      className="download-button"
                      onClick={() => onDownloadDocumento(documento)}
                      title={`Baixar ${documento.nome}`}
                      type="button"
                    >
                      <IconDownload />
                    </button>
                    <button
                      className="delete-document-button"
                      disabled={saving}
                      onClick={() => onDeleteDocumento(documento)}
                      type="button"
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'timeline' ? (
        <section className="process-documents-panel" aria-labelledby="timeline-processo">
          <div className="section-head">
            <h2 id="timeline-processo">Linha do Tempo do Processo</h2>
            <button className="tool-button" onClick={openTimelineModal} type="button">
              Editar Datas
            </button>
          </div>

          {timeline.length === 0 ? (
            <div className="empty-process-list">Nenhuma data importante cadastrada para este processo.</div>
          ) : (
            <div className="timeline-list">
              {timeline.map((evento) => {
                const currentStatus = getTimelineStatus(evento)

                return (
                  <article className={`timeline-item timeline-item-${currentStatus}`} key={evento.id ?? evento.titulo}>
                    <span className="timeline-marker">
                      {currentStatus === 'done' ? <IconCheck /> : null}
                      {currentStatus === 'near' ? <IconClock /> : null}
                      {currentStatus === 'overdue' || currentStatus === 'pending' ? <IconAlert /> : null}
                    </span>
                    <div className="timeline-content">
                      <div>
                        <h3>{evento.titulo}</h3>
                        <p>{evento.descricao || timelineStatusLabel(currentStatus)}</p>
                        <span>{timelineStatusLabel(currentStatus)}</span>
                      </div>
                      <time dateTime={evento.data}>{formatDate(evento.data)}</time>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      ) : null}

      {activeTab === 'credores' ? (
        <section className="process-documents-panel" aria-labelledby="credores-processo">
          <h2 id="credores-processo">Credores do Processo</h2>

          {credores.length === 0 ? (
            <div className="empty-process-list">Nenhum credor vinculado a este processo.</div>
          ) : (
            <div className="creditor-table-wrap">
              <table className="creditor-table process-creditor-table">
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
                    const credorDoProcesso = toProcessoCredor(processo, credor)

                    return (
                      <tr key={credor.id}>
                        <td>
                          <strong>{credor.nome}</strong>
                        </td>
                        <td>{credor.documento}</td>
                        <td>{processo.empresa}</td>
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
                            <button onClick={() => onEditCredor(credorDoProcesso)} type="button">
                              Editar
                            </button>
                            <button disabled={saving} onClick={() => onDeleteCredor(credorDoProcesso)} type="button">
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
          )}
        </section>
      ) : null}

      <section className="process-info-panel" aria-labelledby="informacoes-processo">
        <h2 id="informacoes-processo">Informacoes do Processo</h2>
        <div className="process-info-grid">
          <div>
            <span>Juiz Responsavel</span>
            <strong>{processo.juizResponsavel || 'Nao informado'}</strong>
          </div>
          <div>
            <span>Vara</span>
            <strong>{processo.vara || 'Nao informado'}</strong>
          </div>
          <div>
            <span>Comarca</span>
            <strong>{processo.comarca || 'Nao informado'}</strong>
          </div>
          <div>
            <span>Administrador Judicial</span>
            <strong>{processo.administradorJudicial || 'Nao informado'}</strong>
          </div>
        </div>
      </section>

      {showUploadModal ? (
        <div className="modal-backdrop" role="presentation">
          <section className="process-modal" aria-labelledby="upload-documento-title">
            <div className="modal-head">
              <div>
                <h2 id="upload-documento-title">Adicionar Documento</h2>
                <span>{processo.empresa}</span>
              </div>
              <button className="modal-close" onClick={() => setShowUploadModal(false)} type="button">
                Fechar
              </button>
            </div>

            <form className="modal-process-form upload-document-form" onSubmit={handleSubmitDocumento}>
              <label>
                Nome do documento
                <input
                  onChange={(event) => setDocumentoNome(event.target.value)}
                  placeholder="Ex: Peticao Inicial"
                  type="text"
                  value={documentoNome}
                />
              </label>

              <label>
                Tipo
                <select onChange={(event) => setDocumentoTipo(event.target.value)} value={documentoTipo}>
                  <option value="">Selecione</option>
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </label>

              <label className="file-field">
                Arquivo
                <input
                  accept=".pdf,.xlsx,.xls,.docx,.png,.jpg,.jpeg"
                  onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
                  required
                  type="file"
                />
              </label>

              <p className="form-message">{statusMessage}</p>

              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setShowUploadModal(false)} type="button">
                  Cancelar
                </button>
                <button className="primary-button" disabled={saving || !arquivo} type="submit">
                  {saving ? 'Enviando...' : 'Enviar Documento'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {showTimelineModal ? (
        <div className="modal-backdrop" role="presentation">
          <section className="process-modal timeline-modal" aria-labelledby="timeline-modal-title">
            <div className="modal-head">
              <div>
                <h2 id="timeline-modal-title">Editar Timeline</h2>
                <span>{processo.empresa}</span>
              </div>
              <button className="modal-close" onClick={() => setShowTimelineModal(false)} type="button">
                Fechar
              </button>
            </div>

            <form className="timeline-form" onSubmit={handleSubmitTimeline}>
              {timelineDraft.map((evento, index) => (
                <fieldset className="timeline-form-item" key={evento.id ?? index}>
                  <label>
                    Titulo
                    <input
                      onChange={(event) => updateTimelineDraft(index, { titulo: event.target.value })}
                      placeholder="Ex: Prazo para habilitacao de creditos"
                      required
                      type="text"
                      value={evento.titulo}
                    />
                  </label>

                  <label>
                    Data
                    <input
                      onChange={(event) => updateTimelineDraft(index, { data: event.target.value })}
                      required
                      type="date"
                      value={evento.data}
                    />
                  </label>

                  <label>
                    Status
                    <select
                      onChange={(event) =>
                        updateTimelineDraft(index, { status: event.target.value as StatusEventoTimeline })
                      }
                      value={evento.status}
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="CUMPRIDO">Cumprido</option>
                    </select>
                  </label>

                  <label className="timeline-description-field">
                    Descricao
                    <input
                      onChange={(event) => updateTimelineDraft(index, { descricao: event.target.value })}
                      placeholder="Descreva o marco ou prazo"
                      type="text"
                      value={evento.descricao ?? ''}
                    />
                  </label>

                  <button className="delete-document-button" onClick={() => removeTimelineDraftItem(index)} type="button">
                    Remover
                  </button>
                </fieldset>
              ))}

              <button className="tool-button" onClick={addTimelineDraftItem} type="button">
                Adicionar Data
              </button>

              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setShowTimelineModal(false)} type="button">
                  Cancelar
                </button>
                <button className="primary-button" disabled={saving} type="submit">
                  {saving ? 'Salvando...' : 'Salvar Timeline'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  )
}
