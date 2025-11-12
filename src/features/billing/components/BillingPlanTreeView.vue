<template>
  <div class="flex gap-6 h-[600px]">
    <!-- Left: Company Tree -->
    <div class="w-1/3 border border-gray-200 rounded-lg bg-white p-4 overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Companies</h2>
        <button
          @click="expandAll"
          class="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
        >
          Expand All
        </button>
      </div>

      <template v-if="loadingCompanies">
        <div class="text-center py-8 text-sm text-gray-500">Loading companies...</div>
      </template>
      <template v-else-if="companyTree.length === 0">
        <div class="text-center py-8 text-sm text-gray-500">No companies found</div>
      </template>
      <template v-else>
        <template v-for="company in companyTree" :key="company.id">
          <CompanyTreeItem
            :company="company"
            :expanded="expandedNodes"
            :selected-company-id="selectedCompanyId"
            @toggle="toggleNode"
            @select="handleCompanySelect"
          />
        </template>
      </template>
    </div>

    <!-- Right: Billing Plan Table -->
    <div class="flex-1 border border-gray-200 rounded-lg bg-white p-4 overflow-y-auto">
      <div v-if="!selectedCompanyId" class="text-center py-12 text-gray-500">
        <p>Select a company to view its billing plan</p>
      </div>

      <div v-else-if="loadingBillingPlan" class="text-center py-12 text-gray-500">
        <p>Loading billing plan...</p>
      </div>

      <div v-else-if="selectedBillingPlan">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ getCompanyName(selectedCompanyId) }}
          </h2>
        </div>

        <!-- Info Banner -->
        <div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            Amount is calculated based on billing modal factor and administration fees.
          </p>
        </div>

        <!-- Billing Plan Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 font-medium text-gray-700"></th>
                <th class="text-left py-3 px-4 font-medium text-gray-700">Bill from</th>
                <th class="text-left py-3 px-4 font-medium text-gray-700">Bill to</th>
                <th class="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                <th class="text-left py-3 px-4 font-medium text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(component, index) in selectedBillingPlan.components"
                :key="component.id"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4 text-gray-900">{{ index + 1 }}</td>
                <td class="py-3 px-4 text-gray-900">{{ component.billFrom }}</td>
                <td class="py-3 px-4 text-gray-900">{{ component.billTo }}</td>
                <td class="py-3 px-4 text-right text-gray-900 font-medium">
                  {{ formatCurrency(component.amount, component.currency) }}
                </td>
                <td class="py-3 px-4">
                  <button class="text-blue-600 hover:text-blue-800 hover:underline">
                    Details
                  </button>
                </td>
              </tr>
              <!-- Total Row -->
              <tr class="border-t-2 border-gray-300 bg-gray-50">
                <td colspan="3" class="py-3 px-4 text-right font-semibold text-gray-900">Total</td>
                <td class="py-3 px-4 text-right font-semibold text-gray-900">
                  {{ formatCurrency(selectedBillingPlan.totalAmount, selectedBillingPlan.currency) }}
                </td>
                <td class="py-3 px-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="text-center py-12 text-gray-500">
        <p>No billing plan found for this company</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import CompanyTreeItem from './CompanyTreeItem.vue'
import * as billingApi from '../api'
import * as clientApi from '@/features/clients/api'
import type { CompanyNode } from '@/features/clients/types'
import type { BillingPlan } from '../types'

interface Props {
  masterCompanyId: string
  policyStartDate?: string
}

const props = defineProps<Props>()

const loadingCompanies = ref(true)
const loadingBillingPlan = ref(false)
const companyTree = ref<CompanyNode[]>([])
const selectedCompanyId = ref<string | null>(null)
const expandedNodes = ref<Set<string>>(new Set())
const selectedBillingPlan = ref<BillingPlan | null>(null)

// Build company tree structure
async function buildCompanyTree() {
  loadingCompanies.value = true
  try {
    // Get master company
    const masterCompany = await clientApi.getCompanyById(props.masterCompanyId)
    if (!masterCompany) {
      companyTree.value = []
      return
    }

    // If master company has children, load them
    if (masterCompany.isParent) {
      const children = await clientApi.listChildren(masterCompany.id)
      companyTree.value = [
        {
          ...masterCompany,
          children,
        },
      ]
      // Expand master company by default
      expandedNodes.value.add(masterCompany.id)
      // Select master company by default
      if (!selectedCompanyId.value) {
        selectedCompanyId.value = masterCompany.id
      }
    } else {
      // If it's a subsidiary, get its parent
      if (masterCompany.parentId) {
        const parent = await clientApi.getCompanyById(masterCompany.parentId)
        if (parent) {
          const children = await clientApi.listChildren(parent.id)
          companyTree.value = [
            {
              ...parent,
              children,
            },
          ]
          expandedNodes.value.add(parent.id)
          // Select the original company by default
          selectedCompanyId.value = masterCompany.id
        } else {
          companyTree.value = [masterCompany]
          selectedCompanyId.value = masterCompany.id
        }
      } else {
        companyTree.value = [masterCompany]
        selectedCompanyId.value = masterCompany.id
      }
    }
  } catch (error) {
    console.error('Failed to build company tree:', error)
    companyTree.value = []
  } finally {
    loadingCompanies.value = false
  }
}

const toggleNode = (companyId: string) => {
  const newSet = new Set(expandedNodes.value)
  if (newSet.has(companyId)) {
    newSet.delete(companyId)
  } else {
    newSet.add(companyId)
  }
  expandedNodes.value = newSet
}

const expandAll = () => {
  const newExpanded = new Set<string>()
  
  const expandCompany = (company: CompanyNode) => {
    newExpanded.add(company.id)
    if (company.children) {
      company.children.forEach(expandCompany)
    }
  }

  companyTree.value.forEach(expandCompany)
  expandedNodes.value = newExpanded
}

const getCompanyName = (companyId: string): string => {
  const findCompany = (list: CompanyNode[]): CompanyNode | null => {
    for (const company of list) {
      if (company.id === companyId) return company
      if (company.children) {
        const found = findCompany(company.children)
        if (found) return found
      }
    }
    return null
  }

  const company = findCompany(companyTree.value)
  return company?.name || companyId
}

const handleCompanySelect = async (companyId: string) => {
  selectedCompanyId.value = companyId
  await loadBillingPlan(companyId)
}

const loadBillingPlan = async (companyId: string) => {
  loadingBillingPlan.value = true
  try {
    const plan = await billingApi.getBillingPlan(companyId, props.policyStartDate)
    selectedBillingPlan.value = plan
  } catch (error) {
    console.error('Failed to load billing plan:', error)
    selectedBillingPlan.value = null
  } finally {
    loadingBillingPlan.value = false
  }
}

const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

// Watch for master company changes
watch(() => props.masterCompanyId, () => {
  buildCompanyTree()
}, { immediate: true })

// Load billing plan when company is selected
watch(selectedCompanyId, (newId) => {
  if (newId) {
    loadBillingPlan(newId)
  }
})

onMounted(() => {
  buildCompanyTree()
})
</script>



