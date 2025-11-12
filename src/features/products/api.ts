import type { Channel, Agent, Product, ID } from './types'

// Helper: simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Channels
const channels: Channel[] = [
  { id: 'digital-direct', name: 'Digital Direct' },
  { id: 'internal-salesforce', name: 'Internal Salesforce' },
  { id: 'brokers', name: 'Brokers' },
  { id: 'aggregators', name: 'Aggregators' },
]

// Agents by channel
const agents: Agent[] = [
  // Digital Direct agents
  { id: 'agent-01', name: 'Agent ID - Chinh Agent 01 Trieu', channelId: 'digital-direct' },
  { id: 'agent-02', name: 'dfhdg - Lisa Smith', channelId: 'digital-direct' },
  
  // Internal Salesforce agents
  { id: 'agent-03', name: 'Agent TN - Agent TN 1', channelId: 'internal-salesforce' },
  { id: 'agent-04', name: 'LL123 - Loc Le', channelId: 'internal-salesforce' },
  
  // Brokers agents
  { id: 'bbf-250901', name: 'BBF250901 - BBF250901 BA BrokerBuyFlpw', channelId: 'brokers' },
  { id: 'omb-001', name: 'OMB001 - Jim Johnson', channelId: 'brokers' },
  { id: '851845', name: '851845 - Oscar Secondary', channelId: 'brokers' },
  { id: '40091', name: '40091 - Sakthi buyflow', channelId: 'brokers' },
  
  // Aggregators agents
  { id: 'agg-01', name: 'AGG001 - Aggregator Agent 1', channelId: 'aggregators' },
  { id: 'agg-02', name: 'AGG002 - Aggregator Agent 2', channelId: 'aggregators' },
]

// Products
const products: Product[] = [
  { id: '10001', name: 'Tailored Product', type: 'GM' },
  { id: '10002', name: 'Harbinger Product', type: 'GM' },
]

// Get all channels
export async function listChannels(): Promise<Channel[]> {
  await delay(100)
  return channels
}

// Get agents by channel
export async function listAgentsByChannel(channelId: ID): Promise<Agent[]> {
  await delay(100)
  return agents.filter(agent => agent.channelId === channelId)
}

// Search agents within a channel
export async function searchAgents(channelId: ID, query: string): Promise<Agent[]> {
  await delay(100)
  
  if (!query) {
    return agents.filter(agent => agent.channelId === channelId)
  }
  
  const q = query.toLowerCase()
  return agents.filter(
    agent => 
      agent.channelId === channelId &&
      (agent.id.toLowerCase().includes(q) || agent.name.toLowerCase().includes(q))
  )
}

// Get products by channel and agent
export async function listProducts(_channelId: ID, _agentId: ID): Promise<Product[]> {
  await delay(100)
  // For now, return all products regardless of channel/agent
  // In a real app, this would filter based on permissions
  return products
}

// Search products
export async function searchProducts(channelId: ID, agentId: ID, query: string): Promise<Product[]> {
  await delay(100)
  
  const allProducts = await listProducts(channelId, agentId)
  
  if (!query) return allProducts
  
  const q = query.toLowerCase()
  return allProducts.filter(
    product =>
      product.id.toLowerCase().includes(q) ||
      product.name.toLowerCase().includes(q) ||
      product.type.toLowerCase().includes(q)
  )
}

// Get agent by ID
export async function getAgentById(agentId: ID): Promise<Agent | null> {
  await delay(100)
  return agents.find(agent => agent.id === agentId) || null
}





