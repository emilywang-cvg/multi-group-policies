<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50"
      @click.self="handleClose"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Bulk Upload {{ docTypeName }}</h3>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
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
          <p class="text-sm text-gray-600 mt-1">
            Upload {{ docTypeName }} to all companies that require it
          </p>
        </div>

        <!-- Content -->
        <div class="px-6 py-4 overflow-y-auto flex-1">
          <div class="mb-4">
            <p class="text-sm text-gray-700 mb-3">
              Upload <strong>{{ docTypeName }}</strong> for <strong>{{ companiesNeedingUpload.length }}</strong> companies.
              Select one file per company.
            </p>
            
            <!-- File Upload Area -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Select Files
              </label>
              <div
                class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                :class="{ 'border-blue-400 bg-blue-50': isDragging }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  class="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  @change="handleFileSelect"
                />
                <svg
                  class="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <p class="mt-2 text-sm text-gray-600">
                  <button
                    @click="fileInput?.click()"
                    class="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Click to upload
                  </button>
                  or drag and drop multiple files
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG (max 10MB per file)
                </p>
              </div>
            </div>

            <!-- File to Company Mapping -->
            <div v-if="selectedFiles.length > 0" class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 class="text-sm font-medium text-gray-900">Map files to companies:</h4>
              </div>
              <div class="max-h-60 overflow-y-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 sticky top-0">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Company</th>
                      <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">File</th>
                      <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr
                      v-for="company in companiesNeedingUpload"
                      :key="company.id"
                      class="hover:bg-gray-50"
                    >
                      <td class="px-4 py-2">
                        <span class="text-sm font-medium text-gray-900">{{ company.name }}</span>
                      </td>
                      <td class="px-4 py-2">
                        <select
                          v-model="fileMapping[company.id]"
                          class="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          :class="{
                            'border-red-300': !fileMapping[company.id],
                          }"
                        >
                          <option value="">Select file...</option>
                          <option
                            v-for="(file, index) in selectedFiles"
                            :key="index"
                            :value="index"
                          >
                            {{ file.name }} ({{ formatFileSize(file.size) }})
                          </option>
                        </select>
                      </td>
                      <td class="px-4 py-2">
                        <span
                          v-if="fileMapping[company.id] !== undefined && fileMapping[company.id] !== ''"
                          class="text-xs text-green-600"
                        >
                          ✓
                        </span>
                        <span v-else class="text-xs text-red-600">Required</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {{ error }}
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button
            @click="handleClose"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleUpload"
            :disabled="!canUpload || uploading"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <span v-if="uploading" class="flex items-center gap-2">
              <svg
                class="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Uploading...
            </span>
            <span v-else>Upload All ({{ companiesNeedingUpload.length }})</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Company, DocumentStatus } from './types'

interface Props {
  isOpen: boolean
  docTypeName: string
  docTypeId: string | null
  companies: Company[]
  statuses: DocumentStatus[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  upload: [uploads: Array<{ companyId: string; file: File }>]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const fileMapping = ref<Record<string, string>>({})
const isDragging = ref(false)
const uploading = ref(false)
const error = ref<string | null>(null)

const companiesNeedingUpload = computed(() => {
  if (!props.docTypeId) return []
  
  return props.companies.filter((company) => {
    const status = props.statuses.find(
      (s) => s.companyId === company.id && s.documentId === props.docTypeId
    )
    return !status || status.status !== 'uploaded'
  })
})

const canUpload = computed(() => {
  return (
    selectedFiles.value.length > 0 &&
    companiesNeedingUpload.value.every((company) => fileMapping.value[company.id] !== undefined && fileMapping.value[company.id] !== '')
  )
})

const handleClose = () => {
  selectedFiles.value = []
  fileMapping.value = {}
  error.value = null
  isDragging.value = false
  emit('close')
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    Array.from(target.files).forEach((file) => {
      const validationError = validateFile(file)
      if (!validationError) {
        selectedFiles.value.push(file)
      }
    })
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    Array.from(event.dataTransfer.files).forEach((file) => {
      const validationError = validateFile(file)
      if (!validationError) {
        selectedFiles.value.push(file)
      }
    })
  }
}

const validateFile = (file: File): string | null => {
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    error.value = `File "${file.name}" exceeds 10MB limit`
    return error.value
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ]
  if (!allowedTypes.includes(file.type)) {
    error.value = `File "${file.name}" has invalid type. Please upload PDF, DOC, DOCX, JPG, or PNG files.`
    return error.value
  }

  return null
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleUpload = async () => {
  if (!canUpload.value) return

  uploading.value = true
  error.value = null

  try {
    // Prepare uploads with company-file mappings
    const uploads: Array<{ companyId: string; file: File }> = []
    
    for (const company of companiesNeedingUpload.value) {
      const fileIndex = fileMapping.value[company.id]
      if (fileIndex !== undefined && fileIndex !== '' && selectedFiles.value[parseInt(fileIndex)]) {
        uploads.push({
          companyId: company.id,
          file: selectedFiles.value[parseInt(fileIndex)],
        })
      }
    }

    // Emit upload event with all mappings
    emit('upload', uploads)
    handleClose()
  } catch (err) {
    error.value = 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

// Reset when modal closes
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    selectedFiles.value = []
    fileMapping.value = {}
    error.value = null
    isDragging.value = false
  } else {
    // Initialize file mapping for all companies needing upload
    const mapping: Record<string, string> = {}
    companiesNeedingUpload.value.forEach((company) => {
      mapping[company.id] = ''
    })
    fileMapping.value = mapping
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>

