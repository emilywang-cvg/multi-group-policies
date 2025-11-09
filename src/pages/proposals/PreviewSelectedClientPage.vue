<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { CompanyNode } from '@/features/clients/types'
import * as api from '@/features/clients/api'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const client = ref<CompanyNode | null>(null)
const masterCompany = ref<CompanyNode | null>(null)

const clientId = computed(() => route.params.clientId as string)

// Census Levels Management
const showCensusForm = ref(false)
const censusLevelName = ref('')
const censusItemsText = ref('')
const editingCensusIndex = ref<number | null>(null)

onMounted(async () => {
  await loadClient()
})

async function loadClient() {
  loading.value = true
  try {
    const company = await api.getCompanyById(clientId.value)
    
    if (!company) {
      console.error('Company not found')
      loading.value = false
      return
    }

    client.value = company

    // If it's a parent, load children
    if (company.isParent) {
      const children = await api.listChildren(company.id)
      client.value = { ...company, children }
    } else {
      // If it's a child, load the parent
      if (company.parentId) {
        const parent = await api.getCompanyById(company.parentId)
        if (parent) {
          masterCompany.value = parent
        }
      }
    }
  } catch (error) {
    console.error('Failed to load client:', error)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push('/proposals/new')
}

function handleNext() {
  // Navigate to product selection step
  router.push({
    path: '/proposals/select-product',
    query: { clientId: clientId.value }
  })
}

function openCompanyDetail(companyId: string) {
  // Open company detail page in a new tab
  const url = `/proposals/preview/${companyId}`
  window.open(url, '_blank')
}

// Census Levels Functions
async function addCensusLevel() {
  if (!censusLevelName.value.trim() || !client.value) return

  const items = censusItemsText.value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)

  if (items.length === 0) return

  if (!client.value.censusLevels) {
    client.value.censusLevels = []
  }

  if (editingCensusIndex.value !== null) {
    // Update existing level
    client.value.censusLevels[editingCensusIndex.value] = {
      levelName: censusLevelName.value.trim(),
      items,
    }
    editingCensusIndex.value = null
  } else {
    // Add new level
    client.value.censusLevels.push({
      levelName: censusLevelName.value.trim(),
      items,
    })
  }

  // Reset form
  censusLevelName.value = ''
  censusItemsText.value = ''
  showCensusForm.value = false
  
  // Save the updated client data
  await saveClientData()
}

function editCensusLevel(index: number) {
  if (!client.value?.censusLevels) return
  
  const level = client.value.censusLevels[index]
  censusLevelName.value = level.levelName
  censusItemsText.value = level.items.join('\n')
  editingCensusIndex.value = index
  showCensusForm.value = true
}

function cancelCensusEdit() {
  censusLevelName.value = ''
  censusItemsText.value = ''
  editingCensusIndex.value = null
  showCensusForm.value = false
}

async function removeCensusLevel(index: number) {
  if (!client.value?.censusLevels) return
  
  client.value.censusLevels.splice(index, 1)
  
  // If we're editing this level, cancel edit
  if (editingCensusIndex.value === index) {
    cancelCensusEdit()
  }
  
  // Save the updated client data
  await saveClientData()
}

// Save client data to API
async function saveClientData() {
  if (!client.value) return
  
  try {
    // Update the client data in the API
    await api.updateCompany(client.value.id, {
      censusLevels: client.value.censusLevels
    })
    console.log('✅ Census levels saved for client:', client.value.name)
  } catch (error) {
    console.error('Failed to save census levels:', error)
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">New Proposal</h1>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- Client Preview -->
    <div v-else-if="client" class="space-y-6">
      <!-- Step Indicator -->
      <div class="flex items-center space-x-2 mb-6">
        <div class="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-full">
          <span class="w-6 h-6 flex items-center justify-center bg-green-600 text-white text-sm font-medium rounded-full">
            ✓
          </span>
          <span class="text-sm font-medium text-green-900">Client</span>
        </div>
        <div class="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-full">
          <span class="w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-sm font-medium rounded-full">
            2
          </span>
          <span class="text-sm font-medium text-blue-900">Product</span>
        </div>
      </div>

      <!-- Info Banner -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm text-gray-700">Wrong client?</span>
          <button
            @click="handleCancel"
            class="text-sm font-medium text-blue-600 hover:text-blue-800 underline focus:outline-none"
          >
            Re-select
          </button>
        </div>
      </div>

      <!-- Master Company (if subsidiary) -->
      <div v-if="masterCompany" class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Master Company</h3>
        <div class="space-y-2">
          <div
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            @click="openCompanyDetail(masterCompany.id)"
          >
            <div class="flex items-center space-x-3">
              <div>
                <a
                  class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {{ masterCompany.name }}
                </a>
                <div class="text-xs text-gray-500">ID: {{ masterCompany.id }}</div>
              </div>
            </div>
            <span
              :class="{
                'bg-green-100 text-green-800': masterCompany.status === 'ACTIVE',
                'bg-red-100 text-red-800': masterCompany.status === 'INACTIVE',
              }"
              class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            >
              {{ masterCompany.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Client Info -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Client Info</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Client ID</label>
            <div class="text-sm font-medium text-gray-900">{{ client.id }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Company Name</label>
            <div class="text-sm font-medium text-gray-900">{{ client.name }}</div>
          </div>
          <div v-if="client.crNumber">
            <label class="block text-sm text-gray-600 mb-1">CR Number</label>
            <div class="text-sm font-medium text-gray-900">{{ client.crNumber }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Status</label>
            <span
              :class="{
                'bg-green-100 text-green-800': client.status === 'ACTIVE',
                'bg-red-100 text-red-800': client.status === 'INACTIVE',
              }"
              class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            >
              {{ client.status }}
            </span>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Type</label>
            <div class="text-sm font-medium text-gray-900">
              {{ client.isParent ? 'Master Company' : 'Subsidiary' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Phone Number</label>
            <div class="text-sm" :class="client.contact?.field1 ? 'text-gray-900' : 'text-gray-400'">
              {{ client.contact?.field1 || '+852 1234 5678' }}
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Email Address</label>
            <div class="text-sm" :class="client.contact?.field2 ? 'text-gray-900' : 'text-gray-400'">
              {{ client.contact?.field2 || 'contact@company.com' }}
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Contact Person</label>
            <div class="text-sm" :class="client.contact?.field3 ? 'text-gray-900' : 'text-gray-400'">
              {{ client.contact?.field3 || 'John Doe' }}
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Fax Number</label>
            <div class="text-sm" :class="client.contact?.field4 ? 'text-gray-900' : 'text-gray-400'">
              {{ client.contact?.field4 || '+852 1234 5679' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Address -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm text-gray-600 mb-1">Street Address</label>
            <div class="text-sm" :class="client.address?.field1 ? 'text-gray-900' : 'text-gray-400'">
              {{ client.address?.field1 || '123 Main Street, Suite 100' }}
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">City</label>
            <div class="text-sm" :class="client.address?.field2 ? 'text-gray-900' : 'text-gray-400'">
              {{ client.address?.field2 || 'Hong Kong' }}
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">State / Province</label>
            <div class="text-sm" :class="client.address?.field3 ? 'text-gray-900' : 'text-gray-400'">
              {{ client.address?.field3 || 'Kowloon' }}
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Postal Code</label>
            <div class="text-sm" :class="client.address?.field4 ? 'text-gray-900' : 'text-gray-400'">
              {{ client.address?.field4 || '999077' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Census Levels -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Census Levels</h3>
          <button
            @click="showCensusForm ? cancelCensusEdit() : (showCensusForm = true)"
            type="button"
            class="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded hover:bg-indigo-50 transition-colors"
          >
            {{ showCensusForm ? 'Cancel' : 'Add' }}
          </button>
        </div>

        <!-- Add/Edit Census Level Form -->
        <div v-if="showCensusForm" class="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Level Name</label>
              <input
                v-model="censusLevelName"
                type="text"
                placeholder="e.g., Level 1, APAC Region, Division A"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Items (one per line)</label>
              <textarea
                v-model="censusItemsText"
                rows="4"
                placeholder="e.g.,&#10;Dev team&#10;Design team&#10;BA team"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
              />
            </div>
            <button
              @click="addCensusLevel"
              type="button"
              class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors"
            >
              {{ editingCensusIndex !== null ? 'Update Level' : 'Add Level' }}
            </button>
          </div>
        </div>

        <!-- Display Census Levels -->
        <div v-if="client.censusLevels && client.censusLevels.length > 0" class="space-y-4">
          <div
            v-for="(level, idx) in client.censusLevels"
            :key="idx"
            class="p-4 border border-gray-200 rounded-lg bg-white"
          >
            <div class="flex items-start justify-between mb-3">
              <h4 class="text-sm font-bold text-indigo-600 uppercase">{{ level.levelName }}</h4>
              <div class="flex items-center space-x-2">
                <button
                  @click="editCensusLevel(idx)"
                  type="button"
                  class="text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Edit"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="removeCensusLevel(idx)"
                  type="button"
                  class="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="space-y-1">
              <div
                v-for="(item, itemIdx) in level.items"
                :key="itemIdx"
                class="text-sm text-gray-700 pl-3"
              >
                • {{ item }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-gray-500 text-center py-4">
          No census levels defined
        </div>
      </div>

      <!-- Subsidiary (only for master companies) -->
      <div v-if="client.isParent && client.children && client.children.length > 0" class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Subsidiary</h3>
        <div class="space-y-2">
          <div
            v-for="child in client.children"
            :key="child.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            @click="openCompanyDetail(child.id)"
          >
            <div class="flex items-center space-x-3">
              <div>
                <a
                  class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {{ child.name }}
                </a>
                <div class="text-xs text-gray-500">ID: {{ child.id }}</div>
              </div>
            </div>
            <span
              :class="{
                'bg-green-100 text-green-800': child.status === 'ACTIVE',
                'bg-red-100 text-red-800': child.status === 'INACTIVE',
              }"
              class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
            >
              {{ child.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Active Proposals -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Active Proposals</h3>
        <div class="text-sm text-gray-500 text-center py-4">
          No active proposals
        </div>
      </div>

      <!-- Active Policies -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Active Policies</h3>
        <div class="text-sm text-gray-500 text-center py-4">
          Group Medical
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          @click="handleCancel"
          class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleNext"
          class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <p class="text-gray-500">Client not found</p>
      <button
        @click="handleCancel"
        class="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Back to Client Selection
      </button>
    </div>
  </div>
</template>

