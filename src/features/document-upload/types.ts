export interface Company {
  id: string
  name: string
  parentId?: string
  children?: Company[]
}

export interface DocumentType {
  id: string
  name: string
  required: boolean
}

export interface DocumentStatus {
  companyId: string
  documentId: string
  status: 'uploaded' | 'missing' | 'optional'
  filename?: string
}
