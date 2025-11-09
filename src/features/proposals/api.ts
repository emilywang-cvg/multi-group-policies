import type { Proposal, CreateProposalInput, ID, Offer } from './types'

// Helper: simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Storage keys
const STORAGE_KEY = 'multi-group-policies_proposals'
const COUNTER_KEY = 'multi-group-policies_proposal_counter'

// Initialize from sessionStorage or use empty array
let proposals: Proposal[] = []
try {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (stored) {
    proposals = JSON.parse(stored)
    console.log('📦 Loaded proposals from storage:', proposals.length)
  }
} catch (e) {
  console.warn('Failed to load proposals from storage:', e)
}

// Initialize counter
let nextProposalNumber = 1234
try {
  const stored = sessionStorage.getItem(COUNTER_KEY)
  if (stored) {
    nextProposalNumber = parseInt(stored, 10)
  }
} catch (e) {
  console.warn('Failed to load counter from storage:', e)
}

// Helper to save to storage
function saveToStorage() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(proposals))
    sessionStorage.setItem(COUNTER_KEY, String(nextProposalNumber))
  } catch (e) {
    console.warn('Failed to save to storage:', e)
  }
}

// Create a new proposal with default offer
export async function createProposal(input: CreateProposalInput): Promise<Proposal> {
  await delay(120)

  const proposalId = `P${String(Date.now()).slice(-8)}`
  const proposalNumber = `#${nextProposalNumber++}`

  const defaultOffer: Offer = {
    id: `O${String(Date.now()).slice(-8)}-01`,
    proposalId,
    name: 'Offer LG',
    status: 'Draft',
    tasks: [
      { id: 't1', name: 'Create Task', completed: false },
      { id: 't2', name: 'Enter the Period of Insurance', completed: false },
      { id: 't3', name: 'Upload or Input Census Details', completed: false },
      { id: 't4', name: 'Select Benefit & Networks', completed: false },
    ],
    policyInfo: {
      product: input.productName, // Initialize with selected product name
      policyStartDate: '',
      policyEndDate: '',
    },
    classes: [],
    classesEnabled: true, // Default to enabled
  }

  const newProposal: Proposal = {
    id: proposalId,
    number: proposalNumber,
    clientId: input.clientId,
    clientName: input.clientName,
    channelId: input.channelId,
    channelName: input.channelName,
    agentId: input.agentId,
    agentName: input.agentName,
    productId: input.productId,
    productName: input.productName,
    productType: input.productType,
    status: 'Draft',
    offers: [defaultOffer],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  proposals.unshift(newProposal)
  saveToStorage()
  console.log('✅ Proposal created:', proposalId, 'Total proposals:', proposals.length)
  return newProposal
}

// Get proposal by ID
export async function getProposalById(id: ID): Promise<Proposal | null> {
  await delay(120)
  console.log('🔍 Looking for proposal:', id, 'Available proposals:', proposals.map(p => p.id))
  const found = proposals.find(p => p.id === id) || null
  console.log('🔍 Result:', found ? '✅ Found' : '❌ Not found')
  return found
}

// Update proposal
export async function updateProposal(id: ID, updates: Partial<Proposal>): Promise<Proposal | null> {
  await delay(120)
  
  const index = proposals.findIndex(p => p.id === id)
  if (index === -1) return null
  
  const updatedProposal = {
    ...proposals[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  proposals[index] = updatedProposal
  saveToStorage()
  return updatedProposal
}

// Add offer to proposal
export async function addOffer(proposalId: ID, offerName: string): Promise<Offer | null> {
  await delay(120)
  
  const proposal = proposals.find(p => p.id === proposalId)
  if (!proposal) return null
  
  const newOffer: Offer = {
    id: `O${String(Date.now()).slice(-8)}-${proposal.offers.length + 1}`,
    proposalId,
    name: offerName,
    status: 'Draft',
    tasks: [
      { id: 't1', name: 'Create Task', completed: false },
      { id: 't2', name: 'Enter the Period of Insurance', completed: false },
      { id: 't3', name: 'Upload or Input Census Details', completed: false },
      { id: 't4', name: 'Select Benefit & Networks', completed: false },
    ],
    policyInfo: {
      product: '',
      policyStartDate: '',
      policyEndDate: '',
    },
    classes: [],
    classesEnabled: true, // Default to enabled
  }
  
  proposal.offers.push(newOffer)
  proposal.updatedAt = new Date().toISOString()
  
  saveToStorage()
  return newOffer
}

// List all proposals
export async function listProposals(): Promise<Proposal[]> {
  await delay(100)
  // Return proposals in reverse chronological order (newest first)
  return [...proposals].reverse()
}

