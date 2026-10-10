import { IconDocument, IconDownload, IconSearch } from '../components/Icons'
import type { DocumentoProcessoListItem } from '../types'
import { formatDate } from '../utils/processos'

type DocumentosPageProps = {
  documentos: DocumentoProcessoListItem[]
  loading: boolean
  onDownloadDocumento: (documento: DocumentoProcessoListItem) => void
  onViewDocumento: (documento: DocumentoProcessoListItem) => void
  onSearchChange: (value: string) => void
  searchTerm: string
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

function formatDocumentType(documento: DocumentoProcessoListItem) {
  if (documento.tipo) {
    return documento.tipo
  }

  const extension = documento.nomeArquivo.split('.').pop()
  return extension ? extension.toUpperCase() : 'Arquivo'
}

function getDocumentsThisMonth(documentos: DocumentoProcessoListItem[]) {
  const now = new Date()

  return documentos.filter((documento) => {
    const uploadDate = new Date(documento.dataUpload)
    return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear()
  }).length
}

function getTotalSize(documentos: DocumentoProcessoListItem[]) {
  return documentos.reduce((sum, documento) => sum + documento.tamanhoBytes, 0)
}

export function DocumentosPage({
  documentos,
  loading,
  onDownloadDocumento,
  onViewDocumento,
  onSearchChange,
  searchTerm,
}: DocumentosPageProps) {
  const totalSize = getTotalSize(documentos)

  return (
    <>
      <header className="dashboard-header page-header">
        <div>
          <h1>Documentos</h1>
          <p>Consulte os documentos enviados em todos os processos</p>
        </div>
      </header>

      <section className="document-metric-grid" aria-label="Resumo dos documentos">
        <article className="creditor-metric-card">
          <span className="creditor-metric-icon">
            <IconDocument />
          </span>
          <div>
            <p>Total de Documentos</p>
            <strong>{documentos.length}</strong>
            <span>Em todos os processos</span>
          </div>
        </article>

        <article className="creditor-metric-card">
          <span className="creditor-metric-icon">
            <IconDocument />
          </span>
          <div>
            <p>Pendentes de Revisao</p>
            <strong>0</strong>
            <span>Aguardando aprovacao</span>
          </div>
        </article>

        <article className="creditor-metric-card">
          <span className="creditor-metric-icon">
            <IconDocument />
          </span>
          <div>
            <p>Adicionados este mes</p>
            <strong>{getDocumentsThisMonth(documentos)}</strong>
            <span>Uploads recentes</span>
          </div>
        </article>

        <article className="creditor-metric-card">
          <span className="creditor-metric-icon">
            <IconDocument />
          </span>
          <div>
            <p>Espaco Utilizado</p>
            <strong>{formatFileSize(totalSize)}</strong>
            <span>Arquivos salvos</span>
          </div>
        </article>
      </section>

      <section className="document-toolbar" aria-label="Ferramentas de documentos">
        <label className="search-field">
          <IconSearch />
          <input
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome, processo ou tipo..."
            type="search"
            value={searchTerm}
          />
        </label>
      </section>

      <section className="document-table-card">
        <h2>Todos os Documentos</h2>

        {loading ? <div className="empty-process-list">Carregando documentos...</div> : null}

        {!loading && documentos.length === 0 ? (
          <div className="empty-process-list">Nenhum documento encontrado.</div>
        ) : null}

        {!loading && documentos.length > 0 ? (
          <div className="global-document-list">
            {documentos.map((documento) => (
              <article className="global-document-row" key={documento.id}>
                <div className="global-document-main">
                  <span className="global-document-icon">
                    <IconDocument />
                  </span>
                  <div>
                    <h3>{documento.nome}</h3>
                    <p>{documento.processoNome}</p>
                    <div className="global-document-tags">
                      <span>{formatDocumentType(documento)}</span>
                      <span>Aprovado</span>
                      <small>
                        {documento.nomeArquivo.split('.').pop()?.toUpperCase() ?? 'Arquivo'} -{' '}
                        {formatFileSize(documento.tamanhoBytes)}
                      </small>
                    </div>
                    <p className="global-document-date">Enviado em {formatDate(documento.dataUpload)}</p>
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
                  <button className="tool-button" onClick={() => onViewDocumento(documento)} type="button">
                    Ver
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  )
}
