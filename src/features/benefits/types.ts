export type ID = string

export interface Plan {
  id: ID
  name: string
  benefits: BenefitTemplate[]
}

export interface BenefitTemplate {
  id: ID
  name: string
  type: 'dropdown' | 'text' | 'number' | 'percentage'
  options?: string[] // for dropdown type
  defaultValue?: string
}

