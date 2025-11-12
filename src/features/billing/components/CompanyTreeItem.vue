<template>
  <div>
    <div
      class="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
      :class="{ 'bg-blue-50': isSelected }"
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
        :expanded="expanded"
        :selected-company-id="selectedCompanyId"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CompanyNode } from '@/features/clients/types'

interface Props {
  company: CompanyNode
  expanded: Set<string>
  selectedCompanyId: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggle: [companyId: string]
  select: [companyId: string]
}>()

const isSelected = computed(() => props.selectedCompanyId === props.company.id)
</script>




