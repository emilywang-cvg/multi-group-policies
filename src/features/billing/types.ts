export interface BillingComponent {
  id: string
  billFrom: string // Date string
  billTo: string // Date string
  amount: number
  currency?: string
}

export interface BillingPlan {
  companyId: string
  components: BillingComponent[]
  totalAmount: number
  currency?: string
}



