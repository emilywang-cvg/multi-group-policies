export type ID = string

export type Status = 'ACTIVE' | 'INACTIVE'

export interface CompanyNode {
  id: ID
  name: string
  status: Status
  isParent: boolean
  parentId?: ID
  children?: CompanyNode[] // for parents
  crNumber?: string
  contact?: {
    field1?: string
    field2?: string
    field3?: string
    field4?: string
  }
  address?: {
    field1?: string
    field2?: string
    field3?: string
    field4?: string
  }
  censusLevels?: Array<{ levelName: string; items: string[] }>
}

export interface NewClientInput {
  type: 'COMPANY'
  crNumber?: string
  name: string // required
  contact?: {
    field1?: string
    field2?: string
    field3?: string
    field4?: string
  }
  address?: {
    field1?: string
    field2?: string
    field3?: string
    field4?: string
  }
  censusLevels?: Array<{ levelName: string; items: string[] }>
  subsidiaries?: Array<{ id?: ID; name: string; createdInline?: boolean }>
  status?: Status // default ACTIVE
}

