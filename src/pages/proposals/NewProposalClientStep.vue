<script setup lang="ts">
import { useRouter } from 'vue-router'
import ClientSelector from '@/features/clients/ClientSelector.vue'
import type { CompanyNode } from '@/features/clients/types'

const router = useRouter()

function onSelected(node: CompanyNode) {
  console.log('Selected client:', node)
  // Navigate to preview page
  router.push(`/proposals/preview/${node.id}`)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">New Proposal</h1>
    </div>

    <ClientSelector mode="company" @selected="onSelected" />
  </div>
</template>

