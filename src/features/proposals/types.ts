export type ID = string

export type ProposalStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected'
export type OfferStatus = 'Draft' | 'Submitted' | 'Approved'

export interface Proposal {
  id: ID
  number: string // e.g., "#1234"
  clientId: ID
  clientName: string
  channelId: ID
  channelName: string
  agentId: ID
  agentName: string
  productId: ID
  productName: string
  productType: string
  status: ProposalStatus
  offers: Offer[]
  createdAt: string
  updatedAt: string
}

export interface Offer {
  id: ID
  proposalId: ID
  name: string // e.g., "Offer LG", "Offer HG"
  status: OfferStatus
  tasks: OfferTask[]
  policyInfo?: PolicyInfo
  classes: Class[]
  classesEnabled?: boolean // Toggle for Class & Benefits section
  censusData?: CensusData
  termsAndConditions?: string
  premium?: Premium
}

export interface OfferTask {
  id: string
  name: string
  completed: boolean
}

export interface PolicyInfo {
  product?: string
  policyPeriods?: string
  policyStartDate?: string
  policyEndDate?: string
}

export interface Class {
  id: ID
  name: string
  benefits: Benefit[]
}

export interface Benefit {
  id: ID
  name: string
  value: string
}

export interface CensusData {
  uploadedFile?: string
  data?: unknown
}

export interface Premium {
  amount?: number
  currency?: string
  breakdown?: unknown
}

export interface CreateProposalInput {
  clientId: ID
  clientName: string
  channelId: ID
  channelName: string
  agentId: ID
  agentName: string
  productId: ID
  productName: string
  productType: string
}

