<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Document Upload - Tree View</h1>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Loading...</p>
    </div>

    <div v-else class="flex gap-6 h-[calc(100vh-200px)]">
      <!-- Left: Company Tree -->
      <div class="w-1/3 border border-gray-200 rounded-lg bg-white p-4 overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Companies</h2>
          <button
            @click="expandAllRequired"
            class="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
          >
            Expand All Required
          </button>
        </div>
        
        <div class="mb-3">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input
              v-model="showMissingOnly"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show only companies with missing documents</span>
          </label>
        </div>

        <template v-for="company in filteredCompanies" :key="company.id">
          <CompanyTreeItem
            :company="company"
            :statuses="statuses"
            :docTypes="docTypes"
            :expanded="expandedNodes"
            @toggle="toggleNode"
            @select="selectedCompanyId = $event"
          />
        </template>
      </div>

      <!-- Right: Document List -->
      <div class="flex-1 border border-gray-200 rounded-lg bg-white p-4 overflow-y-auto">
        <div v-if="!selectedCompanyId" class="text-center py-12 text-gray-500">
          <p>Select a company to view its documents</p>
        </div>

        <div v-else>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ getCompanyName(selectedCompanyId) }}
            </h2>
            <div class="flex items-center gap-3">
              <button
                @click="openBulkUploadModal"
                class="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Bulk Upload
              </button>
              <button
                @click="selectedCompanyId = null"
                class="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="docType in docTypes"
              :key="docType.id"
              :class="[
                'border rounded-lg p-4 transition-colors',
                getStatus(selectedCompanyId, docType.id)?.status !== 'uploaded' && docType.required
                  ? 'border-red-300 bg-red-50 hover:bg-red-100'
                  : 'border-gray-200 hover:bg-gray-50',
              ]"
            >
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'text-sm font-medium',
                        getStatus(selectedCompanyId, docType.id)?.status !== 'uploaded' && docType.required
                          ? 'text-red-900'
                          : 'text-gray-900',
                      ]"
                    >
                      {{ docType.name }}
                    </span>
                    <span
                      v-if="docType.required"
                      :class="[
                        'text-xs px-2 py-0.5 rounded',
                        getStatus(selectedCompanyId, docType.id)?.status !== 'uploaded'
                          ? 'bg-red-200 text-red-800 font-semibold'
                          : 'bg-red-100 text-red-700',
                      ]"
                    >
                      Required
                    </span>
                    <span v-else class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      Optional
                    </span>
                    <span
                      v-if="
                        getStatus(selectedCompanyId, docType.id)?.status !== 'uploaded' &&
                        docType.required
                      "
                      class="text-xs text-red-600 font-medium"
                    >
                      ⚠️ Missing
                    </span>
                  </div>
                  <!-- Status Badge (Uploaded) -->
                  <div
                    v-if="getStatus(selectedCompanyId, docType.id)?.status === 'uploaded'"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-300 bg-green-50 text-green-700 text-sm font-medium"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>Uploaded</span>
                  </div>
                  <!-- Upload Button -->
                  <button
                    v-else
                    @click="openUploadModal(selectedCompanyId, docType.id)"
                    class="px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow"
                    :class="[
                      docType.required
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700',
                    ]"
                  >
                    Upload
                  </button>
                </div>
                <!-- Display filename if uploaded -->
                <div
                  v-if="getStatus(selectedCompanyId, docType.id)?.status === 'uploaded' && getStatus(selectedCompanyId, docType.id)?.filename"
                  class="text-xs text-gray-600 flex items-center gap-1 ml-1"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span class="font-mono">{{ getStatus(selectedCompanyId, docType.id)?.filename }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Single Upload Modal -->
    <UploadModal
      :isOpen="modalOpen"
      :companyName="modalCompanyName"
      :docTypeName="modalDocTypeName"
      :isRequired="modalIsRequired"
      @close="modalOpen = false"
      @upload="handleModalUpload"
    />

    <!-- Bulk Upload Modal -->
    <BulkUploadModal
      :isOpen="bulkModalOpen"
      :companyName="modalCompanyName"
      :companyId="selectedCompanyId"
      :docTypes="docTypes"
      @close="bulkModalOpen = false"
      @upload="handleBulkUpload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDocuments } from './useDocuments'
import CompanyTreeItem from './CompanyTreeItem.vue'
import UploadModal from './UploadModal.vue'
import BulkUploadModal from './BulkUploadModal.vue'
import type { Company, DocumentType, DocumentStatus } from './types'

const {
  companies,
  docTypes,
  statuses,
  loading,
  loadData,
  toggleStatus: toggleDocumentStatus,
  uploadMultiple,
} = useDocuments()

const selectedCompanyId = ref<string | null>(null)
const expandedNodes = ref<Set<string>>(new Set(['parent-1']))
const showMissingOnly = ref(false)

// Modal state
const modalOpen = ref(false)
const bulkModalOpen = ref(false)
const modalCompanyId = ref<string | null>(null)
const modalDocTypeId = ref<string | null>(null)
const modalCompanyName = ref('')
const modalDocTypeName = ref('')
const modalIsRequired = ref(false)

const toggleNode = (companyId: string) => {
  const newSet = new Set(expandedNodes.value)
  if (newSet.has(companyId)) {
    newSet.delete(companyId)
  } else {
    newSet.add(companyId)
  }
  expandedNodes.value = newSet
}

const getCompanyName = (companyId: string): string => {
  const findCompany = (list: Company[]): Company | null => {
    for (const company of list) {
      if (company.id === companyId) return company
      if (company.children) {
        const found = findCompany(company.children)
        if (found) return found
      }
    }
    return null
  }

  const company = findCompany(companies.value)
  return company?.name || companyId
}

const getStatus = (companyId: string, docId: string): DocumentStatus | undefined => {
  return statuses.value.find((s) => s.companyId === companyId && s.documentId === docId)
}

// Check if company has missing required documents
const hasMissingRequired = (companyId: string): boolean => {
  const companyStatuses = statuses.value.filter((s) => s.companyId === companyId)
  const requiredDocs = docTypes.value.filter((dt) => dt.required)
  const requiredIds = new Set(requiredDocs.map((dt) => dt.id))
  const requiredStatuses = companyStatuses.filter((s) => requiredIds.has(s.documentId))
  return requiredStatuses.some((s) => s.status !== 'uploaded')
}

// Flatten companies for filtering
const allCompaniesFlat = computed(() => {
  const flatten = (list: Company[]): Company[] => {
    const result: Company[] = []
    for (const company of list) {
      result.push(company)
      if (company.children) {
        result.push(...flatten(company.children))
      }
    }
    return result
  }
  return flatten(companies.value)
})

// Filter companies based on showMissingOnly
const filteredCompanies = computed(() => {
  if (!showMissingOnly.value) return companies.value

  // Filter companies that have missing required docs or have children with missing docs
  const filterCompany = (company: Company): Company | null => {
    const hasMissing = hasMissingRequired(company.id)
    const filteredChildren = company.children
      ? company.children.map(filterCompany).filter((c): c is Company => c !== null)
      : []

    if (hasMissing || filteredChildren.length > 0) {
      return {
        ...company,
        children: filteredChildren.length > 0 ? filteredChildren : company.children,
      }
    }
    return null
  }

  return companies.value
    .map(filterCompany)
    .filter((c): c is Company => c !== null)
})

// Expand all companies with missing required documents
const expandAllRequired = () => {
  const newExpanded = new Set<string>()
  
  const expandCompany = (company: Company) => {
    if (hasMissingRequired(company.id)) {
      newExpanded.add(company.id)
    }
    if (company.children) {
      company.children.forEach(expandCompany)
    }
  }

  companies.value.forEach(expandCompany)
  expandedNodes.value = newExpanded
}

const toggleStatus = async (companyId: string, docId: string) => {
  await toggleDocumentStatus(companyId, docId)
}

const openUploadModal = (companyId: string, docId: string) => {
  const company = getCompanyName(companyId)
  const docType = docTypes.value.find((dt) => dt.id === docId)
  
  modalCompanyId.value = companyId
  modalDocTypeId.value = docId
  modalCompanyName.value = company
  modalDocTypeName.value = docType?.name || ''
  modalIsRequired.value = docType?.required || false
  modalOpen.value = true
}

const handleModalUpload = async (file: File) => {
  if (modalCompanyId.value && modalDocTypeId.value) {
    await toggleDocumentStatus(modalCompanyId.value, modalDocTypeId.value, file.name)
  }
}

const openBulkUploadModal = () => {
  if (!selectedCompanyId.value) return
  modalCompanyName.value = getCompanyName(selectedCompanyId.value)
  bulkModalOpen.value = true
}

const handleBulkUpload = async (uploads: Array<{ docId: string; filename: string }>) => {
  if (selectedCompanyId.value) {
    await uploadMultiple(selectedCompanyId.value, uploads)
  }
}

onMounted(() => {
  loadData()
})
</script>