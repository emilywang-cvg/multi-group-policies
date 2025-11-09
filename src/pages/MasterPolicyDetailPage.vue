<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const policyId = route.params.id
</script>

<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-4">Master Policy Detail</h1>
    <p class="text-gray-600">Details for policy ID: {{ policyId }}</p>
  </div>
</template>


