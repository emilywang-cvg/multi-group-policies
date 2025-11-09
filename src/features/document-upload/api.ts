import type { Company, DocumentType, DocumentStatus } from './types'

// Mock delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Deterministic mock data
const mockCompanies: Company[] = [
  {
    id: 'parent-1',
    name: 'Acme Corporation',
    children: [
      { id: 'sub-1', name: 'Acme North Division', parentId: 'parent-1' },
      { id: 'sub-2', name: 'Acme South Division', parentId: 'parent-1' },
      { id: 'sub-3', name: 'Acme East Division', parentId: 'parent-1' },
      { id: 'sub-4', name: 'Acme West Division', parentId: 'parent-1' },
      { id: 'sub-5', name: 'Acme Central Division', parentId: 'parent-1' },
      { id: 'sub-6', name: 'Acme Pacific Division', parentId: 'parent-1' },
      { id: 'sub-7', name: 'Acme Atlantic Division', parentId: 'parent-1' },
      { id: 'sub-8', name: 'Acme Midwest Division', parentId: 'parent-1' },
      { id: 'sub-9', name: 'Acme Mountain Division', parentId: 'parent-1' },
      { id: 'sub-10', name: 'Acme Coastal Division', parentId: 'parent-1' },
      { id: 'sub-11', name: 'Acme International Division', parentId: 'parent-1' },
      { id: 'sub-12', name: 'Acme Regional Division', parentId: 'parent-1' },
    ],
  },
]

const mockDocumentTypes: DocumentType[] = [
  { id: 'doc-1', name: 'Photo ID', required: true },
  { id: 'doc-2', name: 'Certificate of Incorporation', required: true },
  { id: 'doc-3', name: 'Business Registration', required: true },
  { id: 'doc-4', name: 'Tax ID Number', required: true },
  { id: 'doc-5', name: 'Bank Statement', required: false },
  { id: 'doc-6', name: 'Insurance License', required: true },
  { id: 'doc-7', name: 'Operating Agreement', required: false },
  { id: 'doc-8', name: 'Annual Report', required: false },
]

// Generate deterministic statuses based on company and document IDs
function generateStatuses(): DocumentStatus[] {
  const statuses: DocumentStatus[] = []
  const allCompanyIds = [
    'parent-1',
    'sub-1',
    'sub-2',
    'sub-3',
    'sub-4',
    'sub-5',
    'sub-6',
    'sub-7',
    'sub-8',
    'sub-9',
    'sub-10',
    'sub-11',
    'sub-12',
  ]

  // Companies that are fully completed (all required docs uploaded)
  const completedCompanies = new Set(['sub-1', 'sub-3', 'sub-5', 'sub-7', 'sub-10'])

  allCompanyIds.forEach((companyId) => {
    const isCompleted = completedCompanies.has(companyId)
    
    mockDocumentTypes.forEach((docType) => {
      let status: 'uploaded' | 'missing' | 'optional'
      
      if (isCompleted) {
        // For completed companies, all required docs are uploaded
        if (docType.required) {
          status = 'uploaded'
        } else {
          // Optional docs can be uploaded or optional
          const seed = (companyId + docType.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
          status = seed % 2 === 0 ? 'uploaded' : 'optional'
        }
      } else {
        // For other companies, use deterministic randomness
        const seed = (companyId + docType.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const statusValue = seed % 3

        if (docType.required) {
          status = statusValue === 0 ? 'uploaded' : 'missing'
        } else {
          status = statusValue === 0 ? 'uploaded' : 'optional'
        }
      }

      statuses.push({
        companyId,
        documentId: docType.id,
        status,
      })
    })
  })

  return statuses
}

let mockStatuses: DocumentStatus[] = generateStatuses()

export async function getCompanies(): Promise<Company[]> {
  await delay(200)
  return mockCompanies
}

export async function getDocumentTypes(): Promise<DocumentType[]> {
  await delay(200)
  return mockDocumentTypes
}

export async function getStatuses(): Promise<DocumentStatus[]> {
  await delay(200)
  return [...mockStatuses]
}

export async function updateStatus(
  companyId: string,
  documentId: string,
  status: 'uploaded' | 'missing' | 'optional',
  filename?: string
): Promise<void> {
  await delay(200)
  const index = mockStatuses.findIndex(
    (s) => s.companyId === companyId && s.documentId === documentId
  )
  if (index !== -1) {
    mockStatuses[index] = { companyId, documentId, status, filename }
  } else {
    mockStatuses.push({ companyId, documentId, status, filename })
  }
}
