import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ID } from '@/features/clients/types'

export const useSelectionStore = defineStore('selection', () => {
  const selectedClientId = ref<ID | undefined>(undefined)

  function setSelected(id: ID) {
    selectedClientId.value = id
  }

  function clear() {
    selectedClientId.value = undefined
  }

  return {
    selectedClientId,
    setSelected,
    clear,
  }
})






