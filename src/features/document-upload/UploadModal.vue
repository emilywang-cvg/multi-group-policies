<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="handleClose"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Upload Document</h3>
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
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <div class="mb-4 space-y-2">
            <div>
              <span class="text-sm text-gray-600">Company:</span>
              <p class="text-sm font-medium text-gray-900">{{ companyName }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-600">Document Type:</span>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-sm font-medium text-gray-900">{{ docTypeName }}</p>
                <span
                  v-if="isRequired"
                  class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded"
                >
                  Required
                </span>
                <span v-else class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
            </div>
          </div>

          <!-- File Upload Area -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select File
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
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                @change="handleFileSelect"
              />
              <div v-if="!selectedFile">
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
                  or drag and drop
                </p>
                <p class="mt-1 text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG (max 10MB)
                </p>
              </div>
              <div v-else class="text-left">
                <div class="flex items-center justify-between bg-gray-50 rounded p-2">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <svg
                      class="h-5 w-5 text-gray-400 flex-shrink-0"
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
                    <span class="text-sm text-gray-900 truncate">{{ selectedFile.name }}</span>
                    <span class="text-xs text-gray-500 flex-shrink-0">
                      ({{ formatFileSize(selectedFile.size) }})
                    </span>
                  </div>
                  <button
                    @click="selectedFile = null"
                    class="ml-2 text-gray-400 hover:text-gray-600"
                    aria-label="Remove file"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {{ error }}
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            @click="handleClose"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleUpload"
            :disabled="!selectedFile || uploading"
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
            <span v-else>Upload</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  isOpen: boolean
  companyName: string
  docTypeName: string
  isRequired: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  upload: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const error = ref<string | null>(null)

const handleClose = () => {
  selectedFile.value = null
  error.value = null
  isDragging.value = false
  emit('close')
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    validateFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    validateFile(event.dataTransfer.files[0])
  }
}

const validateFile = (file: File) => {
  error.value = null

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    error.value = 'File size exceeds 10MB limit'
    return
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
    error.value = 'Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.'
    return
  }

  selectedFile.value = file
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleUpload = async () => {
  if (!selectedFile.value) return

  uploading.value = true
  error.value = null

  try {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    emit('upload', selectedFile.value)
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
    selectedFile.value = null
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




