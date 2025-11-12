<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Proposal, Offer } from '@/features/proposals/types'
import type { Plan } from '@/features/benefits/types'
import type { CensusSummary } from '@/features/members/types'
import type { CompanyNode } from '@/features/clients/types'
import type { Agent } from '@/features/products/types'
import * as proposalApi from '@/features/proposals/api'
import * as benefitsApi from '@/features/benefits/api'
import * as membersApi from '@/features/members/api'
import * as clientApi from '@/features/clients/api'
import * as productsApi from '@/features/products/api'
import BillingPlanTreeView from '@/features/billing/components/BillingPlanTreeView.vue'

const router = useRouter()
const route = useRoute()

const proposalId = computed(() => route.params.proposalId as string)

const loading = ref(true)
const proposal = ref<Proposal | null>(null)
const activeTab = ref<'offer-management' | 'case-info' | 'proposal-flow'>('offer-management')
const expandedOffers = ref<Record<string, boolean>>({})
const editingPolicyFields = ref<Record<string, boolean>>({})
const policyFieldsForm = ref<Record<string, { startDate: string; endDate: string; requiredField: string }>>({})

// Class pagination
const classesPerPage = 3
const currentClassPage = ref<Record<string, number>>({}) // page per offer

// Census Summary
const censusSummaries = ref<Record<string, CensusSummary[]>>({}) // keyed by offerId

// Case Info Tab State
const editingAgentInfo = ref(false)
const editingClientInfo = ref(false)
const editingDocuments = ref(false)
const subsidiaryPage = ref(1)
const subsidiaryPageSize = ref(10)
const currentClient = ref<CompanyNode | null>(null)
const masterCompany = ref<CompanyNode | null>(null)
const subsidiaries = ref<CompanyNode[]>([])
const loadingSubsidiaries = ref(false)
const primaryAgent = ref<Agent | null>(null)

// Create Class Modal
const showCreateClassModal = ref(false)
const currentOfferId = ref<string | null>(null)
const plans = ref<Plan[]>([])
const createClassForm = ref({
  className: '',
  planId: '',
  benefits: [] as Array<{ benefitId: string; value: string }>,
})
const selectedPlan = ref<Plan | null>(null)

onMounted(async () => {
  await loadProposal()
  plans.value = await benefitsApi.listPlans()
})

// Watch for plan selection changes
watch(() => createClassForm.value.planId, async (newPlanId) => {
  if (newPlanId) {
    const plan = await benefitsApi.getPlanById(newPlanId)
    selectedPlan.value = plan
    
    // Initialize benefit form fields with default values
    if (plan) {
      createClassForm.value.benefits = plan.benefits.map(b => ({
        benefitId: b.id,
        value: b.defaultValue || '',
      }))
    }
  } else {
    selectedPlan.value = null
    createClassForm.value.benefits = []
  }
})

// Watch proposal to update browser tab title
watch(proposal, (newProposal) => {
  if (newProposal) {
    document.title = `Proposal Detail ${newProposal.id} - Multi Group Policies`
  }
}, { immediate: true })

async function loadProposal() {
  loading.value = true
  try {
    console.log('📄 ProposalDetailPage: Loading proposal with ID:', proposalId.value)
    const data = await proposalApi.getProposalById(proposalId.value)
    console.log('📄 ProposalDetailPage: Loaded data:', data ? '✅ Success' : '❌ Null')
    proposal.value = data
    
    // Expand first offer by default and initialize forms
    if (data && data.offers.length > 0) {
      expandedOffers.value[data.offers[0].id] = true
      
      // Initialize policy fields forms and load census summaries for each offer
      for (const offer of data.offers) {
        // If product is not set in policyInfo, populate it from proposal.productName
        if (!offer.policyInfo?.product && data.productName) {
          if (!offer.policyInfo) {
            offer.policyInfo = { product: '', policyStartDate: '', policyEndDate: '' }
          }
          offer.policyInfo.product = data.productName
          // Save the updated proposal
          await proposalApi.updateProposal(data.id, { offers: data.offers })
        }
        
        // Initialize classesEnabled to true if not set (default enabled)
        if (offer.classesEnabled === undefined) {
          offer.classesEnabled = true
        }
        
        policyFieldsForm.value[offer.id] = {
          startDate: offer.policyInfo?.policyStartDate || '',
          endDate: offer.policyInfo?.policyEndDate || '',
          requiredField: offer.policyInfo?.product || data.productName || '',
        }
        
        // Initialize class pagination
        currentClassPage.value[offer.id] = 1
        
        // Load census summary
        const summary = await membersApi.getCensusSummaryByOfferId(offer.id)
        censusSummaries.value[offer.id] = summary
      }
    }
    
    // Load master company and subsidiaries for Case Info tab
    if (data && data.clientId) {
      await loadMasterCompanyAndSubsidiaries(data.clientId)
    }
    
    // Load primary agent details
    if (data && data.agentId) {
      const agent = await productsApi.getAgentById(data.agentId)
      primaryAgent.value = agent
    } else {
      primaryAgent.value = null
    }
  } catch (error) {
    console.error('Failed to load proposal:', error)
  } finally {
    loading.value = false
  }
}

async function loadMasterCompanyAndSubsidiaries(clientId: string) {
  loadingSubsidiaries.value = true
  try {
    // Load the current client
    const company = await clientApi.getCompanyById(clientId)
    if (company) {
      currentClient.value = company
      
      // If it's a parent company (master), load its children (subsidiaries)
      if (company.isParent) {
        masterCompany.value = null
        subsidiaries.value = await clientApi.listChildren(clientId)
      } else {
        // If it's a subsidiary (child), load its parent (master company)
        if (company.parentId) {
          const parent = await clientApi.getCompanyById(company.parentId)
          if (parent) {
            masterCompany.value = parent
            subsidiaries.value = []
          } else {
            masterCompany.value = null
            subsidiaries.value = []
          }
        } else {
          masterCompany.value = null
          subsidiaries.value = []
        }
      }
    } else {
      currentClient.value = null
      masterCompany.value = null
      subsidiaries.value = []
    }
  } catch (error) {
    console.error('Failed to load master company and subsidiaries:', error)
    currentClient.value = null
    masterCompany.value = null
    subsidiaries.value = []
  } finally {
    loadingSubsidiaries.value = false
  }
}

function toggleOffer(offerId: string) {
  expandedOffers.value[offerId] = !expandedOffers.value[offerId]
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Draft':
      return 'bg-yellow-100 text-yellow-800'
    case 'Pending':
      return 'bg-blue-100 text-blue-800'
    case 'Approved':
      return 'bg-green-100 text-green-800'
    case 'Rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}


function toggleEditPolicyFields(offerId: string) {
  editingPolicyFields.value[offerId] = !editingPolicyFields.value[offerId]
  
  // Reset form if canceling
  if (!editingPolicyFields.value[offerId] && proposal.value) {
    const offer = proposal.value.offers.find(o => o.id === offerId)
    if (offer) {
      policyFieldsForm.value[offerId] = {
        startDate: offer.policyInfo?.policyStartDate || '',
        endDate: offer.policyInfo?.policyEndDate || '',
        requiredField: offer.policyInfo?.product || '',
      }
    }
  }
}

async function savePolicyFields(offerId: string) {
  if (!proposal.value) return
  
  const offer = proposal.value.offers.find(o => o.id === offerId)
  if (!offer) return
  
  const form = policyFieldsForm.value[offerId]
  
  // Validation - silently prevent saving if required field is empty
  if (!form.requiredField.trim()) {
    return
  }
  
  // Update the offer's policy info
  if (!offer.policyInfo) {
    offer.policyInfo = { product: '' }
  }
  
  offer.policyInfo.policyStartDate = form.startDate
  offer.policyInfo.policyEndDate = form.endDate
  offer.policyInfo.product = form.requiredField
  
  // Save the updated proposal to persist policy fields
  if (proposal.value) {
    await proposalApi.updateProposal(proposal.value.id, { offers: proposal.value.offers })
  }
  
  // Exit edit mode
  editingPolicyFields.value[offerId] = false
  
  console.log('Saved policy fields for offer:', offerId, form)
}

async function toggleClassesEnabled(offerId: string) {
  if (!proposal.value) return
  
  const offer = proposal.value.offers.find(o => o.id === offerId)
  if (!offer) return
  
  // Toggle the classesEnabled state (default to true if undefined)
  offer.classesEnabled = offer.classesEnabled === false ? true : false
  
  // Persist the change
  await proposalApi.updateProposal(proposal.value.id, { offers: proposal.value.offers })
  
  console.log('Toggled classes enabled for offer:', offerId, offer.classesEnabled)
}

// Class pagination helpers
function getVisibleClasses(offer: Offer) {
  const page = currentClassPage.value[offer.id] || 1
  const startIndex = (page - 1) * classesPerPage
  const endIndex = startIndex + classesPerPage
  return offer.classes.slice(startIndex, endIndex)
}

function getTotalPages(offer: Offer) {
  return Math.ceil(offer.classes.length / classesPerPage)
}

function nextClassPage(offerId: string, offer: Offer) {
  const currentPage = currentClassPage.value[offerId] || 1
  const totalPages = getTotalPages(offer)
  if (currentPage < totalPages) {
    currentClassPage.value[offerId] = currentPage + 1
  }
}

function prevClassPage(offerId: string) {
  const currentPage = currentClassPage.value[offerId] || 1
  if (currentPage > 1) {
    currentClassPage.value[offerId] = currentPage - 1
  }
}

function getAllBenefitNames(offer: Offer): string[] {
  // Get unique benefit names across all classes
  const benefitNamesSet = new Set<string>()
  offer.classes.forEach(cls => {
    cls.benefits.forEach(benefit => {
      benefitNamesSet.add(benefit.name)
    })
  })
  return Array.from(benefitNamesSet)
}

function getBenefitValue(classItem: any, benefitName: string): string {
  const benefit = classItem.benefits.find((b: any) => b.name === benefitName)
  if (!benefit || !benefit.value) return '-'
  
  // Format numbers with commas for readability
  const value = benefit.value
  if (/^\d+$/.test(value)) {
    return parseInt(value).toLocaleString()
  }
  
  return value
}

function openCreateClassModal(offerId: string) {
  currentOfferId.value = offerId
  showCreateClassModal.value = true
  
  // Reset form
  createClassForm.value = {
    className: '',
    planId: '',
    benefits: [],
  }
  selectedPlan.value = null
}

function closeCreateClassModal() {
  showCreateClassModal.value = false
  currentOfferId.value = null
  createClassForm.value = {
    className: '',
    planId: '',
    benefits: [],
  }
  selectedPlan.value = null
}

async function handleCreateClass() {
  // Validation - silently prevent submission if validation fails
  if (!createClassForm.value.className.trim()) {
    return
  }
  
  if (!createClassForm.value.planId) {
    return
  }
  
  // Validate that all benefits have values
  const hasEmptyValues = createClassForm.value.benefits.some(b => !b.value.trim())
  if (hasEmptyValues) {
    return
  }
  
  if (!proposal.value || !currentOfferId.value) return
  
  const offer = proposal.value.offers.find(o => o.id === currentOfferId.value)
  if (!offer) return
  
  // Create new class
  const newClass = {
    id: `class-${Date.now()}`,
    name: createClassForm.value.className,
    benefits: createClassForm.value.benefits.map(b => {
      const benefitTemplate = selectedPlan.value?.benefits.find(bt => bt.id === b.benefitId)
      return {
        id: b.benefitId,
        name: benefitTemplate?.name || '',
        value: b.value,
      }
    }),
  }
  
  offer.classes.push(newClass)
  
  // Save the updated proposal to persist the class
  await proposalApi.updateProposal(proposal.value.id, { offers: proposal.value.offers })
  
  console.log('Created class:', newClass)
  closeCreateClassModal()
}

function handleAddMembers(offerId: string) {
  router.push({
    path: `/proposals/${proposalId.value}/add-members`,
    query: { offerId }
  })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Computed properties for subsidiary pagination
const paginatedSubsidiaries = computed(() => {
  const start = (subsidiaryPage.value - 1) * subsidiaryPageSize.value
  const end = start + subsidiaryPageSize.value
  return subsidiaries.value.slice(start, end)
})

const totalSubsidiaryPages = computed(() => {
  return Math.ceil(subsidiaries.value.length / subsidiaryPageSize.value)
})

// Computed property to determine if we should show master company or subsidiaries
const showMasterCompany = computed(() => {
  return currentClient.value && !currentClient.value.isParent && masterCompany.value !== null
})

const showSubsidiaries = computed(() => {
  return currentClient.value && currentClient.value.isParent
})

// Computed property to check if we should show billing plan tree view
const shouldShowBillingTreeView = computed(() => {
  // Show tree view if client is a master company with subsidiaries, or if it's a subsidiary with a parent
  return (currentClient.value && currentClient.value.isParent && subsidiaries.value.length > 0) ||
         (currentClient.value && !currentClient.value.isParent && masterCompany.value !== null)
})

// Get the master company ID for billing tree view
const masterCompanyIdForBilling = computed(() => {
  if (currentClient.value?.isParent) {
    return currentClient.value.id
  } else if (masterCompany.value) {
    return masterCompany.value.id
  }
  return proposal.value?.clientId || ''
})

// Parse agent name to extract firstName, lastName, and salutation
function parseAgentName(agentName: string): { firstName: string; lastName: string; salutation: string } {
  if (!agentName) {
    return { firstName: '', lastName: '', salutation: '' }
  }
  
  // Split by " - " to get the name part (format: "ID - Name")
  const parts = agentName.split(' - ')
  const namePart = parts.length > 1 ? parts[1] : agentName
  
  // Split name by spaces
  const nameWords = namePart.trim().split(/\s+/)
  
  if (nameWords.length === 0) {
    return { firstName: '', lastName: '', salutation: '' }
  }
  
  // Common salutations
  const salutations = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof']
  let salutation = ''
  let startIndex = 0
  
  // Check if first word is a salutation
  if (salutations.includes(nameWords[0])) {
    salutation = nameWords[0]
    startIndex = 1
  }
  
  // Last word is lastName
  const lastName = nameWords.length > startIndex ? nameWords[nameWords.length - 1] : ''
  
  // Everything between salutation (if any) and lastName is firstName
  const firstName = nameWords.length > startIndex + 1 
    ? nameWords.slice(startIndex, nameWords.length - 1).join(' ')
    : nameWords.length === startIndex + 1 && !salutation
      ? nameWords[startIndex]
      : ''
  
  return { firstName, lastName, salutation }
}

const primaryAgentDetails = computed(() => {
  if (!primaryAgent.value) {
    return { firstName: '', lastName: '', salutation: '', agentId: '' }
  }
  
  const parsed = parseAgentName(primaryAgent.value.name)
  return {
    ...parsed,
    agentId: primaryAgent.value.id
  }
})

function handleSubsidiaryPageChange(newPage: number) {
  subsidiaryPage.value = Math.max(1, Math.min(newPage, totalSubsidiaryPages.value))
}

function openSubsidiaryDetail(subsidiaryId: string) {
  // Open subsidiary detail page in a new tab
  // For now, we'll use a placeholder route - adjust based on your routing structure
  const url = `/clients/${subsidiaryId}`
  window.open(url, '_blank')
}
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <div class="flex items-center space-x-2 text-sm text-gray-500 mb-4">
      <router-link to="/proposals" class="hover:text-blue-600">Proposals</router-link>
      <span>/</span>
      <span class="text-gray-900">Proposal Detail</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- Proposal Detail -->
    <div v-else-if="proposal" class="space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Proposal Detail {{ proposal.id }}</h1>
          <div class="flex items-center space-x-4 text-sm">
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-gray-600">Client:</span>
              <span class="font-medium text-gray-900">{{ proposal.clientName }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span class="text-gray-600">Product Type:</span>
              <span class="font-medium text-gray-900">{{ proposal.productType }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-gray-600">Status:</span>
              <span :class="getStatusColor(proposal.status)" class="px-2 py-1 rounded-full text-xs font-semibold">
                Offer {{ proposal.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8">
          <button
            @click="activeTab = 'offer-management'"
            :class="{
              'border-blue-600 text-blue-600': activeTab === 'offer-management',
              'border-transparent text-gray-500 hover:text-gray-700': activeTab !== 'offer-management',
            }"
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
          >
            Offer Management
          </button>
          <button
            @click="activeTab = 'case-info'"
            :class="{
              'border-blue-600 text-blue-600': activeTab === 'case-info',
              'border-transparent text-gray-500 hover:text-gray-700': activeTab !== 'case-info',
            }"
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
          >
            Case Info
          </button>
          <button
            @click="activeTab = 'proposal-flow'"
            :class="{
              'border-blue-600 text-blue-600': activeTab === 'proposal-flow',
              'border-transparent text-gray-500 hover:text-gray-700': activeTab !== 'proposal-flow',
            }"
            class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
          >
            Proposal Flow
          </button>
        </nav>
      </div>

      <!-- Offer Management Tab -->
      <div v-if="activeTab === 'offer-management'" class="space-y-4">
        <!-- Offers List -->
        <div v-for="(offer, index) in proposal.offers" :key="offer.id" class="border border-gray-200 rounded-lg overflow-hidden">
          <!-- Offer Header -->
          <button
            @click="toggleOffer(offer.id)"
            class="w-full px-6 py-4 bg-yellow-50 hover:bg-yellow-100 flex items-center justify-between transition-colors"
          >
            <div class="flex items-center space-x-3">
              <svg
                :class="{ 'rotate-90': expandedOffers[offer.id] }"
                class="w-5 h-5 text-gray-600 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <h3 class="text-lg font-semibold text-gray-900">{{ offer.name }}</h3>
            </div>
            <span class="px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded">Edit</span>
          </button>

          <!-- Offer Content -->
          <div v-if="expandedOffers[offer.id]" class="p-6 space-y-6">
            <!-- Tasks - Hidden -->
            <!-- <div class="space-y-2">
              <div
                v-for="task in offer.tasks"
                :key="task.id"
                class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
              >
                <div class="flex items-center justify-center w-6 h-6 rounded bg-red-100">
                  <svg class="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span class="text-sm font-medium text-gray-700">{{ task.name }}</span>
              </div>
            </div> -->

            <!-- Policy Info -->
            <div class="border border-gray-200 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-3">Policy Info</h4>
              <div class="grid grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Product</label>
                  <div class="text-sm font-medium" :class="(offer.policyInfo?.product || proposal?.productName) ? 'text-gray-900' : 'text-gray-400'">
                    {{ offer.policyInfo?.product || proposal?.productName || '-' }}
                  </div>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">View Benefits</label>
                  <button class="text-sm text-blue-600 hover:text-blue-800 underline">View</button>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Policy Periods</label>
                  <div class="text-sm text-gray-400">-</div>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Policy Start Date</label>
                  <div class="text-sm" :class="offer.policyInfo?.policyStartDate ? 'text-gray-900' : 'text-gray-400'">
                    {{ offer.policyInfo?.policyStartDate || '-' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Policy Fields -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-900">Policy Fields</h4>
                <button
                  v-if="!editingPolicyFields[offer.id]"
                  @click="toggleEditPolicyFields(offer.id)"
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit
                </button>
              </div>

              <!-- View Mode -->
              <div v-if="!editingPolicyFields[offer.id]" class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Policy Start Date</label>
                  <div class="text-sm" :class="offer.policyInfo?.policyStartDate ? 'text-gray-900' : 'text-gray-400'">
                    {{ offer.policyInfo?.policyStartDate || '-' }}
                  </div>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Policy End Date</label>
                  <div class="text-sm" :class="offer.policyInfo?.policyEndDate ? 'text-gray-900' : 'text-gray-400'">
                    {{ offer.policyInfo?.policyEndDate || '-' }}
                  </div>
                </div>
                <div></div>
                <div class="col-span-3">
                  <label class="block text-xs text-gray-500 mb-1">
                    Required Field
                    <span v-if="!offer.policyInfo?.product && !proposal?.productName" class="text-red-500"> *</span>
                  </label>
                  <div class="text-sm" :class="(offer.policyInfo?.product || proposal?.productName) ? 'text-gray-900' : 'text-red-400'">
                    {{ offer.policyInfo?.product || proposal?.productName || 'Please input this field' }}
                  </div>
                </div>
              </div>

              <!-- Edit Mode -->
              <div v-else class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-gray-700 font-medium mb-1">Policy Start Date</label>
                    <input
                      v-model="policyFieldsForm[offer.id].startDate"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-700 font-medium mb-1">Policy End Date</label>
                    <input
                      v-model="policyFieldsForm[offer.id].endDate"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium mb-1" :class="!policyFieldsForm[offer.id].requiredField ? 'text-red-500' : 'text-gray-700'">
                    {{ !policyFieldsForm[offer.id].requiredField ? 'Please input this field' : 'Required Field' }}
                    <span class="text-red-500"> *</span>
                  </label>
                  <input
                    v-model="policyFieldsForm[offer.id].requiredField"
                    type="text"
                    :class="!policyFieldsForm[offer.id].requiredField ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'"
                    class="w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none"
                    placeholder="Enter value"
                  />
                </div>

                <div class="flex items-center space-x-2 pt-2">
                  <button
                    @click="savePolicyFields(offer.id)"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    Save
                  </button>
                  <button
                    @click="toggleEditPolicyFields(offer.id)"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Class & Benefits -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <h4 class="text-sm font-semibold text-gray-900">Class & Benefits</h4>
                <div class="flex items-center space-x-3">
                  <!-- Toggle Switch -->
                  <div class="flex items-center space-x-2">
                    <button
                      @click="toggleClassesEnabled(offer.id)"
                      :class="offer.classesEnabled !== false ? 'bg-blue-600' : 'bg-gray-300'"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <span
                        :class="offer.classesEnabled !== false ? 'translate-x-6' : 'translate-x-1'"
                        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      />
                    </button>
                    <span class="text-sm text-gray-600">
                      {{ offer.classesEnabled !== false ? 'Enabled' : 'Disabled' }}
                    </span>
                  </div>
                  <button 
                    v-if="offer.classes.length > 0 && offer.classesEnabled !== false"
                    @click="openCreateClassModal(offer.id)"
                    class="px-3 py-1.5 text-xs font-medium text-blue-600 hover:underline"
                  >
                    + Add Class
                  </button>
                </div>
              </div>
              
              <!-- Disabled State -->
              <div v-if="offer.classesEnabled === false" class="text-center py-8">
                <div class="flex flex-col items-center justify-center">
                  <svg class="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <p class="text-sm text-gray-500">Not available</p>
                </div>
              </div>
              
              <!-- Classes Table -->
              <div v-else-if="offer.classes.length > 0" class="overflow-x-auto">
                <!-- Pagination -->
                <div v-if="getTotalPages(offer) > 1" class="flex items-center justify-center mb-3">
                  <button 
                    @click="prevClassPage(offer.id)"
                    :disabled="(currentClassPage[offer.id] || 1) === 1"
                    class="p-1 disabled:text-gray-300 text-gray-600 hover:text-gray-900"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span class="mx-3 text-sm text-gray-600">
                    {{ currentClassPage[offer.id] || 1 }}/{{ getTotalPages(offer) }}
                  </span>
                  <button 
                    @click="nextClassPage(offer.id, offer)"
                    :disabled="(currentClassPage[offer.id] || 1) === getTotalPages(offer)"
                    class="p-1 disabled:text-gray-300 text-gray-600 hover:text-gray-900"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="text-left py-2 px-3 font-medium text-gray-700"></th>
                      <th 
                        v-for="classItem in getVisibleClasses(offer)" 
                        :key="classItem.id"
                        class="text-center py-2 px-3"
                      >
                        <div class="font-medium text-gray-900">{{ classItem.name }}</div>
                        <button class="text-xs text-blue-600 hover:underline">Edit</button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="benefitName in getAllBenefitNames(offer)" 
                      :key="benefitName"
                      class="border-b border-gray-100"
                    >
                      <td class="py-3 px-3 text-gray-700 bg-gray-50 font-medium">{{ benefitName }}</td>
                      <td 
                        v-for="classItem in getVisibleClasses(offer)" 
                        :key="`${classItem.id}-${benefitName}`"
                        class="py-3 px-3 text-center text-gray-900"
                      >
                        {{ getBenefitValue(classItem, benefitName) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty State -->
              <div v-else class="text-center py-8">
                <div class="flex flex-col items-center justify-center">
                  <svg class="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <p class="text-sm text-gray-500 mb-3">No data</p>
                  <button 
                    @click="openCreateClassModal(offer.id)"
                    class="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 border border-gray-200"
                  >
                    Create Class
                  </button>
                </div>
              </div>
            </div>

            <!-- Census Summary -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-900">Census Summary</h4>
                <div v-if="censusSummaries[offer.id] && censusSummaries[offer.id].length > 0" class="flex items-center space-x-3">
                  <button class="text-sm text-blue-600 hover:underline">Upload</button>
                  <button @click="handleAddMembers(offer.id)" class="text-sm text-blue-600 hover:underline">View Members</button>
                </div>
              </div>
              
              <!-- Warning State (No Classes) -->
              <div v-if="offer.classes.length === 0" class="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start space-x-2">
                <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <p class="text-sm text-gray-700">Complete Class & Benefits to input census data</p>
              </div>

              <!-- Members Table (Members Exist) -->
              <div v-else-if="censusSummaries[offer.id] && censusSummaries[offer.id].length > 0" class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="text-left py-3 px-4 font-medium text-gray-700">Subsidiary</th>
                      <th class="text-center py-3 px-4 font-medium text-gray-700">Total Member Count</th>
                      <th class="text-center py-3 px-4 font-medium text-gray-700">No. of Employee</th>
                      <th class="text-center py-3 px-4 font-medium text-gray-700">No. of Spouse</th>
                      <th class="text-center py-3 px-4 font-medium text-gray-700">No. of Child</th>
                      <th class="text-center py-3 px-4 font-medium text-gray-700">No. of Parent</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="summary in censusSummaries[offer.id]" 
                      :key="summary.companyId"
                      class="border-b border-gray-100"
                    >
                      <td class="py-3 px-4 text-gray-900">{{ summary.companyName }}</td>
                      <td class="py-3 px-4 text-center text-gray-900">{{ summary.totalCount }}</td>
                      <td class="py-3 px-4 text-center text-gray-900">{{ summary.employeeCount }}</td>
                      <td class="py-3 px-4 text-center text-gray-900">{{ summary.spouseCount }}</td>
                      <td class="py-3 px-4 text-center text-gray-900">{{ summary.childCount }}</td>
                      <td class="py-3 px-4 text-center text-gray-900">{{ summary.parentCount }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Default State (Classes Exist, No Members) -->
              <div v-else class="text-center py-8">
                <p class="text-base text-gray-900 mb-6">Please choose an option</p>
                <div class="flex items-center justify-center gap-4">
                  <button class="px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                    Input Headcount
                  </button>
                  <button class="px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                    Upload Census
                  </button>
                  <button 
                    @click="handleAddMembers(offer.id)"
                    class="px-6 py-3 text-base font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Add Members
                  </button>
                </div>
              </div>
            </div>

            <!-- Terms & Conditions -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-900">Terms & Conditions</h4>
                <button class="text-sm text-blue-600 hover:text-blue-800 underline">View</button>
              </div>
            </div>

            <!-- Premium -->
            <div class="border border-gray-200 rounded-lg p-4">
              <!-- Warning State (No Members) -->
              <div v-if="!censusSummaries[offer.id] || censusSummaries[offer.id].length === 0">
                <h4 class="text-sm font-semibold text-gray-900 mb-3">Premium</h4>
                <div class="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start space-x-2">
                  <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  <p class="text-sm text-gray-700">Complete Benefit & Networks to get a premium</p>
                </div>
              </div>

              <!-- Premium Breakdown (Members Exist) -->
              <div v-else>
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-semibold text-gray-900">Premium</h4>
                  <button class="text-sm text-blue-600 hover:underline font-medium">View Detail</button>
                </div>

                <div class="flex items-center space-x-3 mb-6">
                  <button class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                    View Rates
                  </button>
                  <button class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                    Update Factors
                  </button>
                  <button class="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                    Premium Breakdown
                  </button>
                </div>

                <!-- Billing Plan Tree View (for multiple companies) -->
                <div v-if="shouldShowBillingTreeView && masterCompanyIdForBilling" class="mt-4">
                  <h5 class="text-sm font-semibold text-gray-900 mb-4">Billing Plan</h5>
                  <BillingPlanTreeView
                    :master-company-id="masterCompanyIdForBilling"
                    :policy-start-date="offer.policyInfo?.policyStartDate"
                  />
                </div>

                <!-- Regular Premium Breakdown (single company) -->
                <div v-else class="space-y-3">
                  <!-- Gross Premium -->
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-700">Gross Premium</span>
                    <span class="text-sm text-gray-900 font-medium">$888</span>
                  </div>

                  <!-- Fees -->
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-700">Fees</span>
                    <span class="text-sm text-gray-900 font-medium">$100</span>
                  </div>

                  <!-- Loading -->
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-700">Loading</span>
                    <span class="text-sm text-gray-900 font-medium">$120</span>
                  </div>

                  <!-- Discounts -->
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-700">Discounts</span>
                    <span class="text-sm text-gray-900 font-medium">-$50</span>
                  </div>

                  <!-- Gross Premium without Taxes -->
                  <div class="flex items-center justify-between py-2 border-t border-gray-200 pt-3">
                    <span class="text-sm font-semibold text-gray-900">Gross Premium without Taxes</span>
                    <span class="text-sm text-gray-900 font-semibold">$1,058</span>
                  </div>

                  <!-- Taxes -->
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-700">Taxes</span>
                    <span class="text-sm text-gray-900 font-medium">$142</span>
                  </div>

                  <!-- Gross Premium with Taxes -->
                  <div class="flex items-center justify-between py-2 border-t border-gray-200 pt-3">
                    <span class="text-sm font-semibold text-gray-900">Gross Premium with Taxes</span>
                    <span class="text-sm text-gray-900 font-semibold">$1,200</span>
                  </div>

                  <!-- Inward Commission -->
                  <div class="flex items-center justify-between py-2 border-t border-gray-200 pt-3">
                    <span class="text-sm text-gray-700">Inward Commission</span>
                    <span class="text-sm text-gray-900 font-medium">$300</span>
                  </div>

                  <!-- Outward Commission (Primary) -->
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-700">Outward Commission (Primary)</span>
                    <span class="text-sm text-gray-900 font-medium">$20</span>
                  </div>

                  <!-- Outward Commission (Secondary) -->
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm text-gray-700">Outward Commission (Secondary)</span>
                    <span class="text-sm text-gray-900 font-medium">$30</span>
                  </div>

                  <!-- Outward Commission Total -->
                  <div class="flex items-center justify-between py-2 border-t border-gray-200 pt-3">
                    <span class="text-sm font-semibold text-gray-900">Outward Commission Total</span>
                    <span class="text-sm text-gray-900 font-semibold">$50</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Case Info Tab -->
      <div v-if="activeTab === 'case-info'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="space-y-6">
          <!-- Agent Info Section -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900">Agent Info</h3>
              <button
                @click="editingAgentInfo = !editingAgentInfo"
                class="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
            <div class="space-y-4">
              <!-- Channel -->
              <div>
                <h4 class="text-xs font-medium text-gray-700 mb-2">Channel</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">Channel:</span>
                    <span class="ml-2 text-gray-900">{{ proposal.channelName || '-' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Distributor:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                </div>
              </div>
              <!-- Primary Agent -->
              <div>
                <h4 class="text-xs font-medium text-gray-700 mb-2">Primary Agent</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">First Name:</span>
                    <span class="ml-2 text-gray-900">{{ primaryAgentDetails.firstName || '-' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Last Name:</span>
                    <span class="ml-2 text-gray-900">{{ primaryAgentDetails.lastName || '-' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Salutation:</span>
                    <span class="ml-2 text-gray-900">{{ primaryAgentDetails.salutation || '-' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Agent ID:</span>
                    <span class="ml-2 text-gray-900">{{ primaryAgentDetails.agentId || proposal.agentId || '-' }}</span>
                  </div>
                </div>
              </div>
              <!-- Secondary Agent -->
              <div>
                <h4 class="text-xs font-medium text-gray-700 mb-2">Secondary Agent</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">First Name:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Last Name:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Salutation:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Agent ID:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                </div>
              </div>
              <!-- Servicing Agent -->
              <div>
                <h4 class="text-xs font-medium text-gray-700 mb-2">Servicing Agent</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">First Name:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Last Name:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Salutation:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Agent ID:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Client Info Section -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900">Client Info</h3>
              <button
                @click="editingClientInfo = !editingClientInfo"
                class="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
            <div class="space-y-4">
              <!-- Basic Info -->
              <div>
                <h4 class="text-xs font-medium text-gray-700 mb-2">Basic Info</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">Label:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Label:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Label:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                </div>
              </div>
              <!-- Contact -->
              <div>
                <h4 class="text-xs font-medium text-gray-700 mb-2">Contact</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">Label:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Label:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                </div>
              </div>
              <!-- Address -->
              <div>
                <h4 class="text-xs font-medium text-gray-700 mb-2">Address</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">Label:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                  <div>
                    <span class="text-gray-500">Label:</span>
                    <span class="ml-2 text-gray-900">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Master Company Section (shown when client is a child company) -->
          <div v-if="showMasterCompany" class="bg-white border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Master Company</h3>
            <div v-if="loadingSubsidiaries" class="text-center py-4 text-sm text-gray-500">
              Loading master company...
            </div>
            <div v-else-if="masterCompany" class="space-y-3">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">ID:</span>
                  <span class="ml-2 text-gray-900">{{ masterCompany.id }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Company Name:</span>
                  <span class="ml-2 text-gray-900">
                    <a
                      @click="openSubsidiaryDetail(masterCompany.id)"
                      class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {{ masterCompany.name }}
                    </a>
                  </span>
                </div>
                <div v-if="masterCompany.crNumber">
                  <span class="text-gray-500">CR Number:</span>
                  <span class="ml-2 text-gray-900">{{ masterCompany.crNumber }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Status:</span>
                  <span
                    :class="{
                      'bg-green-100 text-green-800': masterCompany.status === 'ACTIVE',
                      'bg-red-100 text-red-800': masterCompany.status === 'INACTIVE',
                    }"
                    class="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ masterCompany.status }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4 text-sm text-gray-500">
              No master company found
            </div>
          </div>

          <!-- Subsidiary Section (shown when client is a master company) -->
          <div v-if="showSubsidiaries" class="bg-white border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Subsidiary</h3>
            <div v-if="loadingSubsidiaries" class="text-center py-4 text-sm text-gray-500">
              Loading subsidiaries...
            </div>
            <div v-else-if="subsidiaries.length === 0" class="text-center py-4 text-sm text-gray-500">
              No subsidiaries found
            </div>
            <div v-else>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="text-left py-2 px-3 font-medium text-gray-700">ID</th>
                      <th class="text-left py-2 px-3 font-medium text-gray-700">Subsidiary</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="subsidiary in paginatedSubsidiaries" :key="subsidiary.id" class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="py-2 px-3 text-gray-900">{{ subsidiary.id }}</td>
                      <td class="py-2 px-3">
                        <a
                          @click="openSubsidiaryDetail(subsidiary.id)"
                          class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          {{ subsidiary.name }}
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-4 flex items-center justify-between">
                <div class="text-sm text-gray-600">
                  Total {{ subsidiaries.length }} {{ subsidiaries.length === 1 ? 'item' : 'items' }}
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    @click="handleSubsidiaryPageChange(subsidiaryPage - 1)"
                    :disabled="subsidiaryPage === 1"
                    class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    &lt;
                  </button>
                  <span class="px-2 text-sm text-gray-700">
                    <span v-if="totalSubsidiaryPages <= 5">
                      {{ Array.from({ length: totalSubsidiaryPages }, (_, i) => i + 1).join(' ') }}
                    </span>
                    <span v-else>
                      {{ subsidiaryPage }} {{ subsidiaryPage > 1 || subsidiaryPage < totalSubsidiaryPages ? '...' : '' }} {{ totalSubsidiaryPages }}
                    </span>
                  </span>
                  <button
                    @click="handleSubsidiaryPageChange(subsidiaryPage + 1)"
                    :disabled="subsidiaryPage === totalSubsidiaryPages"
                    class="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    &gt;
                  </button>
                  <select v-model="subsidiaryPageSize" @change="subsidiaryPage = 1" class="ml-2 px-2 py-1 text-sm border border-gray-300 rounded">
                    <option :value="10">10 / page</option>
                    <option :value="20">20 / page</option>
                    <option :value="50">50 / page</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Proposals Section -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Active Proposals</h3>
            <p class="text-sm text-gray-500">No active proposal</p>
          </div>

          <!-- Active Policies Section -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Active Policies</h3>
            <div class="text-sm">
              <a href="#" class="text-blue-600 hover:text-blue-800">DEF9920</a>
              <span class="ml-2 text-gray-500">Group Medical</span>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
          <!-- Case Intelligence Section -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Case Intelligence</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Case Number:</span>
                <span class="text-gray-900">{{ proposal.number.replace('#', '') }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Client:</span>
                <span class="text-gray-900">{{ proposal.clientName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Date Requested:</span>
                <span class="text-gray-900">{{ formatDate(proposal.createdAt) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Source:</span>
                <span class="text-gray-900">Admin Portal</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Status:</span>
                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  {{ proposal.status }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Handler:</span>
                <span class="text-gray-900">-</span>
              </div>
              <button class="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                Assign to me
              </button>
            </div>
          </div>

          <!-- Documents Section -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900">Documents</h3>
              <button
                @click="editingDocuments = !editingDocuments"
                class="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
            <div class="space-y-2">
              <a href="#" v-for="i in 4" :key="i" class="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>filename.png</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Proposal Flow Tab -->
      <div v-if="activeTab === 'proposal-flow'" class="bg-gray-50 rounded-lg p-12 text-center">
        <p class="text-gray-500">Proposal flow will appear here</p>
      </div>

    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <p class="text-gray-500">Proposal not found</p>
      <button
        @click="router.push('/proposals/new')"
        class="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Back to Proposals
      </button>
    </div>

    <!-- Create Class Modal -->
    <div 
      v-if="showCreateClassModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeCreateClassModal"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold">Create Class</h2>
          <button @click="closeCreateClassModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleCreateClass">
          <!-- Class Name and Plan -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
              <input
                v-model="createClassForm.className"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter class name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Plan</label>
              <select
                v-model="createClassForm.planId"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a plan</option>
                <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                  {{ plan.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Benefits (dynamic based on selected plan) -->
          <div v-if="selectedPlan" class="space-y-4 mb-6">
            <template v-for="(benefit, index) in selectedPlan.benefits" :key="benefit.id">
              <div v-if="index % 2 === 0" class="grid grid-cols-2 gap-4">
                <!-- First benefit -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {{ benefit.name }}
                  </label>
                  <select
                    v-if="benefit.type === 'dropdown'"
                    v-model="createClassForm.benefits[index].value"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option v-for="option in benefit.options" :key="option" :value="option">
                      {{ option }}
                    </option>
                  </select>
                  <input
                    v-else
                    v-model="createClassForm.benefits[index].value"
                    :type="benefit.type === 'number' || benefit.type === 'percentage' ? 'text' : 'text'"
                    :placeholder="benefit.type === 'percentage' ? 'e.g., 20%' : 'Enter value'"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <!-- Second benefit (if exists) -->
                <div v-if="selectedPlan.benefits[index + 1]">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    {{ selectedPlan.benefits[index + 1].name }}
                  </label>
                  <select
                    v-if="selectedPlan.benefits[index + 1].type === 'dropdown'"
                    v-model="createClassForm.benefits[index + 1].value"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    <option v-for="option in selectedPlan.benefits[index + 1].options" :key="option" :value="option">
                      {{ option }}
                    </option>
                  </select>
                  <input
                    v-else
                    v-model="createClassForm.benefits[index + 1].value"
                    :type="selectedPlan.benefits[index + 1].type === 'number' || selectedPlan.benefits[index + 1].type === 'percentage' ? 'text' : 'text'"
                    :placeholder="selectedPlan.benefits[index + 1].type === 'percentage' ? 'e.g., 20%' : 'Enter value'"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </template>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="closeCreateClassModal"
              class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Class
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

