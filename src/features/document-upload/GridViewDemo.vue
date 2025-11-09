<template>
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        Document Upload - Grid View
      </h1>
  
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading...</p>
      </div>
  
      <div v-else>
        <!-- Toolbar -->
        <div
          class="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap items-center gap-3"
        >
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700">Filter:</label>
            <select
              v-model="filter"
              class="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="missing">Missing</option>
              <option value="uploaded">Uploaded</option>
            </select>
          </div>
        </div>
  
        <!-- Table wrapper -->
        <div class="relative border border-gray-200 rounded-lg bg-white overflow-hidden">
          <div class="overflow-auto max-h-[75vh] w-full">
            <table class="min-w-max table-auto border-collapse text-sm text-gray-800 w-full">
              <thead>
                <tr>
                  <th
                    class="sticky left-0 top-0 z-30 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900 border-b border-gray-200 whitespace-nowrap shadow-sm"
                  >
                    Company
                  </th>
                  <th
                    v-for="docType in docTypes"
                    :key="docType.id"
                    class="px-4 py-3 text-left font-semibold text-gray-900 border-b border-gray-200 whitespace-nowrap bg-gray-50 sticky top-0 z-10 min-w-[160px]"
                  >
                    <div class="space-y-2">
                      <div class="flex items-center gap-1">
                        {{ docType.name }}
                        <span
                          v-if="docType.required"
                          class="text-[11px] text-red-600 font-medium"
                        >
                          (Required)
                        </span>
                      </div>
                      <button
                        v-if="docType.required"
                        @click="openBulkUploadForDocType(docType.id)"
                        class="w-full text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
                        title="Upload this document type to all companies"
                      >
                        Bulk Upload
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(company, index) in paginatedCompanies"
                  :key="company.id"
                  class="even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <td
                    :class="[
                      'sticky left-0 z-20 border-b border-gray-200 px-4 py-2 font-medium text-gray-900 whitespace-nowrap shadow-sm',
                      index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                    ]"
                  >
                    {{ company.name }}
                  </td>
                  <td
                    v-for="docType in docTypes"
                    :key="docType.id"
                    class="border-b border-gray-200 px-4 py-2 text-center whitespace-nowrap"
                  >
                    <!-- Status Badge (Uploaded) -->
                    <div
                      v-if="getStatus(company.id, docType.id)?.status === 'uploaded'"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-300 bg-green-50 text-green-700 text-xs font-medium"
                    >
                      <svg
                        class="w-3.5 h-3.5"
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
                      @click="openUploadModal(company.id, docType.id, company.name)"
                      class="w-full px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm hover:shadow"
                      :class="{
                        'bg-red-600 text-white hover:bg-red-700':
                          docType.required,
                        'bg-gray-200 text-gray-700 hover:bg-gray-300':
                          !docType.required
                      }"
                    >
                      Upload
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
  
        <!-- Pagination -->
        <div
          class="mt-4 flex flex-wrap justify-between items-center gap-3 text-sm text-gray-700"
        >
          <span>
            Showing {{ startIndex + 1 }}–{{ endIndex }} of
            {{ filteredCompanies.length }} companies
          </span>
  
          <div class="flex items-center gap-2">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span>Page {{ currentPage }} / {{ totalPages }}</span>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
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

      <!-- Bulk Upload Modal for Document Type -->
      <DocTypeBulkUploadModal
        :isOpen="docTypeBulkModalOpen"
        :docTypeName="docTypeBulkName"
        :docTypeId="docTypeBulkId"
        :companies="allCompanies"
        :statuses="statuses"
        @close="docTypeBulkModalOpen = false"
        @upload="handleDocTypeBulkUpload"
      />
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useDocuments } from './useDocuments'
import UploadModal from './UploadModal.vue'
import DocTypeBulkUploadModal from './DocTypeBulkUploadModal.vue'
import type { Company, DocumentStatus } from './types'

const { companies, docTypes, statuses, loading, loadData, toggleStatus: toggleDocumentStatus } = useDocuments()
  
const filter = ref<'all' | 'missing' | 'uploaded'>('all')
const currentPage = ref(1)
const rowsPerPage = 10

// Modal state
const modalOpen = ref(false)
const docTypeBulkModalOpen = ref(false)
const modalCompanyId = ref<string | null>(null)
const modalDocTypeId = ref<string | null>(null)
const modalCompanyName = ref('')
const modalDocTypeName = ref('')
const modalIsRequired = ref(false)
const docTypeBulkId = ref<string | null>(null)
const docTypeBulkName = ref('')
  
const allCompanies = computed(() => {
    const flatten = (list: Company[]): Company[] => {
      const result: Company[] = []
      for (const company of list) {
        result.push(company)
        if (company.children) result.push(...flatten(company.children))
      }
      return result
    }
    return flatten(companies.value)
  })
  
const filteredCompanies = computed(() => {
    if (filter.value === 'all') return allCompanies.value
    return allCompanies.value.filter((company) => {
      const companyStatuses = statuses.value.filter((s) => s.companyId === company.id)
      const requiredDocs = docTypes.value.filter((d) => d.required)
      const requiredIds = new Set(requiredDocs.map((d) => d.id))
      const requiredStatuses = companyStatuses.filter((s) => requiredIds.has(s.documentId))
  
      return filter.value === 'missing'
        ? requiredStatuses.some((s) => s.status !== 'uploaded')
        : requiredStatuses.length > 0 &&
            requiredStatuses.every((s) => s.status === 'uploaded')
    })
  })
  
const totalPages = computed(() => Math.ceil(filteredCompanies.value.length / rowsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * rowsPerPage)
const endIndex = computed(() => Math.min(startIndex.value + rowsPerPage, filteredCompanies.value.length))
const paginatedCompanies = computed(() =>
  filteredCompanies.value.slice(startIndex.value, endIndex.value)
)

const getStatus = (companyId: string, docId: string): DocumentStatus | undefined =>
  statuses.value.find((s) => s.companyId === companyId && s.documentId === docId)
  
const toggleStatus = async (companyId: string, docId: string) => {
  await toggleDocumentStatus(companyId, docId)
}

const openUploadModal = (companyId: string, docId: string, companyName: string) => {
  const docType = docTypes.value.find((dt) => dt.id === docId)
  
  modalCompanyId.value = companyId
  modalDocTypeId.value = docId
  modalCompanyName.value = companyName
  modalDocTypeName.value = docType?.name || ''
  modalIsRequired.value = docType?.required || false
  modalOpen.value = true
}

const handleModalUpload = async (file: File) => {
  if (modalCompanyId.value && modalDocTypeId.value) {
    await toggleDocumentStatus(modalCompanyId.value, modalDocTypeId.value, file.name)
  }
}

const openBulkUploadForDocType = (docTypeId: string) => {
  const docType = docTypes.value.find((dt) => dt.id === docTypeId)
  if (!docType) return
  
  docTypeBulkId.value = docTypeId
  docTypeBulkName.value = docType.name
  docTypeBulkModalOpen.value = true
}

const handleDocTypeBulkUpload = async (
  uploads: Array<{ companyId: string; file: File }>
) => {
  if (!docTypeBulkId.value) return

  // Upload each file to its assigned company
  for (const upload of uploads) {
    await toggleDocumentStatus(upload.companyId, docTypeBulkId.value, upload.file.name)
  }
}
  
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

watch(filter, () => (currentPage.value = 1))
onMounted(() => loadData())
</script>
  