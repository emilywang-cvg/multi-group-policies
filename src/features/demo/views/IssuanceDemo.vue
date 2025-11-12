<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Issuance Demo</h1>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Loading...</p>
    </div>

    <div v-else class="flex flex-col lg:flex-row gap-6 min-h-[600px] lg:h-[calc(100vh-200px)]">
      <!-- Left: Company Tree -->
      <div class="w-full lg:w-1/3 border border-gray-200 rounded-lg bg-white p-4 overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Companies</h2>
          <button
            @click="expandAll"
            class="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
          >
            Expand All
          </button>
        </div>

        <template v-for="company in companies" :key="company.id">
          <IssuanceCompanyTreeItem
            :company="company"
            :expanded="expandedNodes"
            :selected-company-id="selectedCompanyId"
            :companies="companies"
            :issuance-status="issuanceStatus"
            @toggle="toggleNode"
            @select="handleCompanySelect"
          />
        </template>
      </div>

      <!-- Right: Issuance Information -->
      <div class="w-full lg:flex-1 border border-gray-200 rounded-lg bg-white p-4 overflow-y-auto">
        <div v-if="!selectedCompanyId" class="text-center py-12 text-gray-500">
          <p>Select a company to view its issuance information</p>
        </div>

        <div v-else-if="loadingIssuance" class="text-center py-12 text-gray-500">
          <p>Loading issuance information...</p>
        </div>

        <!-- Master Group Overview -->
        <div v-else-if="selectedCompanyId === 'master-group'" class="space-y-6">
          <!-- Master Group Header -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 class="text-lg font-semibold text-gray-900">Master Group</h2>
          </div>

          <!-- Overview Stats -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="text-xs text-gray-600 mb-1">Total Issued</div>
              <div class="text-2xl font-bold text-gray-900">
                <span class="text-green-600">{{ issuedSubsidiariesCount }}</span>
                <span class="text-gray-600 text-lg font-normal">/{{ totalSubsidiariesCount }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">Subsidiaries</div>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="text-xs text-gray-600 mb-1">Total Member Count</div>
              <div class="text-2xl font-bold text-gray-900">{{ totalMemberCount }}</div>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="text-xs text-gray-600 mb-1">Total Premium</div>
              <div class="text-2xl font-bold text-gray-900">
                {{ formatCurrency(masterGroupTotalPremium) }}
              </div>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="text-xs text-gray-600 mb-1">Not Issued</div>
              <div class="text-2xl font-bold text-gray-900">
                <span class="text-red-600">{{ notIssuedSubsidiariesCount }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">Subsidiaries</div>
              <button
                v-if="notIssuedSubsidiariesCount > 0"
                @click="handleBulkIssue"
                class="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Issue Policy for All
              </button>
            </div>
          </div>
        </div>

        <!-- Individual Company Issuance View -->
        <div v-else class="space-y-6">
          <!-- Company Header -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 class="text-lg font-semibold text-gray-900">{{ getCompanyName(selectedCompanyId) }}</h2>
            <button
              @click="selectedCompanyId = null"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>

          <!-- Issue Policy Banner (Not Issued) -->
          <div
            v-if="isReadyForIssuance"
            class="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <svg
                      class="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-green-900">
                    Final Proposal & Issuance:
                  </h3>
                  <p class="text-sm text-green-700 mt-1">
                    Congratulations! You can now send the final proposal to client and issue policy.
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  @click="handleSendProposal"
                >
                  Send Proposal
                </button>
                <button
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  @click="handleIssuePolicy"
                >
                  Issue Policy
                </button>
              </div>
            </div>
          </div>

          <!-- Policy Issued Success Banner -->
          <div
            v-if="isPolicyIssued"
            class="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <svg
                      class="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    Great work! Policy is successfully issued.
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  @click="handleSendProposal"
                >
                  Send Proposal
                </button>
                <button
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  @click="handleViewPolicy"
                >
                  View Policy
                </button>
              </div>
            </div>
          </div>

          <!-- Proposal Summary -->
          <div class="border border-gray-200 rounded-lg p-4 bg-white">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900">Proposal Summary</h3>
              <button
                class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              >
                Edit
              </button>
            </div>

            <!-- Policy Info -->
            <div class="mb-6">
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Policy Info</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-gray-500 mb-1">Client</div>
                  <div class="text-sm font-medium text-gray-900">{{ proposalInfo.client }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">Product</div>
                  <div class="text-sm font-medium text-gray-900">{{ proposalInfo.product }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">Start Date</div>
                  <div class="text-sm font-medium text-gray-900">{{ proposalInfo.startDate || 'Value' }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">End Date</div>
                  <div class="text-sm font-medium text-gray-900">{{ proposalInfo.endDate || 'Value' }}</div>
                </div>
              </div>
            </div>

            <!-- Summary Statistics -->
            <div class="border-t border-gray-200 pt-4 mb-6">
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <div class="text-xs text-gray-500 mb-1">No. of Employees</div>
                  <div class="text-lg font-bold text-gray-900">{{ proposalInfo.numEmployees }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">No. of Dependents</div>
                  <div class="text-lg font-bold text-gray-900">{{ proposalInfo.numDependents }}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">Total Premium</div>
                  <div class="text-lg font-bold text-gray-900">{{ formatCurrency(premiumSummary.total) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Documents List -->
          <div class="border border-gray-200 rounded-lg p-4 bg-white">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Documents</h3>
            <div v-if="documents.length === 0" class="text-center py-8 text-gray-500">
              <svg
                class="w-12 h-12 mx-auto mb-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p class="text-sm">No documents</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="doc in documents"
                :key="doc.id"
                class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div class="flex items-center gap-3">
                  <svg
                    class="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span
                    :class="[
                      'text-sm',
                      doc.hasError ? 'text-red-600' : 'text-blue-600',
                    ]"
                  >
                    {{ doc.filename }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="doc.hasError"
                    class="text-xs text-red-600 flex items-center gap-1"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  <button
                    v-else
                    class="text-blue-600 hover:text-blue-800"
                    @click="handleDownload(doc.id)"
                    title="Download"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div v-if="documents.some((d) => d.hasError)" class="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-xs text-red-600">
                  This document cannot be downloaded or attached due to errors
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import IssuanceCompanyTreeItem from './IssuanceCompanyTreeItem.vue'
import type { Company } from '@/features/document-upload/types'

// Mock companies - Master Group with 7 subsidiaries
const mockCompanies: Company[] = [
  {
    id: 'master-group',
    name: 'Master Group',
    children: [
      { id: 'parent-1', name: 'Acme Corporation', parentId: 'master-group' },
      { id: 'sub-1', name: 'Acme North Division', parentId: 'master-group' },
      { id: 'sub-2', name: 'Acme South Division', parentId: 'master-group' },
      { id: 'sub-3', name: 'Acme East Division', parentId: 'master-group' },
      { id: 'sub-4', name: 'Acme West Division', parentId: 'master-group' },
      { id: 'sub-5', name: 'Acme Central Division', parentId: 'master-group' },
      { id: 'sub-6', name: 'Acme Pacific Division', parentId: 'master-group' },
    ],
  },
]

// Premium summary for selected company (same calculation as billing demo)
const premiumSummary = computed(() => {
  if (!selectedCompanyId.value || selectedCompanyId.value === 'master-group') {
    return { grossPremium: 0, taxes: 0, total: 0 }
  }
  // Generate deterministic values based on company ID (same as billing demo)
  const seed = selectedCompanyId.value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const grossPremium = 1000 + (seed % 5000)
  const taxes = Math.round(grossPremium * 0.1)
  const total = grossPremium + taxes
  return { grossPremium, taxes, total }
})

// Mock documents data
interface Document {
  id: string
  filename: string
  hasError?: boolean
}

const mockDocuments: Record<string, Document[]> = {
  'sub-1': [
    { id: 'doc-1', filename: 'filename1.png' },
    { id: 'doc-2', filename: 'filename2.png' },
    { id: 'doc-3', filename: 'filename3.png' },
    { id: 'doc-4', filename: 'filename4.png', hasError: true },
  ],
  'sub-2': [
    { id: 'doc-5', filename: 'document1.pdf' },
    { id: 'doc-6', filename: 'document2.pdf' },
  ],
  'sub-3': [
    { id: 'doc-7', filename: 'file1.pdf' },
  ],
  'parent-1': [
    { id: 'doc-8', filename: 'corp-doc1.pdf' },
    { id: 'doc-9', filename: 'corp-doc2.pdf' },
  ],
}

const companies = ref<Company[]>(mockCompanies)
const loading = ref(false)
const loadingIssuance = ref(false)
const selectedCompanyId = ref<string | null>('master-group')
const expandedNodes = ref<Set<string>>(new Set(['master-group']))

// Track issuance status for each subsidiary
// 'not-issued' = ready for issuance (shows banner with Issue Policy button)
// 'issued' = policy issued (no banner)
const issuanceStatus = ref<Record<string, 'not-issued' | 'issued'>>({})

// Mock proposal info for each company
const mockProposalInfo: Record<string, {
  client: string
  product: string
  startDate?: string
  endDate?: string
  numEmployees: number
  numDependents: number
}> = {
  'parent-1': {
    client: 'CoverGo',
    product: 'Packaged Product',
    numEmployees: 10,
    numDependents: 2,
  },
  'sub-1': {
    client: 'CoverGo',
    product: 'Packaged Product',
    numEmployees: 8,
    numDependents: 1,
  },
  'sub-2': {
    client: 'CoverGo',
    product: 'Packaged Product',
    numEmployees: 12,
    numDependents: 3,
  },
  'sub-3': {
    client: 'CoverGo',
    product: 'Packaged Product',
    numEmployees: 15,
    numDependents: 4,
  },
  'sub-4': {
    client: 'CoverGo',
    product: 'Packaged Product',
    numEmployees: 6,
    numDependents: 0,
  },
  'sub-5': {
    client: 'CoverGo',
    product: 'Packaged Product',
    numEmployees: 9,
    numDependents: 2,
  },
  'sub-6': {
    client: 'CoverGo',
    product: 'Packaged Product',
    numEmployees: 11,
    numDependents: 2,
  },
}

// Proposal info for selected company
const proposalInfo = computed(() => {
  if (!selectedCompanyId.value || selectedCompanyId.value === 'master-group') {
    return {
      client: '',
      product: '',
      numEmployees: 0,
      numDependents: 0,
    }
  }
  return mockProposalInfo[selectedCompanyId.value] || {
    client: 'CoverGo',
    product: 'Packaged Product',
    numEmployees: 0,
    numDependents: 0,
  }
})

// Documents for selected company
const documents = computed(() => {
  if (!selectedCompanyId.value || selectedCompanyId.value === 'master-group') {
    return []
  }
  return mockDocuments[selectedCompanyId.value] || []
})

// Get all subsidiary IDs (excluding master-group)
const allSubsidiaryIds = computed(() => {
  const masterGroup = companies.value.find((c) => c.id === 'master-group')
  return masterGroup?.children?.map((c) => c.id) || []
})

// Count issued subsidiaries
const issuedSubsidiariesCount = computed(() => {
  return allSubsidiaryIds.value.filter((id) => {
    return issuanceStatus.value[id] === 'issued'
  }).length
})

// Total subsidiaries count
const totalSubsidiariesCount = computed(() => {
  return allSubsidiaryIds.value.length
})

// Count not issued subsidiaries
const notIssuedSubsidiariesCount = computed(() => {
  return allSubsidiaryIds.value.filter((id) => {
    const status = issuanceStatus.value[id]
    return !status || status === 'not-issued'
  }).length
})

// Calculate total member count (employees + dependents) across all subsidiaries
const totalMemberCount = computed(() => {
  let total = 0
  allSubsidiaryIds.value.forEach((id) => {
    const info = mockProposalInfo[id]
    if (info) {
      total += info.numEmployees + info.numDependents
    }
  })
  return total
})

// Calculate total premium for all subsidiaries
const masterGroupTotalPremium = computed(() => {
  let total = 0
  allSubsidiaryIds.value.forEach((id) => {
    const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const grossPremium = 1000 + (seed % 5000)
    const taxes = Math.round(grossPremium * 0.1)
    total += grossPremium + taxes
  })
  return total
})

// Check if company is ready for issuance and not yet issued
const isReadyForIssuance = computed(() => {
  if (!selectedCompanyId.value || selectedCompanyId.value === 'master-group') {
    return false
  }
  // Show banner if status is 'not-issued' or undefined (default to not-issued)
  const status = issuanceStatus.value[selectedCompanyId.value]
  return !status || status === 'not-issued'
})

// Check if policy is issued for selected company
const isPolicyIssued = computed(() => {
  if (!selectedCompanyId.value || selectedCompanyId.value === 'master-group') {
    return false
  }
  return issuanceStatus.value[selectedCompanyId.value] === 'issued'
})

// Toggle node expansion
const toggleNode = (companyId: string) => {
  if (expandedNodes.value.has(companyId)) {
    expandedNodes.value.delete(companyId)
  } else {
    expandedNodes.value.add(companyId)
  }
}

// Expand all nodes
const expandAll = () => {
  const allIds = new Set<string>()
  const collectIds = (companyList: Company[]) => {
    companyList.forEach((company) => {
      allIds.add(company.id)
      if (company.children) {
        collectIds(company.children)
      }
    })
  }
  collectIds(companies.value)
  expandedNodes.value = allIds
}

// Get company name
const getCompanyName = (companyId: string): string => {
  if (companyId === 'master-group') {
    return 'Master Group'
  }
  const findCompany = (list: Company[]): Company | null => {
    for (const company of list) {
      if (company.id === companyId) return company
      if (company.children) {
        const found = findCompany(company.children)
        if (found) return found
      }
    }
    return null
  }

  const company = findCompany(companies.value)
  return company?.name || companyId
}

// Handle company selection
const handleCompanySelect = (companyId: string) => {
  selectedCompanyId.value = companyId
}

// Handle send proposal
const handleSendProposal = () => {
  if (selectedCompanyId.value) {
    alert(`Sending proposal for ${getCompanyName(selectedCompanyId.value)}`)
  }
}

// Handle issue policy
const handleIssuePolicy = () => {
  if (selectedCompanyId.value) {
    issuanceStatus.value[selectedCompanyId.value] = 'issued'
  }
}

// Handle view policy
const handleViewPolicy = () => {
  if (selectedCompanyId.value) {
    alert(`Viewing policy for ${getCompanyName(selectedCompanyId.value)}`)
  }
}

// Handle bulk issue policy for all not-issued subsidiaries
const handleBulkIssue = () => {
  const notIssuedIds = allSubsidiaryIds.value.filter((id) => {
    const status = issuanceStatus.value[id]
    return !status || status === 'not-issued'
  })

  if (notIssuedIds.length === 0) {
    alert('No subsidiaries available for issuance')
    return
  }

  // Issue policies for all not-issued subsidiaries
  notIssuedIds.forEach((id) => {
    issuanceStatus.value[id] = 'issued'
  })

  alert(`Policies issued for ${notIssuedIds.length} subsidiary${notIssuedIds.length > 1 ? 'ies' : ''}`)
}

// Handle document download
const handleDownload = (docId: string) => {
  alert(`Downloading document ${docId}`)
}

// Format currency
const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

onMounted(() => {
  // Master Group is selected by default
})
</script>

