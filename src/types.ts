export type DocStatus = 'na_prateleira' | 'com_colaborador' | 'em_transito' | 'digitalizado'
export type DocType = 'contrato' | 'nota_fiscal' | 'relatorio' | 'politica' | 'proposta' | 'ata' | 'rh'

export interface Room {
  id: string
  name: string
  /** Ex.: Térreo, 1º andar */
  floor: string
  wing: string
  /** Como chegar, no espírito de orientação de agência */
  howToGet: string
  capacityBoxes: number
  /** Ordem no mapa interno (esquerda → direita) */
  mapOrder: number
}

export interface Document {
  id: string
  title: string
  code: string
  type: DocType
  status: DocStatus
  roomId: string
  /** Localização física precisa dentro do cômodo */
  shelf: string
  box: string
  tags: string[]
  custodian: string
  updatedAt: string
  lastSeenAt?: string
  summary: string
  pages: number
}

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  contrato: 'Contrato',
  nota_fiscal: 'Nota fiscal',
  relatorio: 'Relatório',
  politica: 'Política',
  proposta: 'Proposta',
  ata: 'Ata',
  rh: 'RH',
}

export const STATUS_LABEL: Record<DocStatus, string> = {
  na_prateleira: 'Na prateleira',
  com_colaborador: 'Com colaborador',
  em_transito: 'Em trânsito',
  digitalizado: 'Só digital',
}
