<template>
  <div>
    <div
      class="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50 cursor-pointer"
      @click="$emit('select', company.id)"
    >
      <div class="flex items-center gap-2 flex-1">
        <button
          v-if="company.children && company.children.length > 0"
          @click.stop="$emit('toggle', company.id)"
          class="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
        >
          <span class="text-xs">{{ expanded.has(company.id) ? '▼' : '▶' }}</span>
        </button>
        <span v-else class="w-5"></span>
        <span class="text-sm font-medium text-gray-900">{{ company.name }}</span>
        <span
          v-if="status.total > 0 && status.missing > 0"
          class="text-xs ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded"
          :title="`Missing: ${status.missingDocs.join(', ')}`"
        >
          {{ status.missing }} missing
        </span>
        <span v-else-if="status.total > 0 && status.uploaded === status.total" class="text-xs ml-2">
          ✅
        </span>
      </div>
    </div>

    <div
      v-if="company.children && company.children.length > 0 && expanded.has(company.id)"
      class="ml-6 border-l-2 border-gray-200 pl-4 mt-1"
    >
      <CompanyTreeItem
        v-for="child in company.children"
        :key="child.id"
        :company="child"
        :statuses="statuses"
        :docTypes="docTypes"
        :expanded="expanded"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Company, DocumentType, DocumentStatus } from './types'

interface Props {
  company: Company
  statuses: DocumentStatus[]
  docTypes: DocumentType[]
  expanded: Set<string>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggle: [companyId: string]
  select: [companyId: string]
}>()

const status = computed(() => {
  const companyStatuses = props.statuses.filter((s) => s.companyId === props.company.id)
  const requiredDocs = props.docTypes.filter((dt) => dt.required)
  const requiredIds = new Set(requiredDocs.map((dt) => dt.id))
  const requiredStatuses = companyStatuses.filter((s) => requiredIds.has(s.documentId))
  const uploaded = requiredStatuses.filter((s) => s.status === 'uploaded').length
  const total = requiredStatuses.length
  const missing = total - uploaded
  
  // Get list of missing document names
  const missingDocs = requiredDocs
    .filter((dt) => {
      const status = companyStatuses.find((s) => s.documentId === dt.id)
      return !status || status.status !== 'uploaded'
    })
    .map((dt) => dt.name)

  return { uploaded, total, missing, missingDocs }
})
</script>
