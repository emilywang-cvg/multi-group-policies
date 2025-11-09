<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import type { CompanyNode } from './types'
import { useClientSearch } from './useClientSearch'
import { useSelectionStore } from '@/app/store/selection'

interface Props {
  mode: 'company' | 'individual'
}

defineProps<Props>()

const emit = defineEmits<{
  selected: [node: CompanyNode]
}>()

const router = useRouter()
const selectionStore = useSelectionStore()

const {
  query,
  loading,
  parents,
  expanded,
  selection,
  flatNodes,
  fetchParents,
  toggleExpand,
  select,
  onKeyNav,
  autoSelectById,
} = useClientSearch()

onMounted(async () => {
  await fetchParents()
  
  // Check if there's a pre-selected client ID from store
  if (selectionStore.selectedClientId) {
    await autoSelectById(selectionStore.selectedClientId)
    selectionStore.clear() // Clear after auto-selecting
  }
  
  window.addEventListener('keydown', onKeyNav)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyNav)
})

function handleSelect(node: CompanyNode) {
  select(node)
}

function handleCreateProposal() {
  if (selection.value) {
    emit('selected', selection.value)
  }
}

function handleCancel() {
  router.back()
}

function navigateToCreateClient() {
  router.push({
    path: '/clients/new',
    query: { returnTo: '/proposals/new' },
  })
}

function getParentName(node: CompanyNode): string {
  if (node.isParent) return node.name
  // Find parent
  const parent = parents.value.find(p => p.id === node.parentId)
  return parent?.name || ''
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Client</h2>

      <!-- Step Pills -->
      <div class="flex items-center space-x-2 mb-6">
        <div class="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-full">
          <span class="w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-sm font-medium rounded-full">
            1
          </span>
          <span class="text-sm font-medium text-blue-900">Client</span>
        </div>
        <div class="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full opacity-50">
          <span class="w-6 h-6 flex items-center justify-center bg-gray-400 text-white text-sm font-medium rounded-full">
            2
          </span>
          <span class="text-sm font-medium text-gray-600">Product</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200">
        <button
          class="px-4 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600"
          :class="{ 'border-blue-600 text-blue-600': mode === 'company' }"
        >
          Company Client
        </button>
        <button
          class="px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
          disabled
        >
          Individual Client
        </button>
      </div>
    </div>

    <!-- Selection Footer -->
    <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between">
        <!-- Selected Info -->
        <div class="text-sm">
          <span v-if="selection" class="text-gray-700">
            <span v-if="!selection.isParent" class="text-gray-500">
              {{ getParentName(selection) }} ›
            </span>
            <span class="font-medium">{{ selection.name }}</span>
          </span>
          <span v-else class="text-gray-400">No client selected</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-3">
          <button
            @click="handleCancel"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleCreateProposal"
            :disabled="!selection"
            :class="{
              'bg-blue-600 hover:bg-blue-700 text-white': selection,
              'bg-gray-300 text-gray-500 cursor-not-allowed': !selection,
            }"
            class="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          >
            Create Proposal
          </button>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="flex items-center space-x-2">
        <input
          v-model="query"
          type="search"
          placeholder="Search by Company Name or ID"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          @keydown.enter="fetchParents"
        />
        <button
          @click="fetchParents"
          class="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Search
        </button>
      </div>
    </div>

    <!-- Results Table -->
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="{ node, depth } in flatNodes"
              :key="node.id"
              :class="{
                'bg-blue-50 border-l-4 border-blue-600': selection?.id === node.id,
                'hover:bg-gray-50': selection?.id !== node.id,
              }"
              class="transition-colors"
            >
              <!-- ID Column -->
              <td class="px-4 py-3 text-sm text-gray-900">
                {{ node.id }}
              </td>

              <!-- Name Column -->
              <td class="px-4 py-3 text-sm">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900">{{ node.name }}</span>
                </div>
              </td>

              <!-- Status Column -->
              <td class="px-4 py-3 text-sm">
                <span
                  :class="{
                    'bg-green-100 text-green-800': node.status === 'ACTIVE',
                    'bg-red-100 text-red-800': node.status === 'INACTIVE',
                  }"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ node.status }}
                </span>
              </td>

              <!-- Action Column -->
              <td class="px-4 py-3 text-sm text-right">
                <button
                  @click="handleSelect(node)"
                  class="px-4 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  Select
                </button>
              </td>
            </tr>

            <!-- Loading State -->
            <tr v-if="loading">
              <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                <div class="flex items-center justify-center space-x-2">
                  <svg class="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="!loading && flatNodes.length === 0">
              <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                No companies found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create New Client Info -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-700">
          Still cannot find the client?
        </p>
        <button
          @click="navigateToCreateClient"
          class="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        >
          Create a new one
        </button>
      </div>
    </div>
  </div>
</template>

