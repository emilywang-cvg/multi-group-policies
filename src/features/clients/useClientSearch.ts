import { ref, reactive, computed, watch } from 'vue'
import type { CompanyNode, ID } from './types'
import * as api from './api'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export interface FlatNode {
  node: CompanyNode
  depth: 0 | 1
  parent?: CompanyNode
}

export function useClientSearch() {
  const query = ref('')
  const page = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  const parents = ref<CompanyNode[]>([])
  const expanded = reactive<Record<ID, boolean>>({})
  const selection = ref<CompanyNode | null>(null)
  const highlightIndex = ref(-1)
  const total = ref(0)

  // Fetch parents with current query/page (and load all children)
  async function fetchParents() {
    loading.value = true
    try {
      const result = await api.listParents({
        q: query.value,
        page: page.value,
        pageSize: pageSize.value,
      })
      parents.value = result.rows
      total.value = result.total
      
      // Load children for all parents so they appear at the same level
      for (const parent of parents.value) {
        if (parent.isParent && !parent.children) {
          try {
            const children = await api.listChildren(parent.id)
            parent.children = children
          } catch (error) {
            console.error(`Failed to load children for ${parent.id}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch parents:', error)
    } finally {
      loading.value = false
    }
  }

  // Debounced fetch
  function debouncedFetch() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      page.value = 1 // reset to first page on search
      fetchParents()
    }, 300)
  }

  // Watch query changes
  watch(query, () => {
    debouncedFetch()
  })

  // Toggle expand/collapse with lazy loading
  async function toggleExpand(parentId: ID) {
    if (expanded[parentId]) {
      // Collapse
      expanded[parentId] = false
    } else {
      // Expand - lazy load children if not present
      const parent = parents.value.find(p => p.id === parentId)
      if (parent && !parent.children) {
        loading.value = true
        try {
          const children = await api.listChildren(parentId)
          parent.children = children
        } catch (error) {
          console.error('Failed to load children:', error)
        } finally {
          loading.value = false
        }
      }
      expanded[parentId] = true
    }
  }

  // Select a node
  function select(node: CompanyNode) {
    selection.value = node
  }

  // Clear selection
  function clearSelection() {
    selection.value = null
  }

  // Flatten parents + children for table rendering (all at same level)
  function flattenForTable(
    parentsList: CompanyNode[],
    expandedMap: Record<ID, boolean>
  ): FlatNode[] {
    const result: FlatNode[] = []

    parentsList.forEach(parent => {
      result.push({ node: parent, depth: 0 })

      // Always include children at the same level (no nesting)
      if (parent.children) {
        parent.children.forEach(child => {
          result.push({ node: child, depth: 0, parent })
        })
      }
    })

    return result
  }

  const flatNodes = computed(() => flattenForTable(parents.value, expanded))

  // Keyboard navigation
  function onKeyNav(e: KeyboardEvent) {
    const nodes = flatNodes.value

    // '/' to focus search
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault()
      const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]')
      searchInput?.focus()
      return
    }

    // Arrow keys
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (highlightIndex.value < nodes.length - 1) {
        highlightIndex.value++
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (highlightIndex.value > 0) {
        highlightIndex.value--
      }
    } else if (e.key === 'Enter' && highlightIndex.value >= 0) {
      e.preventDefault()
      const highlighted = nodes[highlightIndex.value]
      if (highlighted) {
        select(highlighted.node)
      }
    }
  }

  // Auto-select by ID (used when returning from create client)
  async function autoSelectById(id: ID) {
    // First, fetch parents to make sure we have the data
    await fetchParents()

    // Try to find in current parents
    const parent = parents.value.find(p => p.id === id)
    if (parent) {
      select(parent)
      return
    }

    // Check if it might be a child - expand all parents and search
    for (const parent of parents.value) {
      if (!parent.children) {
        await toggleExpand(parent.id)
      }
      const child = parent.children?.find(c => c.id === id)
      if (child) {
        select(child)
        return
      }
    }
  }

  return {
    query,
    page,
    pageSize,
    loading,
    parents,
    expanded,
    selection,
    highlightIndex,
    total,
    flatNodes,
    fetchParents,
    toggleExpand,
    select,
    clearSelection,
    onKeyNav,
    autoSelectById,
  }
}

