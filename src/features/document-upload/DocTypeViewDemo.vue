<template>
  <div class="p-6 relative">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Document Upload - Document Type View</h1>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Loading...</p>
    </div>

    <div v-else class="relative">
      <!-- Document Types List (always visible) -->
      <div class="space-y-4">
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input
              v-model="showMissingOnlyInList"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show Missing Only</span>
          </label>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div
            v-for="docType in filteredDocTypes"
            :key="docType.id"
            class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="selectedDocType = docType"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-semibold text-gray-900">{{ docType.name }}</h3>
              <span
                v-if="docType.required"
                class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
              >
                Required
              </span>
              <span v-else class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                Optional
              </span>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm text-gray-600">
                <span>Completion</span>
                <span>{{ getCompletion(docType.id).uploaded }} / {{ getCompletion(docType.id).total }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  :class="[
                    'h-2 rounded-full transition-all duration-300',
                    getCompletion(docType.id).percentage === 100 
                      ? 'bg-green-600' 
                      : 'bg-blue-600'
                  ]"
                  :style="{ width: getCompletion(docType.id).percentage + '%' }"
                ></div>
              </div>
              <div class="text-xs text-gray-500">
                {{ getCompletion(docType.id).percentage }}% complete
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Modal -->
        <UploadModal
          :isOpen="modalOpen"
          :companyName="modalCompanyName"
          :docTypeName="modalDocTypeName"
          :isRequired="modalIsRequired"
          @close="modalOpen = false"
          @upload="handleModalUpload"
        />
      </div>

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

      <!-- Drawer Overlay -->
      <Transition name="overlay">
        <div
          v-if="selectedDocType"
          class="fixed inset-0 bg-black bg-opacity-50 z-40"
          @click="selectedDocType = null"
        ></div>
      </Transition>

      <!-- Drawer Panel -->
      <Transition name="drawer">
        <div
          v-if="selectedDocType"
          class="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
          @click.stop
        >
          <div class="p-6">
            <!-- Drawer Header -->
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">{{ selectedDocType.name }}</h2>
              <div class="flex items-center gap-3">
                <button
                  v-if="selectedDocType.required"
                  @click="openBulkUploadForDocType"
                  class="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Bulk Upload
                </button>
                <button
                  @click="selectedDocType = null"
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close drawer"
                >
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Detail Panel -->
            <div class="space-y-4">
              <div class="flex items-center gap-4 mb-4">
                <div class="flex-1">
                  <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{{ completion.uploaded }} / {{ completion.total }} uploaded</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      :class="[
                        'h-2 rounded-full transition-all duration-300',
                        completion.percentage === 100 
                          ? 'bg-green-600' 
                          : 'bg-blue-600'
                      ]"
                      :style="{ width: completion.percentage + '%' }"
                    ></div>
                  </div>
                </div>
                <span
                  v-if="selectedDocType.required"
                  class="text-xs bg-red-100 text-red-700 px-3 py-1 rounded"
                >
                  Required
                </span>
                <span v-else class="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded">
                  Optional
                </span>
              </div>

              <!-- Filter -->
              <div class="mb-4">
                <label class="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    v-model="showMissingOnly"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Show Missing Only</span>
                </label>
              </div>

              <!-- Company Table -->
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <table class="w-full border-collapse">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Company & Status
                      </th>
                      <th class="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-blue-50">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="company in filteredCompanies"
                      :key="company.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="border border-gray-200 px-4 py-3">
                        <div class="flex items-center gap-3 flex-wrap">
                          <span class="text-sm font-medium text-gray-900">{{ company.name }}</span>
                          <!-- Status Badge -->
                          <div
                            v-if="getStatus(company.id, selectedDocType.id)?.status === 'uploaded'"
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-300 bg-green-50 text-green-700 text-xs font-medium"
                          >
                            <svg
                              class="w-3 h-3"
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
                          <span
                            v-else
                            :class="[
                              'px-2.5 py-1 rounded text-xs font-medium',
                              selectedDocType.required
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            ]"
                          >
                            {{ selectedDocType.required ? 'Missing' : 'Optional' }}
                          </span>
                          <!-- Filename display -->
                          <div
                            v-if="getStatus(company.id, selectedDocType.id)?.status === 'uploaded' && getStatus(company.id, selectedDocType.id)?.filename"
                            class="flex items-center gap-1.5 text-xs text-gray-600"
                          >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span class="font-mono text-gray-700">{{ getStatus(company.id, selectedDocType.id)?.filename }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="border border-gray-200 px-4 py-3 text-center">
                        <!-- Upload Button -->
                        <button
                          v-if="getStatus(company.id, selectedDocType.id)?.status !== 'uploaded'"
                          @click="openUploadModal(company.id, selectedDocType.id, company.name)"
                          class="px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm hover:shadow-md"
                          :class="[
                            selectedDocType.required
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700',
                          ]"
                        >
                          Upload
                        </button>
                        <span
                          v-else
                          class="text-xs text-gray-400 italic"
                        >
                          Complete
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDocuments } from './useDocuments'
import UploadModal from './UploadModal.vue'
import DocTypeBulkUploadModal from './DocTypeBulkUploadModal.vue'
import type { Company, DocumentType, DocumentStatus } from './types'

const {
  companies,
  docTypes,
  statuses,
  loading,
  loadData,
  toggleStatus: toggleDocumentStatus,
  getDocForType,
} = useDocuments()

const selectedDocType = ref<DocumentType | null>(null)
const showMissingOnly = ref(false)
const showMissingOnlyInList = ref(false)

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

// Flatten companies for table display
const allCompanies = computed(() => {
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

const filteredCompanies = computed(() => {
  if (!selectedDocType.value) return []
  if (!showMissingOnly.value) return allCompanies.value

  return allCompanies.value.filter((company) => {
    const status = getStatus(company.id, selectedDocType.value!.id)
    return status?.status !== 'uploaded'
  })
})

const filteredDocTypes = computed(() => {
  if (!showMissingOnlyInList.value) return docTypes.value

  return docTypes.value.filter((docType) => {
    const completion = getCompletion(docType.id)
    return completion.uploaded < completion.total
  })
})

const getCompletion = (docId: string) => {
  const docStatuses = getDocForType(docId)
  const total = docStatuses.length
  const uploaded = docStatuses.filter((s) => s.status === 'uploaded').length
  return {
    uploaded,
    total,
    percentage: total > 0 ? Math.round((uploaded / total) * 100) : 0,
  }
}

const completion = computed(() => {
  if (!selectedDocType.value) return { uploaded: 0, total: 0, percentage: 0 }
  return getCompletion(selectedDocType.value.id)
})

const getStatus = (companyId: string, docId: string): DocumentStatus | undefined => {
  return statuses.value.find((s) => s.companyId === companyId && s.documentId === docId)
}

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

const openBulkUploadForDocType = () => {
  if (!selectedDocType.value) return
  
  docTypeBulkId.value = selectedDocType.value.id
  docTypeBulkName.value = selectedDocType.value.name
  docTypeBulkModalOpen.value = true
}

const handleDocTypeBulkUpload = async (
  uploads: Array<{ companyId: string; file: File }>
) => {
  if (!selectedDocType.value) return

  // Upload each file to its assigned company
  for (const upload of uploads) {
    await toggleDocumentStatus(upload.companyId, selectedDocType.value.id, upload.file.name)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* Drawer transitions */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}

.drawer-enter-from {
  transform: translateX(100%);
}

.drawer-leave-to {
  transform: translateX(100%);
}
</style>
