import { documents, rooms } from '../data/catalog'
import type { DocStatus, DocType, Document, Room } from '../types'

export interface SearchFilters {
  query: string
  roomId: string | 'all'
  floor: string | 'all'
  types: DocType[]
  statuses: DocStatus[]
}

export interface LocatedDocument extends Document {
  room: Room
  locationPhrase: string
  score: number
  reasons: string[]
  matchedFields: string[]
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function daysSince(iso?: string): number {
  if (!iso) return 999
  return Math.max(0, (Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export function locationPhrase(doc: Document, room: Room): string {
  if (doc.status === 'com_colaborador') {
    return `Com ${doc.custodian} — último cômodo: ${room.name} (${room.floor})`
  }
  if (doc.status === 'em_transito') {
    return `Em trânsito — passando por ${room.name}`
  }
  if (doc.status === 'digitalizado') {
    return `Cópia física em ${room.name} · prateleira ${doc.shelf} · ${doc.box}`
  }
  return `Está em ${room.name} · ${room.floor} · prateleira ${doc.shelf} · ${doc.box}`
}

function fieldHits(doc: Document, room: Room, token: string): string[] {
  const fields: Array<[string, string]> = [
    ['título', doc.title],
    ['código', doc.code],
    ['resumo', doc.summary],
    ['responsável', doc.custodian],
    ['prateleira', doc.shelf],
    ['caixa', doc.box],
    ['cômodo', room.name],
    ['andar', room.floor],
    ['ala', room.wing],
    ...doc.tags.map((t): [string, string] => ['tag', t]),
  ]
  return fields.filter(([, value]) => normalize(value).includes(token)).map(([name]) => name)
}

/** Busca interativa: filtra e ranqueia documentos reais do catálogo. */
export function findDocuments(filters: SearchFilters): LocatedDocument[] {
  const q = normalize(filters.query.trim())
  const tokens = q ? q.split(/\s+/).filter(Boolean) : []

  const ranked = documents
    .map((doc) => {
      const room = rooms.find((r) => r.id === doc.roomId)
      if (!room) return null

      if (filters.roomId !== 'all' && doc.roomId !== filters.roomId) return null
      if (filters.floor !== 'all' && room.floor !== filters.floor) return null
      if (filters.types.length && !filters.types.includes(doc.type)) return null
      if (filters.statuses.length && !filters.statuses.includes(doc.status)) return null

      let score = 40
      const reasons: string[] = []
      const matchedFields = new Set<string>()

      if (doc.status === 'na_prateleira') {
        score += 20
        reasons.push('Na prateleira agora')
      } else if (doc.status === 'com_colaborador') {
        score += 5
        reasons.push(`Com ${doc.custodian}`)
      } else if (doc.status === 'em_transito') {
        score += 2
        reasons.push('Em trânsito no prédio')
      }

      if (doc.lastSeenAt && daysSince(doc.lastSeenAt) < 2) {
        score += 15
        reasons.push('Visto recentemente')
      }

      if (tokens.length) {
        let hitTokens = 0
        for (const t of tokens) {
          const hits = fieldHits(doc, room, t)
          if (hits.length === 0) return null
          hitTokens += 1
          hits.forEach((h) => matchedFields.add(h))
          // Bônus se o código ou título baterem
          if (hits.includes('código')) score += 25
          if (hits.includes('título')) score += 15
          if (hits.includes('cômodo')) score += 10
        }
        score += (hitTokens / tokens.length) * 50
        if (hitTokens === tokens.length) reasons.push('Combina com a busca')
      }

      if (room.floor === 'Térreo') score += 8
      if (room.floor === '1º andar') score += 5

      return {
        ...doc,
        room,
        locationPhrase: locationPhrase(doc, room),
        score,
        reasons: [...new Set(reasons)].slice(0, 3),
        matchedFields: [...matchedFields],
      }
    })
    .filter((d): d is LocatedDocument => d !== null)

  ranked.sort((a, b) => b.score - a.score)
  return ranked
}

/** Sugestões enquanto digita (autocomplete). */
export function suggestQueries(query: string, limit = 6): string[] {
  const q = normalize(query.trim())
  if (q.length < 1) return []

  const ideas = new Set<string>()
  for (const doc of documents) {
    const room = rooms.find((r) => r.id === doc.roomId)
    const pool = [
      doc.code,
      doc.title,
      ...doc.tags,
      room?.name ?? '',
      doc.custodian,
      doc.shelf,
    ]
    for (const item of pool) {
      if (item && normalize(item).includes(q)) ideas.add(item)
    }
  }
  return [...ideas].slice(0, limit)
}

export function floors(): string[] {
  return [...new Set(rooms.map((r) => r.floor))]
}

export const QUICK_SEARCHES = [
  'contrato frota',
  'Sala Jurídica',
  'cofre',
  'arquivo morto',
  'NF-',
  'Atlas',
  'RH',
]
