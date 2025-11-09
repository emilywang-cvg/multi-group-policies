import type { Plan } from './types'

// Mock plans with benefits
const plans: Plan[] = [
  {
    id: 'plan-basic',
    name: 'Basic Plan',
    benefits: [
      { id: 'network', name: 'Network', type: 'dropdown', options: ['MG 19', 'MG 20', 'Network A', 'Network B'] },
      { id: 'room-type', name: 'Room Type', type: 'dropdown', options: ['Private', 'Semi-Private', 'Ward'] },
      { id: 'co-insurance', name: 'Co-Insurance', type: 'percentage', defaultValue: '20' },
      { id: 'max-co-insurance', name: 'Max of Co-Insurance', type: 'number', defaultValue: '75' },
    ],
  },
  {
    id: 'plan-standard',
    name: 'Standard Plan',
    benefits: [
      { id: 'network', name: 'Network', type: 'dropdown', options: ['MG 19', 'MG 20', 'Network A', 'Network B'] },
      { id: 'room-type', name: 'Room Type', type: 'dropdown', options: ['Private', 'Semi-Private', 'Ward'] },
      { id: 'co-insurance', name: 'Co-Insurance', type: 'percentage', defaultValue: '20' },
      { id: 'max-co-insurance', name: 'Max of Co-Insurance', type: 'number', defaultValue: '75' },
      { id: 'maternity', name: 'Maternity', type: 'number', defaultValue: '15000' },
      { id: 'dental-essential', name: 'Dental (Essential and preventive dentistry)', type: 'number', defaultValue: '12000' },
    ],
  },
  {
    id: 'plan-premium',
    name: 'Premium Plan',
    benefits: [
      { id: 'network', name: 'Network', type: 'dropdown', options: ['MG 19', 'MG 20', 'Network A', 'Network B'] },
      { id: 'room-type', name: 'Room Type', type: 'dropdown', options: ['Private', 'Semi-Private', 'Ward'] },
      { id: 'co-insurance', name: 'Co-Insurance', type: 'percentage', defaultValue: '20' },
      { id: 'max-co-insurance', name: 'Max of Co-Insurance', type: 'number', defaultValue: '75' },
      { id: 'maternity', name: 'Maternity', type: 'number', defaultValue: '15000' },
      { id: 'dental-essential', name: 'Dental (Essential and preventive dentistry)', type: 'number', defaultValue: '12000' },
      { id: 'dental-treatment', name: 'Dental (Treatment of Root Cannals and Emergencies)', type: 'number', defaultValue: '800' },
      { id: 'optical', name: 'Optical', type: 'number', defaultValue: '400' },
    ],
  },
  {
    id: 'plan-vip',
    name: 'VIP Plan',
    benefits: [
      { id: 'network', name: 'Network', type: 'dropdown', options: ['MG 19', 'MG 20', 'Network A', 'Network B'] },
      { id: 'room-type', name: 'Room Type', type: 'dropdown', options: ['Private', 'Semi-Private', 'Ward'] },
      { id: 'co-insurance', name: 'Co-Insurance', type: 'percentage', defaultValue: '20' },
      { id: 'max-co-insurance', name: 'Max of Co-Insurance', type: 'number', defaultValue: '75' },
      { id: 'maternity', name: 'Maternity', type: 'number', defaultValue: '15000' },
      { id: 'dental-essential', name: 'Dental (Essential and preventive dentistry)', type: 'number', defaultValue: '12000' },
      { id: 'dental-treatment', name: 'Dental (Treatment of Root Cannals and Emergencies)', type: 'number', defaultValue: '800' },
      { id: 'optical', name: 'Optical', type: 'number', defaultValue: '400' },
    ],
  },
]

// Helper: simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Get all plans
export async function listPlans(): Promise<Plan[]> {
  await delay(100)
  return plans
}

// Get plan by ID
export async function getPlanById(id: string): Promise<Plan | null> {
  await delay(100)
  return plans.find(p => p.id === id) || null
}

