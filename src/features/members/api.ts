import type { Member, CreateMemberInput, CensusSummary } from './types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const STORAGE_KEY = 'members_data'
const COUNTER_KEY = 'members_counter'

// Initialize from sessionStorage or use empty array
let members: Member[] = []
try {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (stored) {
    members = JSON.parse(stored)
    console.log('📦 Loaded members from storage:', members.length)
  }
} catch (e) {
  console.warn('Failed to load members from storage:', e)
}

// Initialize counter
let nextMemberId = 1
try {
  const stored = sessionStorage.getItem(COUNTER_KEY)
  if (stored) {
    // Find the highest ID number and set nextMemberId accordingly
    const maxId = members.reduce((max, m) => {
      const num = parseInt(m.id.replace('M', '')) || 0
      return num > max ? num : max
    }, 0)
    nextMemberId = maxId + 1
  }
} catch (e) {
  console.warn('Failed to load member counter from storage:', e)
}

// Helper to save to storage
function saveToStorage() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(members))
    sessionStorage.setItem(COUNTER_KEY, String(nextMemberId))
  } catch (e) {
    console.warn('Failed to save members to storage:', e)
  }
}

// Create a new member
export async function createMember(input: CreateMemberInput): Promise<Member> {
  await delay(150)

  const newMember: Member = {
    id: `M${String(nextMemberId++).padStart(5, '0')}`,
    offerId: input.offerId,
    classId: input.classId,
    className: '', // Will be populated from class data
    companyId: input.companyId,
    companyName: '', // Will be populated from company data
    censusLevel: input.censusLevel,
    firstName: input.firstName,
    lastName: input.lastName,
    nationality: input.nationality,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    plan: input.plan,
    relationship: input.relationship,
    createdAt: new Date().toISOString(),
  }

  members.push(newMember)
  saveToStorage()
  console.log('✅ Member created:', newMember.id)
  return newMember
}

// Get members by offer ID
export async function getMembersByOfferId(offerId: string): Promise<Member[]> {
  await delay(100)
  return members.filter(m => m.offerId === offerId)
}

// Get census summary by offer ID
export async function getCensusSummaryByOfferId(offerId: string): Promise<CensusSummary[]> {
  await delay(100)

  const offerMembers = members.filter(m => m.offerId === offerId)

  // Group by company
  const summaryMap = new Map<string, CensusSummary>()

  offerMembers.forEach(member => {
    if (!summaryMap.has(member.companyId)) {
      summaryMap.set(member.companyId, {
        companyId: member.companyId,
        companyName: member.companyName,
        totalCount: 0,
        employeeCount: 0,
        spouseCount: 0,
        childCount: 0,
        parentCount: 0,
      })
    }

    const summary = summaryMap.get(member.companyId)!
    summary.totalCount++

    switch (member.relationship) {
      case 'Employee':
        summary.employeeCount++
        break
      case 'Spouse':
        summary.spouseCount++
        break
      case 'Child':
        summary.childCount++
        break
      case 'Parent':
        summary.parentCount++
        break
    }
  })

  return Array.from(summaryMap.values())
}

// Delete a member
export async function deleteMember(id: string): Promise<void> {
  await delay(100)
  const index = members.findIndex(m => m.id === id)
  if (index !== -1) {
    members.splice(index, 1)
    saveToStorage()
    console.log('✅ Member deleted:', id)
  }
}








