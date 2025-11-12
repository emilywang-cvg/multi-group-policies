<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Premium & Payment Demo</h1>

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
          <BillingCompanyTreeItem
            :company="company"
            :expanded="expandedNodes"
            :selected-company-id="selectedCompanyId"
            :companies="companies"
            :mock-billing-info="mockBillingInfo"
            :premium-request-status="premiumRequestStatus"
            @toggle="toggleNode"
            @select="handleCompanySelect"
          />
        </template>
      </div>

      <!-- Right: Billing Information -->
      <div class="w-full lg:flex-1 border border-gray-200 rounded-lg bg-white p-4 overflow-y-auto">
        <div v-if="!selectedCompanyId" class="text-center py-12 text-gray-500">
          <p>Select a company to view its billing information</p>
        </div>

        <div v-else-if="loadingBilling" class="text-center py-12 text-gray-500">
          <p>Loading billing information...</p>
        </div>

        <!-- Master Group Overview -->
        <div v-else-if="selectedCompanyId === 'master-group'" class="space-y-6">
          <!-- Master Group Header -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 class="text-lg font-semibold text-gray-900">Master Group</h2>
          </div>

          <!-- All Companies Completed Banner -->
          <div
            v-if="allCompaniesCompleted"
            class="bg-green-50 border border-green-200 rounded-lg p-4"
          >
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
                  Congratulations! You've completed premium request for all companies.
                </h3>
              </div>
            </div>
          </div>

          <!-- Overview Stats -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="text-xs text-gray-600 mb-1">Ready for Initial Premium Billing</div>
              <div class="text-2xl font-bold text-gray-900">
                <span class="text-green-600">{{ readySubsidiariesCount }}</span>
                <span class="text-gray-600 text-lg font-normal">/{{ totalSubsidiariesCount }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">Subsidiaries</div>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="text-xs text-gray-600 mb-1">Total No. of Subsidiaries</div>
              <div class="text-2xl font-bold text-gray-900">{{ totalSubsidiariesCount }}</div>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="text-xs text-gray-600 mb-1">Pending Request Premium</div>
              <div class="text-2xl font-bold text-gray-900">
                <span class="text-red-600">{{ pendingSubsidiariesCount }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">Subsidiaries</div>
              <button
                v-if="pendingSubsidiariesCount > 0"
                @click="handleBulkRequestPremium"
                class="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request Premium for All
              </button>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="text-xs text-gray-600 mb-1">Total Premium</div>
              <div class="text-2xl font-bold text-gray-900">
                {{ formatCurrency(masterGroupTotalPremium) }}
              </div>
            </div>
          </div>

          <!-- Billing Settings -->
          <div class="border border-gray-200 rounded-lg p-4 bg-white">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900">Billing</h3>
              <div class="flex items-center gap-2">
                <button
                  v-if="isEditingMasterBilling"
                  @click="cancelEditMasterBilling"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Discard
                </button>
                <button
                  v-if="isEditingMasterBilling"
                  @click="saveMasterBilling"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  v-else
                  @click="isEditingMasterBilling = true"
                  class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- View Mode: Read-only display -->
              <template v-if="!isEditingMasterBilling">
                <div>
                  <div class="text-xs text-gray-600 mb-1">Billing Frequency</div>
                  <div class="text-sm font-semibold text-gray-900">
                    {{ masterBillingInfo.frequency || '—' }}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-gray-600 mb-1">Billing Channel</div>
                  <div class="text-sm font-semibold text-gray-900">
                    {{ masterBillingInfo.channel || '—' }}
                  </div>
                </div>
              </template>

              <!-- Edit Mode: Form inputs -->
              <template v-else>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Billing Frequency
                  </label>
                  <select
                    v-model="masterBillingInfo.frequency"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select frequency</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Billing Channel</label>
                  <select
                    v-model="masterBillingInfo.channel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select channel</option>
                    <option value="Digital Payment">Digital Payment</option>
                    <option value="Direct Debit (New)">Direct Debit (New)</option>
                    <option value="Offline channel">Offline channel</option>
                    <option value="PAD Direct Debit">PAD Direct Debit</option>
                  </select>
                </div>
              </template>

              <!-- Apply billing frequency setup to: (only shown in edit mode) -->
              <div v-if="isEditingMasterBilling" class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Apply billing frequency setup to:
                </label>
                <div class="space-y-2">
                  <label class="flex items-center gap-2">
                    <input
                      v-model="masterBillingInfo.applyTo"
                      type="radio"
                      value="subsidiaries-without-channel"
                      class="text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-700">Subsidiaries without channel</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input
                      v-model="masterBillingInfo.applyTo"
                      type="radio"
                      value="overwrite-all"
                      class="text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-700">Overwrite all subsidiaries</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Premium Subtotal -->
          <div class="border border-gray-200 rounded-lg p-4 bg-white">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900">Premium Subtotal</h3>
              <div class="flex items-center gap-2">
                <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  View Rates
                </button>
                <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Update Factors
                </button>
                <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Premium Breakdown
                </button>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-700">Gross Premium</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.grossPremium, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-700">Fees</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.fees, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-700">Loading</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.loading, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-700">Discounts</span>
                <span class="text-sm font-medium text-gray-900 text-red-600">
                  {{ formatCurrency(-masterPremiumBreakdown.discounts, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                <span class="text-sm font-semibold text-gray-900">Gross Premium without Taxes</span>
                <span class="text-sm font-semibold text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.grossPremiumWithoutTaxes, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-700">Taxes</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.taxes, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                <span class="text-sm font-semibold text-gray-900">Gross Premium with Taxes</span>
                <span class="text-sm font-semibold text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.grossPremiumWithTaxes, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                <span class="text-sm text-gray-700">Inward Commission</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.inwardCommission, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-700">Outward Commission (Primary)</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.outwardCommissionPrimary, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-sm text-gray-700">Outward Commission (Secondary)</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.outwardCommissionSecondary, 'USD') }}
                </span>
              </div>
              <div class="flex justify-between items-center py-2 border-t border-gray-200 pt-3">
                <span class="text-sm font-semibold text-gray-900">Outward Commission Total</span>
                <span class="text-sm font-semibold text-gray-900">
                  {{ formatCurrency(masterPremiumBreakdown.outwardCommissionTotal, 'USD') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Individual Company View -->
        <div v-else class="space-y-6">
          <!-- Company Header -->
          <div class="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ getCompanyName(selectedCompanyId) }}
            </h2>
            <button
              @click="selectedCompanyId = null"
              class="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          </div>

          <!-- Ready to Request Premium Banner / Completed Banner -->
          <div
            v-if="isBillingInfoComplete"
            :class="[
              'rounded-lg p-4 mb-6',
              premiumRequestStatus[selectedCompanyId] === 'completed'
                ? 'bg-green-50 border border-green-200' 
                : 'bg-blue-50 border border-blue-200'
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <!-- Completed: Green checkmark -->
                  <div
                    v-if="premiumRequestStatus[selectedCompanyId] === 'completed'"
                    class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center"
                  >
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
                  <!-- Pending: Blue checkmark -->
                  <svg
                    v-else
                    class="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    :class="[
                      'text-sm font-semibold',
                      premiumRequestStatus[selectedCompanyId] === 'completed'
                        ? 'text-green-900' 
                        : 'text-blue-900'
                    ]"
                  >
                    {{ premiumRequestStatus[selectedCompanyId] === 'completed' 
                      ? 'Final Proposal & Issuance:' 
                      : 'Ready to Request Initial Premium' }}
                  </h3>
                  <p
                    :class="[
                      'text-sm mt-1',
                      premiumRequestStatus[selectedCompanyId] === 'completed'
                        ? 'text-green-700' 
                        : 'text-blue-700'
                    ]"
                  >
                    {{ premiumRequestStatus[selectedCompanyId] === 'completed'
                      ? 'Congratulations! You can now send the final proposal to client and issue policy.' 
                      : 'All billing information is complete. You can now request the initial premium for this subsidiary.' }}
                  </p>
                </div>
              </div>
              <button
                v-if="premiumRequestStatus[selectedCompanyId] !== 'completed'"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                @click="handleRequestInitialPremium"
              >
                Request Initial Premium
              </button>
            </div>
          </div>

          <!-- Billing Information -->
          <div
            :class="[
              'border rounded-lg p-4',
              isBillingInfoComplete ? 'border-gray-200 bg-gray-50' : 'border-yellow-300 bg-yellow-50',
            ]"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900">Billing Information</h3>
              <div class="flex items-center gap-2">
                <span
                  v-if="!isBillingInfoComplete"
                  class="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded font-medium"
                >
                  Missing Information
                </span>
                <!-- Edit button in view mode -->
                <button
                  v-if="isBillingInfoComplete && !isEditingBilling"
                  @click="isEditingBilling = true"
                  class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                >
                  Edit
                </button>
                <!-- Cancel and Save buttons in edit mode (only when editing complete info) -->
                <div v-if="isEditingBilling && isBillingInfoComplete" class="flex items-center gap-2">
                  <button
                    @click="cancelEditBilling"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    @click="saveBillingInfo"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <!-- View Mode: Data View (Read-only) -->
            <div v-if="isBillingInfoComplete && !isEditingBilling" class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div class="text-xs text-gray-600 mb-1">Billing Frequency</div>
                <div class="text-sm font-semibold text-gray-900">{{ billingInfo.frequency }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-600 mb-1">Billing Pricing Date</div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ billingInfo.billingPricingDate }}
                </div>
              </div>
              <div>
                <div class="text-xs text-gray-600 mb-1">Billing Year Mode</div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ billingInfo.billingYearMode }}
                </div>
              </div>
              <div>
                <div class="text-xs text-gray-600 mb-1">Payor</div>
                <div class="text-sm font-semibold text-gray-900">{{ billingInfo.payor }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-600 mb-1">Billing channel</div>
                <div class="text-sm font-semibold text-gray-900">{{ billingInfo.channel }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-600 mb-1">Grace period</div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ billingInfo.gracePeriod }} days
                </div>
              </div>
              <div>
                <div class="text-xs text-gray-600 mb-1">Lead days</div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ billingInfo.leadDays }} day
                </div>
              </div>
              <div>
                <div class="text-xs text-gray-600 mb-1">Assume Paid</div>
                <div class="text-sm font-semibold text-gray-900">{{ billingInfo.assumePaid }}</div>
              </div>
              <div v-if="billingInfo.channel === 'Direct Debit (New)' && billingInfo.bankAccount">
                <div class="text-xs text-gray-600 mb-1">Bank Account</div>
                <div class="text-sm font-semibold text-gray-900">
                  {{ getBankAccountName(billingInfo.bankAccount) }}
                </div>
              </div>
            </div>

            <!-- Edit Mode OR Missing Info State: Only Billing Channel Editable -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Billing Frequency
                </label>
                <div class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
                  {{ billingInfo.frequency || '—' }}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Payor</label>
                <div class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
                  {{ billingInfo.payor || '—' }}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Lead days</label>
                <div class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
                  {{ billingInfo.leadDays }} day
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Billing Pricing Date
                </label>
                <div class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
                  {{ billingInfo.billingPricingDate }}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Billing channel <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="billingInfo.channel"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    !billingInfo.channel ? 'border-red-300 bg-red-50' : 'border-gray-300',
                  ]"
                >
                  <option value="">Select channel</option>
                  <option value="Digital Payment">Digital Payment</option>
                  <option value="Direct Debit (New)">Direct Debit (New)</option>
                  <option value="Offline channel">Offline channel</option>
                </select>
              </div>
              <div v-if="billingInfo.channel === 'Direct Debit (New)'">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="billingInfo.bankAccount"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    !billingInfo.bankAccount ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
                  ]"
                >
                  <option value="">Select bank account</option>
                  <option
                    v-for="account in getBankAccountsForCompany(selectedCompanyId)"
                    :key="account.id"
                    :value="account.id"
                  >
                    {{ account.name }} - {{ account.accountNumber }}
                  </option>
                </select>
                <a
                  href="#"
                  class="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-1 inline-block"
                  @click.prevent="handleAddBankAccount"
                >
                  Add Bank Account
                </a>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Assume Paid</label>
                <div class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
                  {{ billingInfo.assumePaid }}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Billing Year Mode
                </label>
                <div class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
                  {{ billingInfo.billingYearMode }}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Grace period</label>
                <div class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
                  {{ billingInfo.gracePeriod }} days
                </div>
              </div>
            </div>
          </div>

          <!-- Premium Summary -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Premium Summary</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Gross Premium</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(premiumSummary.grossPremium) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Taxes</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ formatCurrency(premiumSummary.taxes) }}
                </span>
              </div>
              <div class="flex justify-between items-center border-t border-gray-200 pt-3">
                <span class="text-sm font-semibold text-gray-900">Total</span>
                <span class="text-sm font-semibold text-gray-900">
                  {{ formatCurrency(premiumSummary.total) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Premium Requests Table -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Premium Requests</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-2 px-3 font-medium text-gray-700">Request ID</th>
                    <th class="text-left py-2 px-3 font-medium text-gray-700">Date</th>
                    <th class="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                    <th class="text-right py-2 px-3 font-medium text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="request in premiumRequests"
                    :key="request.id"
                    class="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td class="py-2 px-3 text-gray-900">{{ request.id }}</td>
                    <td class="py-2 px-3 text-gray-900">{{ request.date }}</td>
                    <td class="py-2 px-3">
                      <span
                        :class="[
                          'text-xs px-2 py-1 rounded',
                          request.status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800',
                        ]"
                      >
                        {{ request.status }}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-right text-gray-900 font-medium">
                      {{ formatCurrency(request.amount) }}
                    </td>
                  </tr>
                  <tr v-if="premiumRequests.length === 0">
                    <td colspan="4" class="py-4 px-3 text-center text-gray-500 text-sm">
                      No premium requests found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Premium Balance -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">Premium Balance</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-2 px-3 font-medium text-gray-700">Sub-account</th>
                    <th class="text-left py-2 px-3 font-medium text-gray-700">
                      Sub-account Category
                    </th>
                    <th class="text-left py-2 px-3 font-medium text-gray-700">Sub-entity</th>
                    <th class="text-left py-2 px-3 font-medium text-gray-700">Description</th>
                    <th class="text-right py-2 px-3 font-medium text-gray-700">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="5" class="py-12">
                      <div class="flex flex-col items-center justify-center text-gray-400">
                        <svg
                          class="w-12 h-12 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <span class="text-sm">No data</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Billing Plan Table -->
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-900">Billing Plan</h3>
            </div>

            <div v-if="selectedBillingPlan" class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-2 px-3 font-medium text-gray-700"></th>
                    <th class="text-left py-2 px-3 font-medium text-gray-700">Bill from</th>
                    <th class="text-left py-2 px-3 font-medium text-gray-700">Bill to</th>
                    <th class="text-right py-2 px-3 font-medium text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(component, index) in selectedBillingPlan.components"
                    :key="component.id"
                    class="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td class="py-2 px-3 text-gray-900">{{ index + 1 }}</td>
                    <td class="py-2 px-3 text-gray-900">{{ component.billFrom }}</td>
                    <td class="py-2 px-3 text-gray-900">{{ component.billTo }}</td>
                    <td class="py-2 px-3 text-right text-gray-900 font-medium">
                      {{ formatCurrency(component.amount, component.currency) }}
                    </td>
                  </tr>
                  <!-- Total Row -->
                  <tr class="border-t-2 border-gray-300 bg-gray-50">
                    <td colspan="3" class="py-2 px-3 text-right font-semibold text-gray-900">
                      Total
                    </td>
                    <td class="py-2 px-3 text-right font-semibold text-gray-900">
                      {{ formatCurrency(selectedBillingPlan.totalAmount, selectedBillingPlan.currency) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center py-8 text-sm text-gray-500">
              No billing plan found for this company
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import BillingCompanyTreeItem from './BillingCompanyTreeItem.vue'
import type { Company } from '@/features/document-upload/types'
import type { BillingPlan, BillingComponent } from '@/features/billing/types'

// Mock companies - Master Group with 7 subsidiaries (Acme Corporation + 6 subsidiaries)
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

// Mock billing information for each subsidiary
const mockBillingInfo = ref<Record<
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
>>({
  'sub-1': {
    frequency: 'Monthly',
    channel: 'Digital Payment',
    payor: 'Kate BA Client',
    leadDays: 0,
    billingPricingDate: 'Bill Effective Date',
    assumePaid: 'No',
    billingYearMode: 'Policy year',
    gracePeriod: 31,
  },
  'sub-2': {
    frequency: 'Quarterly',
    channel: 'Direct Debit (New)',
    bankAccount: 'bank-3', // Pre-select bank account for sub-2
    payor: 'Kate BA Client',
    leadDays: 0,
    billingPricingDate: 'Bill Effective Date',
    assumePaid: 'No',
    billingYearMode: 'Policy year',
    gracePeriod: 31,
  },
  'sub-3': {
    frequency: 'Annual',
    channel: 'Offline channel',
    payor: 'Kate BA Client',
    leadDays: 0,
    billingPricingDate: 'Bill Effective Date',
    assumePaid: 'No',
    billingYearMode: 'Policy year',
    gracePeriod: 31,
  },
  'sub-4': {
    frequency: 'Monthly',
    channel: '', // Missing channel - warning state
    payor: 'Kate BA Client',
    leadDays: 0,
    billingPricingDate: 'Bill Effective Date',
    assumePaid: 'No',
    billingYearMode: 'Policy year',
    gracePeriod: 31,
  },
  'sub-5': {
    frequency: '', // Missing frequency - warning state
    channel: 'Digital Payment',
    payor: 'Kate BA Client',
    leadDays: 0,
    billingPricingDate: 'Bill Effective Date',
    assumePaid: 'No',
    billingYearMode: 'Policy year',
    gracePeriod: 31,
  },
  'sub-6': {
    frequency: 'Monthly',
    channel: 'Direct Debit (New)',
    bankAccount: 'bank-7',
    payor: 'Kate BA Client',
    leadDays: 0,
    billingPricingDate: 'Bill Effective Date',
    assumePaid: 'No',
    billingYearMode: 'Policy year',
    gracePeriod: 31,
  },
  // Default for parent company
  'parent-1': {
    frequency: 'Monthly',
    channel: 'Digital Payment',
    payor: 'Kate BA Client',
    leadDays: 0,
    billingPricingDate: 'Bill Effective Date',
    assumePaid: 'No',
    billingYearMode: 'Policy year',
    gracePeriod: 31,
  },
})

const companies = ref<Company[]>(mockCompanies)
const loading = ref(false)
const loadingBilling = ref(false)
const selectedCompanyId = ref<string | null>('master-group') // Default to Master Group
const expandedNodes = ref<Set<string>>(new Set(['master-group']))
const selectedBillingPlan = ref<BillingPlan | null>(null)
const isEditingBilling = ref(false)
const originalBillingInfo = ref<typeof billingInfo.value | null>(null)
const isEditingMasterBilling = ref(true) // Default to edit mode
const originalMasterBillingInfo = ref<typeof masterBillingInfo.value | null>(null)

// Track premium request status for each subsidiary
// 'pending' = billing complete, ready to request (shows "Request Premium" badge, blue banner with button)
// 'completed' = premium requested (shows checkmark icon, green banner with no button)
const premiumRequestStatus = ref<Record<string, 'ready' | 'pending' | 'completed'>>({
  'sub-1': 'pending',
  'sub-2': 'pending',
  'sub-3': 'pending',
  'parent-1': 'pending',
  'sub-6': 'pending', // Acme Pacific Division - complete billing, ready to request
  // No companies are completed by default
})

// Billing information state - will be updated when company is selected
const billingInfo = ref({
  frequency: '',
  channel: '',
  payor: '',
  leadDays: 0,
  billingPricingDate: 'Bill Effective Date',
  assumePaid: 'No',
  billingYearMode: 'Policy year',
  gracePeriod: 31,
  bankAccount: '',
})

// Mock bank accounts for each subsidiary
interface BankAccount {
  id: string
  name: string
  accountNumber: string
  companyId: string
}

const mockBankAccounts: BankAccount[] = [
  { id: 'bank-1', name: 'Main Account', accountNumber: '****1234', companyId: 'sub-1' },
  { id: 'bank-2', name: 'Operating Account', accountNumber: '****5678', companyId: 'sub-1' },
  { id: 'bank-3', name: 'Primary Account', accountNumber: '****9012', companyId: 'sub-2' },
  { id: 'bank-4', name: 'Main Account', accountNumber: '****3456', companyId: 'sub-3' },
  { id: 'bank-5', name: 'Corporate Account', accountNumber: '****7890', companyId: 'sub-4' },
  { id: 'bank-6', name: 'Business Account', accountNumber: '****2345', companyId: 'sub-5' },
  { id: 'bank-7', name: 'Main Account', accountNumber: '****6789', companyId: 'sub-6' },
]

// Get bank accounts for a specific company
const getBankAccountsForCompany = (companyId: string | null): BankAccount[] => {
  if (!companyId) return []
  return mockBankAccounts.filter((account) => account.companyId === companyId)
}

// Get bank account name by ID
const getBankAccountName = (bankAccountId: string): string => {
  const account = mockBankAccounts.find((acc) => acc.id === bankAccountId)
  return account ? `${account.name} - ${account.accountNumber}` : ''
}

// Handle add bank account click
const handleAddBankAccount = () => {
  // In a real app, this would open a modal or navigate to add bank account page
  alert('Add Bank Account functionality would open here')
}

// Handle bulk request premium for all pending subsidiaries
const handleBulkRequestPremium = () => {
  const pendingIds = allSubsidiaryIds.value.filter((id) => {
    const info = mockBillingInfo.value[id]
    if (!info) return false
    const hasFrequency = !!info.frequency
    const hasChannel = !!info.channel
    const hasBankAccount =
      info.channel !== 'Direct Debit (New)' || !!info.bankAccount
    const isComplete = hasFrequency && hasChannel && hasBankAccount
    const status = premiumRequestStatus.value[id]
    return isComplete && (status === 'pending' || !status)
  })

  if (pendingIds.length === 0) {
    alert('No subsidiaries available for premium request')
    return
  }

  // Change all pending subsidiaries to completed
  pendingIds.forEach((id) => {
    premiumRequestStatus.value[id] = 'completed'
  })

  alert(`Premium request submitted for ${pendingIds.length} subsidiary${pendingIds.length > 1 ? 'ies' : ''}`)
}

// Handle request initial premium
const handleRequestInitialPremium = () => {
  // In a real app, this would trigger the premium request flow
  if (selectedCompanyId.value) {
    // Change status to completed after requesting premium
    premiumRequestStatus.value[selectedCompanyId.value] = 'completed'
    alert(`Premium request submitted successfully for ${getCompanyName(selectedCompanyId.value)}`)
  }
}

// Cancel edit and restore original values
const cancelEditBilling = () => {
  if (originalBillingInfo.value) {
    billingInfo.value = { ...originalBillingInfo.value }
  }
  isEditingBilling.value = false
  originalBillingInfo.value = null
}

// Save billing information
const saveBillingInfo = async () => {
  // Validate required fields
  if (!billingInfo.value.frequency || !billingInfo.value.channel) {
    alert('Please fill in all required fields')
    return
  }

  if (
    billingInfo.value.channel === 'Direct Debit (New)' &&
    !billingInfo.value.bankAccount
  ) {
    alert('Please select a bank account for Direct Debit')
    return
  }

  // In a real app, this would save to the backend
  // For now, just update the mock data
  if (selectedCompanyId.value) {
    // Update the mock billing info - create a new object to ensure reactivity
    mockBillingInfo.value[selectedCompanyId.value] = {
      ...mockBillingInfo.value[selectedCompanyId.value],
      ...billingInfo.value,
    }
    
    // Set status to 'pending' when billing info is saved and complete
    if (isBillingInfoComplete.value) {
      premiumRequestStatus.value[selectedCompanyId.value] = 'pending'
    }
  }

  // Regenerate billing plan if frequency changed
  if (selectedCompanyId.value) {
    await loadBillingPlan(selectedCompanyId.value)
  }

  isEditingBilling.value = false
  originalBillingInfo.value = null
}

// Check if billing information is complete (frequency and channel are required)
// If channel is Direct Debit, bank account is also required
const isBillingInfoComplete = computed(() => {
  const hasFrequency = !!billingInfo.value.frequency
  const hasChannel = !!billingInfo.value.channel
  const hasBankAccount =
    billingInfo.value.channel !== 'Direct Debit (New)' || !!billingInfo.value.bankAccount
  return hasFrequency && hasChannel && hasBankAccount
})

// Master Group billing info
const masterBillingInfo = ref({
  frequency: '',
  channel: '',
  applyTo: 'subsidiaries-without-channel',
})

// Get all subsidiary IDs (excluding master-group)
const allSubsidiaryIds = computed(() => {
  const masterGroup = companies.value.find((c) => c.id === 'master-group')
  return masterGroup?.children?.map((c) => c.id) || []
})

// Check if all companies with complete billing have requested premium (all are 'completed')
const allCompaniesCompleted = computed(() => {
  const companiesWithCompleteBilling = allSubsidiaryIds.value.filter((id) => {
    const info = mockBillingInfo.value[id]
    if (!info) return false
    const hasFrequency = !!info.frequency
    const hasChannel = !!info.channel
    const hasBankAccount =
      info.channel !== 'Direct Debit (New)' || !!info.bankAccount
    return hasFrequency && hasChannel && hasBankAccount
  })

  if (companiesWithCompleteBilling.length === 0) return false

  // All companies with complete billing must have 'completed' status
  return companiesWithCompleteBilling.every((id) => {
    return premiumRequestStatus.value[id] === 'completed'
  })
})

// Count ready subsidiaries (have requested premium - status is 'completed')
const readySubsidiariesCount = computed(() => {
  return allSubsidiaryIds.value.filter((id) => {
    const info = mockBillingInfo.value[id]
    if (!info) return false
    const hasFrequency = !!info.frequency
    const hasChannel = !!info.channel
    const hasBankAccount =
      info.channel !== 'Direct Debit (New)' || !!info.bankAccount
    const isComplete = hasFrequency && hasChannel && hasBankAccount
    // Ready if billing is complete AND status is 'completed' (premium requested)
    const status = premiumRequestStatus.value[id]
    return isComplete && status === 'completed'
  }).length
})

// Total subsidiaries count
const totalSubsidiariesCount = computed(() => {
  return allSubsidiaryIds.value.length
})

// Count pending subsidiaries (have complete billing info but haven't requested premium - status is 'pending' or undefined)
const pendingSubsidiariesCount = computed(() => {
  return allSubsidiaryIds.value.filter((id) => {
    const info = mockBillingInfo.value[id]
    if (!info) return false
    const hasFrequency = !!info.frequency
    const hasChannel = !!info.channel
    const hasBankAccount =
      info.channel !== 'Direct Debit (New)' || !!info.bankAccount
    const isComplete = hasFrequency && hasChannel && hasBankAccount
    // Pending if billing is complete AND status is 'pending' or undefined (ready to request but not requested yet)
    const status = premiumRequestStatus.value[id]
    return isComplete && (status === 'pending' || !status)
  }).length
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

// Premium breakdown for master group
const masterPremiumBreakdown = computed(() => {
  const grossPremium = 888
  const fees = 100
  const loading = 120
  const discounts = 50
  const grossPremiumWithoutTaxes = grossPremium + fees + loading - discounts
  const taxes = 142
  const grossPremiumWithTaxes = grossPremiumWithoutTaxes + taxes
  const inwardCommission = 300
  const outwardCommissionPrimary = 20
  const outwardCommissionSecondary = 30
  const outwardCommissionTotal = outwardCommissionPrimary + outwardCommissionSecondary

  return {
    grossPremium,
    fees,
    loading,
    discounts,
    grossPremiumWithoutTaxes,
    taxes,
    grossPremiumWithTaxes,
    inwardCommission,
    outwardCommissionPrimary,
    outwardCommissionSecondary,
    outwardCommissionTotal,
  }
})

// Cancel edit master billing
const cancelEditMasterBilling = () => {
  if (originalMasterBillingInfo.value) {
    masterBillingInfo.value = { ...originalMasterBillingInfo.value }
  }
  isEditingMasterBilling.value = false
  originalMasterBillingInfo.value = null
}

// Save master billing
const saveMasterBilling = () => {
  if (!masterBillingInfo.value.frequency) {
    alert('Please select a billing frequency')
    return
  }

  // Apply billing frequency based on applyTo setting
  if (masterBillingInfo.value.applyTo === 'subsidiaries-without-channel') {
    // Apply to subsidiaries without billing channel OR without frequency
    allSubsidiaryIds.value.forEach((id) => {
      const info = mockBillingInfo.value[id]
      // Check if subsidiary doesn't have a billing channel (empty, missing, or undefined)
      // OR doesn't have a frequency (incomplete subsidiaries)
      const hasNoChannel = !info || !info.channel || info.channel === ''
      const hasNoFrequency = !info || !info.frequency || info.frequency === ''
      
      if (hasNoChannel || hasNoFrequency) {
        // Initialize if doesn't exist
        if (!mockBillingInfo.value[id]) {
          mockBillingInfo.value[id] = {
            frequency: '',
            channel: '',
            payor: '',
            leadDays: 0,
            billingPricingDate: 'Bill Effective Date',
            assumePaid: 'No',
            billingYearMode: 'Policy year',
            gracePeriod: 31,
          }
        }
        // Update frequency for incomplete subsidiaries (missing channel or frequency)
        mockBillingInfo.value[id].frequency = masterBillingInfo.value.frequency
        
        // If billing becomes complete after applying frequency, set status to 'pending'
        const info = mockBillingInfo.value[id]
        const hasFrequency = !!info.frequency
        const hasChannel = !!info.channel
        const hasBankAccount =
          info.channel !== 'Direct Debit (New)' || !!info.bankAccount
        if (hasFrequency && hasChannel && hasBankAccount) {
          premiumRequestStatus.value[id] = 'pending'
        }
      }
    })
  } else if (masterBillingInfo.value.applyTo === 'overwrite-all') {
    // Apply to all subsidiaries (overwrite existing frequencies)
    allSubsidiaryIds.value.forEach((id) => {
      // Initialize if doesn't exist
      if (!mockBillingInfo.value[id]) {
        mockBillingInfo.value[id] = {
          frequency: '',
          channel: '',
          payor: '',
          leadDays: 0,
          billingPricingDate: 'Bill Effective Date',
          assumePaid: 'No',
          billingYearMode: 'Policy year',
          gracePeriod: 31,
        }
      }
      // Overwrite frequency for all subsidiaries
      mockBillingInfo.value[id].frequency = masterBillingInfo.value.frequency
      
      // If billing becomes complete after applying frequency, set status to 'pending'
      const info = mockBillingInfo.value[id]
      const hasFrequency = !!info.frequency
      const hasChannel = !!info.channel
      const hasBankAccount =
        info.channel !== 'Direct Debit (New)' || !!info.bankAccount
      if (hasFrequency && hasChannel && hasBankAccount) {
        premiumRequestStatus.value[id] = 'pending'
      }
    })
  }

  isEditingMasterBilling.value = false
  originalMasterBillingInfo.value = null
  alert('Billing frequency applied successfully')
}

// Watch for edit mode changes to save original values
watch(isEditingMasterBilling, (isEditing) => {
  if (isEditing && !originalMasterBillingInfo.value) {
    // Save a copy of the original values when entering edit mode
    originalMasterBillingInfo.value = { ...masterBillingInfo.value }
  }
})

// Mock premium summary (for individual companies, not master group)
const premiumSummary = computed(() => {
  if (!selectedCompanyId.value || selectedCompanyId.value === 'master-group') {
    return { grossPremium: 0, taxes: 0, total: 0 }
  }
  // Generate deterministic values based on company ID
  const seed = selectedCompanyId.value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const grossPremium = 1000 + (seed % 5000)
  const taxes = Math.round(grossPremium * 0.1)
  const total = grossPremium + taxes
  return { grossPremium, taxes, total }
})

// Mock premium requests - empty by default
const premiumRequests = computed(() => {
  // Return empty array to show empty state
  return []
})

// Mock premium balance
const premiumBalance = computed(() => {
  if (!selectedCompanyId.value) return 0
  const seed = selectedCompanyId.value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return 5000 + (seed % 10000)
})

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
  
  const expandCompany = (company: Company) => {
    newExpanded.add(company.id)
    if (company.children) {
      company.children.forEach(expandCompany)
    }
  }

  companies.value.forEach(expandCompany)
  expandedNodes.value = newExpanded
}

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

const handleCompanySelect = async (companyId: string) => {
  // Don't load billing info for master-group
  if (companyId === 'master-group') {
    selectedCompanyId.value = 'master-group'
    return
  }

  selectedCompanyId.value = companyId
  isEditingBilling.value = false // Reset edit mode when selecting a new company
  originalBillingInfo.value = null
  
  // Load billing info for the selected company
  const companyBillingInfo = mockBillingInfo.value[companyId] || {
    frequency: '',
    channel: '',
    payor: '',
    leadDays: 0,
    billingPricingDate: 'Bill Effective Date',
    assumePaid: 'No',
    billingYearMode: 'Policy year',
    gracePeriod: 31,
    bankAccount: '',
  }
  billingInfo.value = {
    frequency: companyBillingInfo.frequency || '',
    channel: companyBillingInfo.channel || '',
    payor: companyBillingInfo.payor || '',
    leadDays: companyBillingInfo.leadDays ?? 0,
    billingPricingDate: companyBillingInfo.billingPricingDate || 'Bill Effective Date',
    assumePaid: companyBillingInfo.assumePaid || 'No',
    billingYearMode: companyBillingInfo.billingYearMode || 'Policy year',
    gracePeriod: companyBillingInfo.gracePeriod ?? 31,
    bankAccount: companyBillingInfo.bankAccount || '',
  }
  await loadBillingPlan(companyId)
}

// Watch for edit mode changes to save original values
watch(isEditingBilling, (isEditing) => {
  if (isEditing && !originalBillingInfo.value) {
    // Save a copy of the original values when entering edit mode
    originalBillingInfo.value = { ...billingInfo.value }
  }
})

// Watch for frequency changes to regenerate billing plan
watch(
  () => billingInfo.value.frequency,
  async (newFrequency) => {
    if (selectedCompanyId.value && newFrequency) {
      await loadBillingPlan(selectedCompanyId.value)
    }
  }
)

// Watch for premium summary total changes to regenerate billing plan
watch(
  () => premiumSummary.value.total,
  async () => {
    if (selectedCompanyId.value && billingInfo.value.frequency) {
      await loadBillingPlan(selectedCompanyId.value)
    }
  }
)

const loadBillingPlan = async (companyId: string) => {
  loadingBilling.value = true
  try {
    // Generate billing plan based on frequency
    const plan = generateBillingPlanByFrequency(
      companyId,
      billingInfo.value.frequency,
      premiumSummary.value.total
    )
    selectedBillingPlan.value = plan
  } catch (error) {
    console.error('Failed to load billing plan:', error)
    selectedBillingPlan.value = null
  } finally {
    loadingBilling.value = false
  }
}

// Generate billing plan based on frequency
const generateBillingPlanByFrequency = (
  companyId: string,
  frequency: string,
  totalAmount: number
): BillingPlan | null => {
  if (!frequency) {
    return null
  }

  const components: BillingComponent[] = []
  const currency = 'EUR'
  const startDate = new Date('2025-11-03')

  // Determine number of periods and period length based on frequency
  let periods: number
  let periodMonths: number

  switch (frequency) {
    case 'Monthly':
      periods = 12
      periodMonths = 1
      break
    case 'Quarterly':
      periods = 4
      periodMonths = 3
      break
    case 'Semi-Annual':
      periods = 2
      periodMonths = 6
      break
    case 'Annual':
      periods = 1
      periodMonths = 12
      break
    default:
      periods = 12
      periodMonths = 1
  }

  // Calculate amount per period (ensure total matches premium total)
  const amountPerPeriod = totalAmount / periods

  // Generate billing components
  for (let i = 0; i < periods; i++) {
    const billFrom = new Date(startDate)
    billFrom.setMonth(startDate.getMonth() + i * periodMonths)

    const billTo = new Date(billFrom)
    billTo.setMonth(billTo.getMonth() + periodMonths)

    components.push({
      id: `${companyId}-bill-${i + 1}`,
      billFrom: formatDate(billFrom),
      billTo: formatDate(billTo),
      amount: Math.round(amountPerPeriod * 100) / 100, // Round to 2 decimal places
      currency,
    })
  }

  // Recalculate total to ensure it matches premium total exactly
  const calculatedTotal = components.reduce((sum, comp) => sum + comp.amount, 0)
  const difference = totalAmount - calculatedTotal

  // Adjust the last component to account for rounding differences
  if (components.length > 0 && Math.abs(difference) > 0.01) {
    components[components.length - 1].amount =
      Math.round((components[components.length - 1].amount + difference) * 100) / 100
  }

  return {
    companyId,
    components,
    totalAmount,
    currency,
  }
}

// Format date helper
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

onMounted(() => {
  // Master Group is selected by default, no need to select a company
})
</script>

