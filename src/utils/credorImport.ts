import type { CredorForm, CredorImportItem, CredorImportPreview } from '../types'

type RawCredorRow = Record<string, unknown>

const HEADER_ALIASES = {
  classe: ['classe'],
  documento: ['cpf/cnpj', 'cpf', 'cnpj', 'documento credor'],
  nome: ['credor', 'nome', 'nome credor'],
  natureza: ['natureza'],
  origem: ['origem'],
  valor: ['valor', 'credito', 'crédito'],
} as const

function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeKey(value: string) {
  return normalizeText(value).toLowerCase()
}

function readByAlias(row: RawCredorRow, aliases: readonly string[]) {
  const entries = Object.entries(row)
  const found = entries.find(([key]) => aliases.includes(normalizeKey(key)))

  return found?.[1]
}

function parseMoney(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  const text = String(value ?? '')
    .replace(/\s/g, '')
    .replace(/^R\$/i, '')

  if (!text) {
    return Number.NaN
  }

  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text

  return Number(normalized)
}

function normalizeDocument(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeName(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

export function parseCredorTipo(value: unknown): CredorForm['tipo'] | null {
  const normalized = normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, ' ')

  if (!normalized) {
    return null
  }

  if (normalized.includes('1') || normalized.includes('TRABALH')) {
    return 'TRABALHISTA'
  }

  if (normalized.includes('2') || normalized.includes('GARANTIA') || normalized.includes('REAL')) {
    return 'GARANTIA_REAL'
  }

  if (normalized.includes('4') || normalized.includes('ME') || normalized.includes('EPP')) {
    return 'ME_EPP'
  }

  if (normalized.includes('3') || normalized.includes('QUIROGRAF')) {
    return 'QUIROGRAFARIO'
  }

  return null
}

export async function parseCredoresXlsx(
  file: File,
  processoId: string,
  status: CredorForm['status'],
): Promise<CredorImportPreview> {
  const xlsxModule = await import('xlsx')
  const XLSX = xlsxModule.default ?? xlsxModule
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { cellDates: true })
  const sheetName = workbook.SheetNames.includes('Analítica') ? 'Analítica' : workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<RawCredorRow>(sheet, { defval: '' })
  const grouped = new Map<string, CredorImportItem>()
  const invalidos: CredorImportPreview['invalidos'] = []
  let agrupados = 0

  rows.forEach((row, index) => {
    const linha = index + 2
    const nome = normalizeName(readByAlias(row, HEADER_ALIASES.nome))
    const documento = normalizeDocument(readByAlias(row, HEADER_ALIASES.documento))
    const classeOriginal = String(readByAlias(row, HEADER_ALIASES.classe) ?? '').trim()
    const natureza = String(readByAlias(row, HEADER_ALIASES.natureza) ?? '').trim()
    const origem = String(readByAlias(row, HEADER_ALIASES.origem) ?? '').trim()
    const tipo = parseCredorTipo(classeOriginal)
    const valor = parseMoney(readByAlias(row, HEADER_ALIASES.valor))
    const errors: string[] = []

    if (!nome) {
      errors.push('nome vazio')
    }

    if (!documento) {
      errors.push('documento vazio')
    }

    if (!tipo) {
      errors.push('classe nao reconhecida')
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      errors.push('valor invalido')
    }

    if (errors.length > 0 || !tipo) {
      invalidos.push({
        documento,
        linha,
        motivo: errors.join(', '),
        nome,
      })
      return
    }

    const groupingKey = `${documento.replace(/\D/g, '') || documento.toUpperCase()}|${tipo}`
    const current = grouped.get(groupingKey)

    if (current) {
      current.valor = Number((Number(current.valor ?? 0) + valor).toFixed(2))
      current.linhasOrigem.push(linha)
      agrupados += 1
      return
    }

    grouped.set(groupingKey, {
      classeOriginal,
      documento,
      linhasOrigem: [linha],
      natureza,
      nome,
      origem,
      processoId,
      status,
      tipo,
      valor: Number(valor.toFixed(2)),
    })
  })

  return {
    agrupados,
    invalidos,
    itens: Array.from(grouped.values()),
    linhasLidas: rows.length,
  }
}
