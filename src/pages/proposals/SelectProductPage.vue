<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Channel, Agent, Product } from '@/features/products/types'
import type { CompanyNode } from '@/features/clients/types'
import * as api from '@/features/products/api'
import * as clientApi from '@/features/clients/api'
import * as proposalApi from '@/features/proposals/api'

const router = useRouter()
const route = useRoute()

const clientId = computed(() => route.query.clientId as string)
const client = ref<CompanyNode | null>(null)

// Channel & Agent
const channels = ref<Channel[]>([])
const selectedChannel = ref<Channel | null>(null)
const agents = ref<Agent[]>([])
const selectedAgent = ref<Agent | null>(null)
const agentSearchQuery = ref('')
const showAgentDropdown = ref(false)

// Products
const products = ref<Product[]>([])
const selectedProduct = ref<Product | null>(null)
const productSearchQuery = ref('')
const loading = ref(false)

onMounted(async () => {
  channels.value = await api.listChannels()
  
  // Load client data
  if (clientId.value) {
    client.value = await clientApi.getCompanyById(clientId.value)
  }
})

// Watch channel selection
watch(selectedChannel, async (newChannel) => {
  selectedAgent.value = null
  agents.value = []
  products.value = []
  selectedProduct.value = null
  
  if (newChannel) {
    agents.value = await api.listAgentsByChannel(newChannel.id)
  }
})

// Watch agent selection
watch(selectedAgent, async (newAgent) => {
  products.value = []
  selectedProduct.value = null
  
  if (newAgent && selectedChannel.value) {
    loading.value = true
    try {
      products.value = await api.listProducts(selectedChannel.value.id, newAgent.id)
    } finally {
      loading.value = false
    }
  }
})

// Agent search
let agentSearchTimeout: ReturnType<typeof setTimeout> | null = null
watch(agentSearchQuery, (query) => {
  if (!selectedChannel.value) return
  
  if (agentSearchTimeout) clearTimeout(agentSearchTimeout)
  
  agentSearchTimeout = setTimeout(async () => {
    agents.value = await api.searchAgents(selectedChannel.value!.id, query)
  }, 300)
})

// Product search
let productSearchTimeout: ReturnType<typeof setTimeout> | null = null
watch(productSearchQuery, (query) => {
  if (!selectedChannel.value || !selectedAgent.value) return
  
  if (productSearchTimeout) clearTimeout(productSearchTimeout)
  
  productSearchTimeout = setTimeout(async () => {
    loading.value = true
    try {
      products.value = await api.searchProducts(
        selectedChannel.value!.id,
        selectedAgent.value!.id,
        query
      )
    } finally {
      loading.value = false
    }
  }, 300)
})

function selectAgent(agent: Agent) {
  selectedAgent.value = agent
  agentSearchQuery.value = agent.name
  showAgentDropdown.value = false
}

function selectProduct(product: Product) {
  selectedProduct.value = product
}

function handleCancel() {
  router.push('/proposals/new')
}

function handleBackToClient() {
  if (clientId.value) {
    router.push(`/proposals/preview/${clientId.value}`)
  } else {
    router.push('/proposals/new')
  }
}

async function handleCreateProposal() {
  // Silently prevent submission if required fields are not selected
  if (!selectedProduct.value || !selectedChannel.value || !selectedAgent.value || !client.value) {
    return
  }
  
  loading.value = true
  try {
    const proposal = await proposalApi.createProposal({
      clientId: client.value.id,
      clientName: client.value.name,
      channelId: selectedChannel.value.id,
      channelName: selectedChannel.value.name,
      agentId: selectedAgent.value.id,
      agentName: selectedAgent.value.name,
      productId: selectedProduct.value.id,
      productName: selectedProduct.value.name,
      productType: selectedProduct.value.type,
    })
    
    console.log('Proposal created:', proposal)
    
    // Navigate to proposal detail page
    router.push(`/proposals/${proposal.id}`)
  } catch (error) {
    console.error('Failed to create proposal:', error)
    // Silently handle error - could add inline error message in future
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">New Proposal</h1>

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

    <!-- Channel Selection -->
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Channel</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Channel</label>
          <div class="relative">
            <select
              v-model="selectedChannel"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
            >
              <option :value="null">Select</option>
              <option v-for="channel in channels" :key="channel.id" :value="channel">
                {{ channel.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Primary Agent</label>
          <div class="relative">
            <input
              v-model="agentSearchQuery"
              @focus="showAgentDropdown = true"
              @blur="setTimeout(() => showAgentDropdown = false, 200)"
              type="text"
              placeholder="Select"
              :disabled="!selectedChannel"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <!-- Agent Dropdown -->
            <div
              v-if="showAgentDropdown && selectedChannel && agents.length > 0"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <button
                v-for="agent in agents"
                :key="agent.id"
                @click="selectAgent(agent)"
                class="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div class="text-sm font-medium text-gray-900">{{ agent.name }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product Selection -->
    <div v-if="!selectedChannel || !selectedAgent" class="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-gray-600 text-lg">Select Channel and Agent to view available products</p>
    </div>

    <div v-else class="bg-white border border-gray-200 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Product</h3>
        <div class="flex items-center space-x-4">
          <div class="relative">
            <input
              v-model="productSearchQuery"
              type="text"
              placeholder="Search product..."
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>Product Type</span>
          </button>
        </div>
      </div>

      <!-- Products Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product ID
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Type
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="product in products"
              :key="product.id"
              :class="{
                'bg-blue-50 border-l-4 border-blue-600': selectedProduct?.id === product.id,
                'hover:bg-gray-50': selectedProduct?.id !== product.id,
              }"
              class="transition-colors"
            >
              <td class="px-4 py-3 text-sm text-gray-900">{{ product.id }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ product.name }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ product.type }}</td>
              <td class="px-4 py-3 text-sm text-right">
                <button
                  @click="selectProduct(product)"
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
            <tr v-if="!loading && products.length === 0">
              <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                No products found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center justify-end space-x-3 pt-6">
      <button
        @click="handleCancel"
        class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
      >
        Cancel
      </button>
      <button
        @click="handleBackToClient"
        class="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-colors"
      >
        Back to Client
      </button>
      <button
        @click="handleCreateProposal"
        :disabled="!selectedProduct"
        :class="{
          'bg-blue-600 hover:bg-blue-700 text-white': selectedProduct,
          'bg-gray-300 text-gray-500 cursor-not-allowed': !selectedProduct,
        }"
        class="px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
      >
        Create Proposal
      </button>
    </div>
  </div>
</template>

