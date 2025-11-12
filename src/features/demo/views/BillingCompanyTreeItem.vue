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
        <!-- Show counts for parent companies (but not master-group) -->
        <span
          v-if="company.children && company.children.length > 0 && company.id !== 'master-group' && status.total > 0"
          class="text-xs ml-2 px-2 py-0.5 rounded"
          :class="
            status.incomplete > 0
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          "
          :title="`${status.ready} ready, ${status.incomplete} incomplete`"
        >
          {{ status.ready }}/{{ status.total }}
        </span>
        <!-- Show status indicators for subsidiaries -->
        <span
          v-if="!company.children && !isReady"
          class="text-xs ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded"
          title="Billing not configured"
        >
          Incomplete
        </span>
        <!-- Show completed status (premium requested - shows checkmark) -->
        <span
          v-else-if="!company.children && isReady && premiumStatus === 'completed'"
          class="text-xs ml-2"
          title="Premium requested"
        >
          ✅
        </span>
        <!-- Show Request Premium status (billing complete, ready to request - status is 'pending') -->
        <span
          v-else-if="!company.children && isReady"
          class="text-xs ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
          title="Request premium"
        >
          Request Premium
        </span>
      </div>
    </div>

    <div
      v-if="company.children && company.children.length > 0 && expanded.has(company.id)"
      class="ml-6 border-l-2 border-gray-200 pl-4 mt-1"
    >
      <BillingCompanyTreeItem
        v-for="child in company.children"
        :key="child.id"
        :company="child"
        :expanded="expanded"
        :selected-company-id="selectedCompanyId"
            :companies="companies"
            :mock-billing-info="mockBillingInfo"
            :premium-request-status="premiumRequestStatus"
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
  mockBillingInfo: Record<
    string,
    {
      frequency: string
      channel: string
      payor?: string
      leadDays?: number
      billingPricingDate?: string
      assumePaid?: string
      billingYearMode?: string
      gracePeriod?: number
      bankAccount?: string
    }
  >
  premiumRequestStatus?: Record<string, 'ready' | 'pending' | 'completed'>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggle: [companyId: string]
  select: [companyId: string]
}>()

// Get premium request status for this company
const premiumStatus = computed(() => {
  return props.premiumRequestStatus?.[props.company.id]
})

// Check if a company is ready (has billing info configured with frequency and channel)
// If channel is Direct Debit (New), bankAccount is also required
const isReady = computed(() => {
  const info = props.mockBillingInfo[props.company.id]
  if (!info) return false
  
  const hasFrequency = !!info.frequency
  const hasChannel = !!info.channel
  const hasBankAccount =
    info.channel !== 'Direct Debit (New)' || !!info.bankAccount
  
  return hasFrequency && hasChannel && hasBankAccount
})

// Calculate status for parent companies (count ready vs incomplete subsidiaries)
const status = computed(() => {
  if (!props.company.children || props.company.children.length === 0) {
    return { ready: 0, incomplete: 0, total: 0 }
  }

  let ready = 0
  let incomplete = 0

  props.company.children.forEach((child) => {
    const childInfo = props.mockBillingInfo[child.id]
    if (!childInfo) {
      incomplete++
      return
    }
    
    const hasFrequency = !!childInfo.frequency
    const hasChannel = !!childInfo.channel
    const hasBankAccount =
      childInfo.channel !== 'Direct Debit (New)' || !!childInfo.bankAccount
    
    if (hasFrequency && hasChannel && hasBankAccount) {
      ready++
    } else {
      incomplete++
    }
  })

  return {
    ready,
    incomplete,
    total: props.company.children.length,
  }
})
</script>

