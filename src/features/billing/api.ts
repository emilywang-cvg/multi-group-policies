import type { BillingPlan, BillingComponent } from './types'

// Helper: simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Parse date string (handles both YYYY-MM-DD and DD-MM-YYYY formats)
function parseDate(dateString: string): Date {
  // Try YYYY-MM-DD format first
  if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
    return new Date(dateString)
  }
  // Try DD-MM-YYYY format
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
    const year = parseInt(parts[2], 10)
    return new Date(year, month, day)
  }
  // Fallback to standard Date parsing
  return new Date(dateString)
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// Mock billing plans - generate monthly billing components
function generateBillingPlan(companyId: string, startDate?: string): BillingPlan {
  const components: BillingComponent[] = []
  const monthlyAmount = 88.41
  const currency = 'EUR'
  
  // Generate 12 monthly billing periods
  const start = startDate ? parseDate(startDate) : new Date('2025-11-03')
  for (let i = 0; i < 12; i++) {
    const billFrom = new Date(start)
    billFrom.setMonth(start.getMonth() + i)
    
    const billTo = new Date(billFrom)
    billTo.setMonth(billTo.getMonth() + 1)
    
    components.push({
      id: `${companyId}-bill-${i + 1}`,
      billFrom: formatDate(billFrom),
      billTo: formatDate(billTo),
      amount: monthlyAmount,
      currency,
    })
  }
  
  const totalAmount = components.reduce((sum, comp) => sum + comp.amount, 0)
  
  return {
    companyId,
    components,
    totalAmount,
    currency,
  }
}

// In-memory cache for billing plans
const billingPlansCache = new Map<string, BillingPlan>()

// Get billing plan for a company
export async function getBillingPlan(companyId: string, policyStartDate?: string): Promise<BillingPlan | null> {
  await delay(100)
  
  // Check cache first
  if (billingPlansCache.has(companyId)) {
    return billingPlansCache.get(companyId)!
  }
  
  // Generate new billing plan
  const plan = generateBillingPlan(companyId, policyStartDate)
  billingPlansCache.set(companyId, plan)
  
  return plan
}

// Get billing plans for multiple companies
export async function getBillingPlans(companyIds: string[], policyStartDate?: string): Promise<BillingPlan[]> {
  await delay(150)
  
  const plans: BillingPlan[] = []
  for (const companyId of companyIds) {
    const plan = await getBillingPlan(companyId, policyStartDate)
    if (plan) {
      plans.push(plan)
    }
  }
  
  return plans
}

