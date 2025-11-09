<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { NewClientInput, CompanyNode } from '@/features/clients/types'
import * as api from '@/features/clients/api'
// import { useSelectionStore } from '@/app/store/selection'

const router = useRouter()
const route = useRoute()
// const selectionStore = useSelectionStore()

// Form data
const form = reactive<NewClientInput>({
  type: 'COMPANY',
  crNumber: '',
  name: '',
  contact: { field1: '', field2: '', field3: '', field4: '' },
  address: { field1: '', field2: '', field3: '', field4: '' },
  censusLevels: [],
  subsidiaries: [],
})

// Census levels
const showCensusForm = ref(false)
const censusLevelName = ref('')
const censusItemsText = ref('')
const editingCensusIndex = ref<number | null>(null)

function addCensusLevel() {
  if (!censusLevelName.value.trim()) return

  const items = censusItemsText.value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)

  if (items.length === 0) return

  if (editingCensusIndex.value !== null) {
    // Update existing level
    form.censusLevels![editingCensusIndex.value] = {
      levelName: censusLevelName.value.trim(),
      items,
    }
    editingCensusIndex.value = null
  } else {
    // Add new level
    form.censusLevels!.push({
      levelName: censusLevelName.value.trim(),
      items,
    })
  }

  // Reset form
  censusLevelName.value = ''
  censusItemsText.value = ''
  showCensusForm.value = false
}

function editCensusLevel(index: number) {
  const level = form.censusLevels![index]
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

function removeCensusLevel(index: number) {
  form.censusLevels!.splice(index, 1)
  // If we're editing this level, cancel edit
  if (editingCensusIndex.value === index) {
    cancelCensusEdit()
  }
}

function removeCensusItem(levelIndex: number, itemIndex: number) {
  if (!form.censusLevels || !form.censusLevels[levelIndex]) return
  
  form.censusLevels[levelIndex].items.splice(itemIndex, 1)
  
  // Remove level if no items left
  if (form.censusLevels[levelIndex].items.length === 0) {
    form.censusLevels.splice(levelIndex, 1)
  }
}

// Subsidiaries
const subsidiarySearchQuery = ref('')
const subsidiarySearchResults = ref<CompanyNode[]>([])
const subsidiarySearchLoading = ref(false)
const selectedSubsidiary = ref<CompanyNode | null>(null)

const showQuickCreateForm = ref(false)
const quickCreateName = ref('')

let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function searchSubsidiaries() {
  if (!subsidiarySearchQuery.value.trim()) {
    subsidiarySearchResults.value = []
    return
  }

  if (searchTimeout) clearTimeout(searchTimeout)

  searchTimeout = setTimeout(async () => {
    subsidiarySearchLoading.value = true
    try {
      const results = await api.searchCompanies(subsidiarySearchQuery.value)
      subsidiarySearchResults.value = results
    } catch (error) {
      console.error('Failed to search subsidiaries:', error)
    } finally {
      subsidiarySearchLoading.value = false
    }
  }, 300)
}

function selectSubsidiary(company: CompanyNode) {
  selectedSubsidiary.value = company
  subsidiarySearchResults.value = []
  subsidiarySearchQuery.value = company.name
}

function addExistingSubsidiary() {
  if (!selectedSubsidiary.value) return

  // Check for duplicates
  const exists = form.subsidiaries!.some(s => s.id === selectedSubsidiary.value!.id)
  if (exists) {
    alert('This subsidiary is already added')
    return
  }

  form.subsidiaries!.push({
    id: selectedSubsidiary.value.id,
    name: selectedSubsidiary.value.name,
    createdInline: false,
  })

  // Reset
  selectedSubsidiary.value = null
  subsidiarySearchQuery.value = ''
}

function createInlineSubsidiary() {
  if (!quickCreateName.value.trim()) return

  form.subsidiaries!.push({
    name: quickCreateName.value.trim(),
    createdInline: true,
  })

  // Reset
  quickCreateName.value = ''
  showQuickCreateForm.value = false
}

function removeSubsidiary(index: number) {
  form.subsidiaries!.splice(index, 1)
}

// Validation
const isValid = computed(() => {
  return form.name.trim().length > 0
})

const submitting = ref(false)

async function handleSubmit() {
  if (!isValid.value) {
    alert('Please fill in the Company Name')
    return
  }

  submitting.value = true
  try {
    const newCompany = await api.createCompany(form)
    console.log('Created company:', newCompany)

    // Navigate to preview page
    router.push(`/proposals/preview/${newCompany.id}`)
  } catch (error) {
    console.error('Failed to create company:', error)
    alert('Failed to create company')
  } finally {
    submitting.value = false
  }
}

function handleBack() {
  const returnTo = (route.query.returnTo as string) || '/proposals/new'
  router.push(returnTo)
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Create New Client</h1>

    <div class="space-y-6">
      <!-- Client Type -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Client Type</h3>
        <div class="space-y-2">
          <label class="flex items-center space-x-3">
            <input
              type="radio"
              :value="'COMPANY'"
              v-model="form.type"
              checked
              disabled
              class="w-4 h-4 text-blue-600"
            />
            <span class="text-sm font-medium text-gray-900">Company Client</span>
          </label>
          <label class="flex items-center space-x-3 opacity-50">
            <input
              type="radio"
              value="INDIVIDUAL"
              disabled
              class="w-4 h-4 text-gray-400"
            />
            <span class="text-sm font-medium text-gray-500">Individual Client</span>
          </label>
        </div>
      </div>

      <!-- CR Number -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">CR Number</h3>
        <input
          v-model="form.crNumber"
          type="text"
          placeholder="Enter CR number"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <!-- Basic Information -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Company Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Enter company name"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Field"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Field"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
        <div class="grid grid-cols-2 gap-4">
          <input
            v-model="form.contact!.field1"
            type="text"
            placeholder="Phone Number"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <input
            v-model="form.contact!.field2"
            type="email"
            placeholder="Email Address"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <input
            v-model="form.contact!.field3"
            type="text"
            placeholder="Contact Person"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <input
            v-model="form.contact!.field4"
            type="text"
            placeholder="Fax Number"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <!-- Address -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <div class="grid grid-cols-2 gap-4">
          <input
            v-model="form.address!.field1"
            type="text"
            placeholder="Street Address"
            class="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <input
            v-model="form.address!.field2"
            type="text"
            placeholder="City"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <input
            v-model="form.address!.field3"
            type="text"
            placeholder="State / Province"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <input
            v-model="form.address!.field4"
            type="text"
            placeholder="Postal Code"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <!-- Census Levels -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Census Levels</h3>
          <button
            @click="showCensusForm ? cancelCensusEdit() : (showCensusForm = true)"
            class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {{ showCensusForm ? 'Cancel' : 'Add' }}
          </button>
        </div>

        <!-- Census Form -->
        <div v-if="showCensusForm" class="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Level Name</label>
            <input
              v-model="censusLevelName"
              type="text"
              placeholder="e.g., Level 1, APAC Region, Division"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Items (one per line)</label>
            <textarea
              v-model="censusItemsText"
              rows="5"
              placeholder="00 - Employee&#10;01 - C level&#10;02 - Retired under 65&#10;03 - Retired over 65"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
            />
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="addCensusLevel"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {{ editingCensusIndex !== null ? 'Update Level' : 'Add Level' }}
            </button>
            <button
              v-if="editingCensusIndex !== null"
              @click="cancelCensusEdit"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Census List -->
        <div v-if="form.censusLevels && form.censusLevels.length > 0" class="space-y-4">
          <div
            v-for="(level, levelIdx) in form.censusLevels"
            :key="levelIdx"
            class="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <div class="flex items-start justify-between mb-3">
              <h4 class="text-lg font-bold text-indigo-900 uppercase">{{ level.levelName }}</h4>
              <div class="flex items-center space-x-2">
                <button
                  @click="editCensusLevel(levelIdx)"
                  class="text-gray-400 hover:text-indigo-600"
                  title="Edit"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="removeCensusLevel(levelIdx)"
                  class="text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="space-y-1">
              <div
                v-for="(item, itemIdx) in level.items"
                :key="itemIdx"
                class="text-sm text-gray-600"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subsidiary -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Subsidiary</h3>

        <div class="space-y-4">
          <!-- Search Existing -->
          <div>
            <div class="flex space-x-2 mb-2">
              <div class="flex-1 relative">
                <input
                  v-model="subsidiarySearchQuery"
                  @input="searchSubsidiaries"
                  type="text"
                  placeholder="Search existing clients by name, ID"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <!-- Search Results Dropdown -->
                <div
                  v-if="subsidiarySearchResults.length > 0"
                  class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  <button
                    v-for="result in subsidiarySearchResults"
                    :key="result.id"
                    @click="selectSubsidiary(result)"
                    class="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div class="font-medium text-gray-900">{{ result.name }}</div>
                    <div class="text-sm text-gray-500">ID: {{ result.id }}</div>
                  </button>
                </div>
              </div>
              <button
                @click="addExistingSubsidiary"
                :disabled="!selectedSubsidiary"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                Add
              </button>
            </div>
          </div>

          <!-- OR Quick Create -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div v-if="!showQuickCreateForm">
            <button
              @click="showQuickCreateForm = true"
              class="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              Create new subsidiary inline
            </button>
          </div>

          <div v-else class="p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Subsidiary Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="quickCreateName"
                type="text"
                placeholder="Enter subsidiary name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div class="flex space-x-2">
              <button
                @click="createInlineSubsidiary"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                Create
              </button>
              <button
                @click="showQuickCreateForm = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- Subsidiary List -->
          <div v-if="form.subsidiaries && form.subsidiaries.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium text-gray-700">Added Subsidiaries:</h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(sub, idx) in form.subsidiaries"
                :key="idx"
                class="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <span class="font-medium">{{ sub.name }}</span>
                <span v-if="sub.id" class="text-blue-600">{{ sub.id }}</span>
                <button
                  @click="removeSubsidiary(idx)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end space-x-3 pt-4">
        <button
          @click="handleBack"
          class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
        >
          Back to Proposal
        </button>
        <button
          @click="handleSubmit"
          :disabled="!isValid || submitting"
          class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {{ submitting ? 'Creating...' : 'Submit' }}
        </button>
      </div>
    </div>
  </div>
</template>

