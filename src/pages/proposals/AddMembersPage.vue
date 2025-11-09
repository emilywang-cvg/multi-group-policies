<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Offer } from '@/features/proposals/types'
import type { CompanyNode } from '@/features/clients/types'
import * as proposalApi from '@/features/proposals/api'
import * as clientsApi from '@/features/clients/api'
import * as membersApi from '@/features/members/api'

const router = useRouter()
const route = useRoute()

const proposalId = computed(() => route.params.proposalId as string)
const offerId = computed(() => route.query.offerId as string)

const loading = ref(true)
const offer = ref<Offer | null>(null)
const client = ref<CompanyNode | null>(null)
const availableCompanies = ref<CompanyNode[]>([])

// Form state
const memberForm = ref({
  classId: '',
  companyId: '',
  censusLevel: '',
  censusLevelCategory: '', // New field for category selection
  censusLevelItem: '', // New field for item selection
  firstName: '',
  lastName: '',
  nationality: '',
  dateOfBirth: '',
  gender: '' as 'Male' | 'Female' | 'Other' | '',
  plan: '',
})

const selectedClass = computed(() => {
  return offer.value?.classes.find(c => c.id === memberForm.value.classId)
})

const selectedCompany = computed(() => {
  return availableCompanies.value.find(c => c.id === memberForm.value.companyId)
})

const censusLevels = computed(() => {
  if (!selectedCompany.value?.censusLevels) {
    console.log('🔍 No census levels for company:', selectedCompany.value?.name)
    return []
  }
  const levelNames = selectedCompany.value.censusLevels.map(level => level.levelName)
  console.log('📋 Census levels for', selectedCompany.value.name, ':', levelNames)
  return levelNames
})

// Get available census level categories (level names)
const censusLevelCategories = computed(() => {
  if (!selectedCompany.value?.censusLevels) return []
  return selectedCompany.value.censusLevels.map(level => level.levelName)
})

// Get available items for the selected category
const censusLevelItems = computed(() => {
  if (!memberForm.value.censusLevelCategory || !selectedCompany.value?.censusLevels) return []
  const selectedLevel = selectedCompany.value.censusLevels.find(
    level => level.levelName === memberForm.value.censusLevelCategory
  )
  return selectedLevel?.items || []
})

onMounted(async () => {
  await loadData()
})

// Watch for company selection changes and reset census level
watch(() => memberForm.value.companyId, () => {
  memberForm.value.censusLevel = ''
  memberForm.value.censusLevelCategory = ''
  memberForm.value.censusLevelItem = ''
})

// Watch for category selection changes and reset item selection
watch(() => memberForm.value.censusLevelCategory, () => {
  memberForm.value.censusLevelItem = ''
  updateCensusLevel()
})

// Watch for item selection changes and update the final census level
watch(() => memberForm.value.censusLevelItem, () => {
  updateCensusLevel()
})

// Function to update the final census level value
function updateCensusLevel() {
  if (memberForm.value.censusLevelCategory && memberForm.value.censusLevelItem) {
    memberForm.value.censusLevel = `${memberForm.value.censusLevelCategory}: ${memberForm.value.censusLevelItem}`
  } else {
    memberForm.value.censusLevel = ''
  }
}

async function loadData() {
  loading.value = true
  try {
    // Load proposal and offer
    const proposal = await proposalApi.getProposalById(proposalId.value)
    if (proposal) {
      offer.value = proposal.offers.find(o => o.id === offerId.value) || null
      
      // Load client data
      const clientData = await clientsApi.getCompanyById(proposal.clientId)
      if (clientData) {
        client.value = clientData
        
        // Build available companies list (parent + subsidiaries)
        availableCompanies.value = [clientData]
        
        // Load full data for each subsidiary (including census levels)
        if (clientData.children && clientData.children.length > 0) {
          const subsidiaryPromises = clientData.children.map(child => 
            clientsApi.getCompanyById(child.id)
          )
          const subsidiaries = await Promise.all(subsidiaryPromises)
          const validSubsidiaries = subsidiaries.filter((s): s is CompanyNode => s !== null)
          availableCompanies.value.push(...validSubsidiaries)
          
          console.log('📊 Loaded companies with census levels:', availableCompanies.value.map(c => ({
            name: c.name,
            id: c.id,
            censusLevels: c.censusLevels?.length || 0
          })))
        }
      }
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push(`/proposals/${proposalId.value}`)
}

async function handleSubmit() {
  // Validation
  if (!memberForm.value.classId || !memberForm.value.companyId || 
      !memberForm.value.firstName.trim() || !memberForm.value.lastName.trim()) {
    return
  }

  loading.value = true
  try {
    const newMember = await membersApi.createMember({
      offerId: offerId.value,
      classId: memberForm.value.classId,
      companyId: memberForm.value.companyId,
      censusLevel: memberForm.value.censusLevel || undefined,
      firstName: memberForm.value.firstName,
      lastName: memberForm.value.lastName,
      nationality: memberForm.value.nationality || undefined,
      dateOfBirth: memberForm.value.dateOfBirth || undefined,
      gender: memberForm.value.gender || undefined,
      plan: memberForm.value.plan || undefined,
      relationship: 'Employee', // Default to Employee for now
    })

    // Update with class and company names
    if (selectedClass.value) {
      newMember.className = selectedClass.value.name
    }
    if (selectedCompany.value) {
      newMember.companyName = selectedCompany.value.name
    }

    console.log('Member created successfully:', newMember)
    
    // Navigate back to proposal detail
    router.push(`/proposals/${proposalId.value}`)
  } catch (error) {
    console.error('Failed to create member:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto p-6">
    <!-- Breadcrumb -->
    <div class="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      <a href="#" class="hover:text-gray-700">Proposals</a>
      <span>/</span>
      <a href="#" class="hover:text-gray-700">Proposal Detail</a>
      <span>/</span>
      <a href="#" class="hover:text-gray-700">Members</a>
      <span>/</span>
      <span class="text-gray-900">Add Members</span>
    </div>

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Add Members</h1>
      <button @click="handleCancel" class="flex items-center text-blue-600 hover:text-blue-800">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Members list
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Loading...</p>
    </div>

    <!-- Form -->
    <div v-else class="bg-white border border-gray-200 rounded-lg p-6">
      <div class="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <h2 class="text-lg font-semibold text-blue-600">Member 1</h2>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-6">
          <!-- Class -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              v-model="memberForm.classId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select</option>
              <option v-for="classItem in offer?.classes" :key="classItem.id" :value="classItem.id">
                {{ classItem.name }}
              </option>
            </select>
          </div>

          <!-- Company -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <select
              v-model="memberForm.companyId"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select</option>
              <option v-for="company in availableCompanies" :key="company.id" :value="company.id">
                {{ company.name }}
              </option>
            </select>
          </div>

          <!-- Census Level Category -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Census Level Category</label>
            <select
              v-model="memberForm.censusLevelCategory"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :disabled="!selectedCompany || censusLevelCategories.length === 0"
            >
              <option value="">{{ selectedCompany && censusLevelCategories.length === 0 ? 'No census levels defined for this company' : 'Select Category' }}</option>
              <option v-for="category in censusLevelCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>

          <!-- Census Level Item -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Census Level Item</label>
            <select
              v-model="memberForm.censusLevelItem"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :disabled="!memberForm.censusLevelCategory || censusLevelItems.length === 0"
            >
              <option value="">{{ !memberForm.censusLevelCategory ? 'Select category first' : censusLevelItems.length === 0 ? 'No items available' : 'Select Item' }}</option>
              <option v-for="item in censusLevelItems" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>

          <!-- Census Level Preview -->
          <div v-if="memberForm.censusLevel" class="col-span-2">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm font-medium text-blue-800">Selected Census Level:</span>
                <span class="text-sm text-blue-700">{{ memberForm.censusLevel }}</span>
              </div>
            </div>
          </div>

          <!-- First Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              v-model="memberForm.firstName"
              type="text"
              placeholder="Input"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              v-model="memberForm.lastName"
              type="text"
              placeholder="Input"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <!-- Nationality -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
            <input
              v-model="memberForm.nationality"
              type="text"
              placeholder="Input"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Date of Birth -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              v-model="memberForm.dateOfBirth"
              type="date"
              placeholder="Input"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Gender -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              v-model="memberForm.gender"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- Plan -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <select
              v-model="memberForm.plan"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select</option>
              <option>Basic Plan</option>
              <option>Standard Plan</option>
              <option>Premium Plan</option>
              <option>VIP Plan</option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            @click="handleCancel"
            class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

