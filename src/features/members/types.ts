export type ID = string

export interface Member {
  id: ID
  offerId: ID
  classId: ID
  className: string
  companyId: ID
  companyName: string
  censusLevel?: string
  firstName: string
  lastName: string
  nationality?: string
  dateOfBirth?: string
  gender?: 'Male' | 'Female' | 'Other'
  plan?: string
  relationship: 'Employee' | 'Spouse' | 'Child' | 'Parent'
  createdAt: string
}

export interface CensusSummary {
  companyId: ID
  companyName: string
  totalCount: number
  employeeCount: number
  spouseCount: number
  childCount: number
  parentCount: number
}

export interface CreateMemberInput {
  offerId: ID
  classId: ID
  companyId: ID
  censusLevel?: string
  firstName: string
  lastName: string
  nationality?: string
  dateOfBirth?: string
  gender?: 'Male' | 'Female' | 'Other'
  plan?: string
  relationship: 'Employee' | 'Spouse' | 'Child' | 'Parent'
}








