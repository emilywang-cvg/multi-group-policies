<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="handleClose"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Bulk Upload Documents</h3>
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
          <p class="text-sm text-gray-600 mt-1">Company: {{ companyName }}</p>
        </div>

        <!-- Content -->
        <div class="px-6 py-4 overflow-y-auto flex-1">
          <!-- File Upload Area -->
          <div class="mb-6">
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

          <!-- File Mapping Table -->
          <div v-if="selectedFiles.length > 0" class="mb-4">
            <h4 class="text-sm font-medium text-gray-900 mb-3">
              Map files to document types:
            </h4>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">File</th>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                      Document Type
                    </th>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Size</th>
                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(file, index) in selectedFiles" :key="index" class="hover:bg-gray-50">
                    <td class="px-4 py-2">
                      <div class="flex items-center gap-2">
                        <svg
                          class="h-5 w-5 text-gray-400"
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
                        <span class="font-mono text-xs">{{ file.file.name }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-2">
                      <select
                        v-model="file.docTypeId"
                        class="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        :class="{
                          'border-red-300': !file.docTypeId,
                        }"
                      >
                        <option value="">Select document type...</option>
                        <option
                          v-for="docType in docTypes"
                          :key="docType.id"
                          :value="docType.id"
                        >
                          {{ docType.name }}
                          <span v-if="docType.required">(Required)</span>
                        </option>
                      </select>
                    </td>
                    <td class="px-4 py-2 text-xs text-gray-600">
                      {{ formatFileSize(file.file.size) }}
                    </td>
                    <td class="px-4 py-2">
                      <button
                        @click="removeFile(index)"
                        class="text-red-600 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="error"
            class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700"
          >
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
            <span v-else>Upload All ({{ selectedFiles.length }})</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DocumentType } from './types'

interface Props {
  isOpen: boolean
  companyName: string
  companyId: string | null
  docTypes: DocumentType[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  upload: [uploads: Array<{ docId: string; filename: string }>]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<Array<{ file: File; docTypeId: string }>>([])
const isDragging = ref(false)
const uploading = ref(false)
const error = ref<string | null>(null)

const canUpload = computed(() => {
  return (
    selectedFiles.value.length > 0 &&
    selectedFiles.value.every((f) => f.docTypeId) &&
    selectedFiles.value.every((f) => !validateFile(f.file))
  )
})

const handleClose = () => {
  selectedFiles.value = []
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
        selectedFiles.value.push({ file, docTypeId: '' })
      } else {
        error.value = validationError
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
        selectedFiles.value.push({ file, docTypeId: '' })
      } else {
        error.value = validationError
      }
    })
  }
}

const validateFile = (file: File): string | null => {
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return `File "${file.name}" exceeds 10MB limit`
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
    return `File "${file.name}" has invalid type. Please upload PDF, DOC, DOCX, JPG, or PNG files.`
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

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
  error.value = null
}

const handleUpload = async () => {
  if (!canUpload.value) return

  uploading.value = true
  error.value = null

  try {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const uploads = selectedFiles.value
      .filter((f) => f.docTypeId)
      .map((f) => ({
        docId: f.docTypeId,
        filename: f.file.name,
      }))

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
    error.value = null
    isDragging.value = false
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




