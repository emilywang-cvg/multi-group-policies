<template>
  <div>
    <div
      :class="[
        'flex items-center justify-between py-2 px-2 rounded cursor-pointer transition-colors',
        selectedCompanyId === company.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50',
      ]"
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
        <span
          :class="[
            'text-sm font-medium',
            selectedCompanyId === company.id ? 'text-blue-900' : 'text-gray-900',
          ]"
        >
          {{ company.name }}
        </span>
        <!-- Show status indicators for subsidiaries -->
        <span
          v-if="!company.children && !isReady"
          class="text-xs ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded"
          title="Not ready for issuance"
        >
          Incomplete
        </span>
        <span
          v-else-if="!company.children && isReady && currentIssuanceStatus === 'issued'"
          class="text-xs ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1"
          title="Policy issued"
        >
          <span>✅</span>
          <span>Issued</span>
        </span>
        <span
          v-else-if="!company.children && isReady"
          class="text-xs ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
          title="Not issued"
        >
          Not Issued
        </span>
      </div>
    </div>

    <div
      v-if="company.children && company.children.length > 0 && expanded.has(company.id)"
      class="ml-6 border-l-2 border-gray-200 pl-4 mt-1"
    >
      <IssuanceCompanyTreeItem
        v-for="child in company.children"
        :key="child.id"
        :company="child"
        :expanded="expanded"
        :selected-company-id="selectedCompanyId"
        :companies="companies"
        :issuance-status="props.issuanceStatus"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Company } from '@/features/document-upload/types'

interface Props {
  company: Company
  expanded: Set<string>
  selectedCompanyId: string | null
  companies: Company[]
  issuanceStatus?: Record<string, 'not-issued' | 'issued'>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggle: [companyId: string]
  select: [companyId: string]
}>()

// Get issuance status for this company
const currentIssuanceStatus = computed(() => {
  return props.issuanceStatus?.[props.company.id]
})

// For demo purposes, assume companies are ready if they have premium requested
// In a real app, this would check actual issuance readiness
const isReady = computed(() => {
  // For now, all subsidiaries are considered ready
  // This can be enhanced to check actual status
  return true
})
</script>

