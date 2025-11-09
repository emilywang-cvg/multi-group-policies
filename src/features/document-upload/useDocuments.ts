import { ref, computed, type Ref } from 'vue'
import { getCompanies, getDocumentTypes, getStatuses, updateStatus } from './api'
import type { Company, DocumentType, DocumentStatus } from './types'

export interface CompletionSummary {
  overall: number
  byType: Record<string, { uploaded: number; total: number; percentage: number }>
}

export function useDocuments() {
  const companies = ref<Company[]>([])
  const docTypes = ref<DocumentType[]>([])
  const statuses = ref<DocumentStatus[]>([])
  const loading = ref(false)

  const loadData = async () => {
    loading.value = true
    try {
      const [companiesData, docTypesData, statusesData] = await Promise.all([
        getCompanies(),
        getDocumentTypes(),
        getStatuses(),
      ])
      companies.value = companiesData
      docTypes.value = docTypesData
      statuses.value = statusesData
    } finally {
      loading.value = false
    }
  }

  const getCompanyDocs = (companyId: string): DocumentStatus[] => {
    return statuses.value.filter((s) => s.companyId === companyId)
  }

  const getDocForType = (docId: string): DocumentStatus[] => {
    return statuses.value.filter((s) => s.documentId === docId)
  }

  const toggleStatus = async (companyId: string, docId: string, filename?: string) => {
    const currentStatus = statuses.value.find(
      (s) => s.companyId === companyId && s.documentId === docId
    )

    const docType = docTypes.value.find((dt) => dt.id === docId)
    if (!docType) return

    let newStatus: 'uploaded' | 'missing' | 'optional'
    if (currentStatus?.status === 'uploaded') {
      newStatus = docType.required ? 'missing' : 'optional'
    } else {
      newStatus = 'uploaded'
    }

    await updateStatus(companyId, docId, newStatus, filename)

    // Update local state
    const index = statuses.value.findIndex(
      (s) => s.companyId === companyId && s.documentId === docId
    )
    if (index !== -1) {
      statuses.value[index] = { companyId, documentId: docId, status: newStatus, filename }
    } else {
      statuses.value.push({ companyId, documentId: docId, status: newStatus, filename })
    }
  }

  const uploadMultiple = async (
    companyId: string,
    uploads: Array<{ docId: string; filename: string }>
  ) => {
    for (const upload of uploads) {
      await updateStatus(companyId, upload.docId, 'uploaded', upload.filename)
      
      // Update local state
      const index = statuses.value.findIndex(
        (s) => s.companyId === companyId && s.documentId === upload.docId
      )
      if (index !== -1) {
        statuses.value[index] = {
          companyId,
          documentId: upload.docId,
          status: 'uploaded',
          filename: upload.filename,
        }
      } else {
        statuses.value.push({
          companyId,
          documentId: upload.docId,
          status: 'uploaded',
          filename: upload.filename,
        })
      }
    }
  }

  const completionSummary = computed((): CompletionSummary => {
    const byType: Record<string, { uploaded: number; total: number; percentage: number }> = {}

    docTypes.value.forEach((docType) => {
      const docStatuses = getDocForType(docType.id)
      const total = docStatuses.length
      const uploaded = docStatuses.filter((s) => s.status === 'uploaded').length
      byType[docType.id] = {
        uploaded,
        total,
        percentage: total > 0 ? Math.round((uploaded / total) * 100) : 0,
      }
    })

    const allRequired = docTypes.value.filter((dt) => dt.required)
    let totalRequired = 0
    let uploadedRequired = 0

    allRequired.forEach((docType) => {
      const docStatuses = getDocForType(docType.id)
      totalRequired += docStatuses.length
      uploadedRequired += docStatuses.filter((s) => s.status === 'uploaded').length
    })

    const overall = totalRequired > 0 ? Math.round((uploadedRequired / totalRequired) * 100) : 0

    return { overall, byType }
  })

  return {
    companies,
    docTypes,
    statuses,
    loading,
    loadData,
    getCompanyDocs,
    getDocForType,
    toggleStatus,
    uploadMultiple,
    completionSummary,
  }
}
