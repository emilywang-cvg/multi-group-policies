import type { CompanyNode, ID, NewClientInput } from './types'

// In-memory database
let companies: CompanyNode[] = []
let nextId = 10000

// Seed data
export function seedCompanies(): void {
  const parentNames = [
    'Company Test Ltd.',
    'Wilco Builders',
    'Apto Insurance PR Japan',
    'BUNIQUE TEST',
    'Adax Insurance Int',
    'Grant Mandela E Assist',
    'Koffels Motor Corp',
    'Stellar Holdings Group',
    'Pacific Trade Ventures',
    'Blue Horizon Technologies',
    'Metro Dynamics Ltd',
    'Crown Enterprises',
    'Summit Financial Services',
    'Apex Marketing Solutions',
    'Velocity Logistics Co',
    'Nexus Global Partners',
    'Prime Investments Ltd',
    'Quantum Retail Group',
  ]

  companies = []

  parentNames.forEach((name, idx) => {
    const parentId = `C${String(idx + 1).padStart(4, '0')}`
    const status = idx % 4 === 0 ? 'INACTIVE' : 'ACTIVE' // Mix some inactive

    const parent: CompanyNode = {
      id: parentId,
      name,
      status,
      isParent: true,
      children: [],
      censusLevels: [
        {
          levelName: 'Department',
          items: ['Engineering', 'Sales', 'Marketing', 'Finance']
        },
        {
          levelName: 'Location',
          items: ['New York', 'San Francisco', 'London', 'Tokyo']
        }
      ]
    }

    // Generate 2-7 subsidiaries
    const numChildren = Math.floor(Math.random() * 6) + 2
    for (let i = 0; i < numChildren; i++) {
      const childId = `${parentId}-${String(i + 1).padStart(2, '0')}`
      const childStatus = Math.random() > 0.2 ? 'ACTIVE' : 'INACTIVE'
      const child: CompanyNode = {
        id: childId,
        name: `${name} (Subsidiary ${i + 1})`,
        status: childStatus,
        isParent: false,
        parentId,
        censusLevels: [
          {
            levelName: 'Team',
            items: ['Development', 'Design', 'QA', 'DevOps']
          },
          {
            levelName: 'Region',
            items: ['North', 'South', 'East', 'West']
          }
        ]
      }
      parent.children!.push(child)
    }

    companies.push(parent)
  })

  nextId = 10000
}

// Helper: simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Filter helper: check if query matches node
function matchesQuery(node: CompanyNode, q: string): boolean {
  if (!q) return true
  const query = q.toLowerCase()
  return node.id.toLowerCase().includes(query) || node.name.toLowerCase().includes(query)
}

// List parents with pagination and search
export async function listParents(options: {
  q?: string
  page?: number
  pageSize?: number
}): Promise<{ rows: CompanyNode[]; total: number }> {
  await delay(120)

  const { q = '', page = 1, pageSize = 10 } = options

  // Filter: include parent if it matches OR any child matches
  const filtered = companies.filter(parent => {
    if (matchesQuery(parent, q)) return true
    // Check children
    if (parent.children?.some(child => matchesQuery(child, q))) return true
    return false
  })

  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize

  // Return parents WITHOUT children (lazy load)
  const rows = filtered.slice(start, end).map(parent => ({
    ...parent,
    children: undefined, // omit children for initial load
  }))

  return { rows, total }
}

// List children of a parent
export async function listChildren(parentId: ID): Promise<CompanyNode[]> {
  await delay(120)

  const parent = companies.find(c => c.id === parentId)
  if (!parent || !parent.children) return []

  return parent.children
}

// Search companies (for subsidiary search)
export async function searchCompanies(q: string): Promise<CompanyNode[]> {
  await delay(120)

  if (!q) return []

  const results: CompanyNode[] = []

  companies.forEach(parent => {
    if (matchesQuery(parent, q)) {
      results.push(parent)
    }
    parent.children?.forEach(child => {
      if (matchesQuery(child, q)) {
        results.push(child)
      }
    })
  })

  return results.slice(0, 20) // limit results
}

// Create a new company with optional subsidiaries
export async function createCompany(input: NewClientInput): Promise<CompanyNode> {
  await delay(120)

  const newId = `C${String(nextId++).padStart(5, '0')}`

  const newParent: CompanyNode = {
    id: newId,
    name: input.name,
    status: input.status || 'ACTIVE',
    isParent: true,
    children: [],
    crNumber: input.crNumber,
    contact: input.contact,
    address: input.address,
    censusLevels: input.censusLevels,
  }

  // Handle subsidiaries
  if (input.subsidiaries && input.subsidiaries.length > 0) {
    input.subsidiaries.forEach((sub, idx) => {
      if (sub.createdInline) {
        // Create new subsidiary
        const childId = `${newId}-${String(idx + 1).padStart(2, '0')}`
        const child: CompanyNode = {
          id: childId,
          name: sub.name,
          status: 'ACTIVE',
          isParent: false,
          parentId: newId,
        }
        newParent.children!.push(child)
      } else if (sub.id) {
        // Reference existing company as subsidiary (simplified: just copy)
        const existing = companies
          .flatMap(p => [p, ...(p.children || [])])
          .find(c => c.id === sub.id)
        if (existing) {
          const child: CompanyNode = {
            ...existing,
            id: `${newId}-${String(idx + 1).padStart(2, '0')}`,
            parentId: newId,
            isParent: false,
          }
          newParent.children!.push(child)
        }
      }
    })
  }

  companies.unshift(newParent) // add to beginning
  return newParent
}

// Get a single company by ID
export async function getCompanyById(id: ID): Promise<CompanyNode | null> {
  await delay(120)

  // Check parents
  const parent = companies.find(c => c.id === id)
  if (parent) {
    return parent
  }

  // Check children
  for (const parent of companies) {
    const child = parent.children?.find(c => c.id === id)
    if (child) {
      return child
    }
  }

  return null
}

// Update company data
export async function updateCompany(id: ID, updates: Partial<CompanyNode>): Promise<CompanyNode | null> {
  await delay(120)

  // Check parents
  const parentIndex = companies.findIndex(c => c.id === id)
  if (parentIndex !== -1) {
    companies[parentIndex] = { ...companies[parentIndex], ...updates }
    saveToStorage()
    console.log('✅ Updated parent company:', companies[parentIndex].name, 'with census levels:', companies[parentIndex].censusLevels?.length || 0)
    return companies[parentIndex]
  }

  // Check children
  for (const parent of companies) {
    const childIndex = parent.children?.findIndex(c => c.id === id)
    if (childIndex !== undefined && childIndex !== -1 && parent.children) {
      parent.children[childIndex] = { ...parent.children[childIndex], ...updates }
      saveToStorage()
      console.log('✅ Updated subsidiary:', parent.children[childIndex].name, 'with census levels:', parent.children[childIndex].censusLevels?.length || 0)
      return parent.children[childIndex]
    }
  }

  return null
}

// Helper to save to storage
function saveToStorage() {
  try {
    sessionStorage.setItem('clients_data', JSON.stringify(companies))
    console.log('💾 Saved clients data to storage')
  } catch (e) {
    console.warn('Failed to save clients to storage:', e)
  }
}

// Initialize from sessionStorage or seed data
function initializeData() {
  try {
    const stored = sessionStorage.getItem('clients_data')
    if (stored) {
      const storedCompanies = JSON.parse(stored)
      companies.length = 0 // Clear existing data
      companies.push(...storedCompanies)
      console.log('📦 Loaded clients from storage:', companies.length)
      return
    }
  } catch (e) {
    console.warn('Failed to load clients from storage:', e)
  }
  
  // Fallback to seed data if no stored data
  seedCompanies()
}

// Initialize data
initializeData()

