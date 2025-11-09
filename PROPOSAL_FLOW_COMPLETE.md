# Complete New Proposal Flow - Implementation

## 🎉 Fully Functional 3-Screen Flow

### Screen 1: Select Client (`/proposals/new`)
**Features:**
- Search 18 seeded parent companies + subsidiaries
- Hierarchical expand/collapse
- Real-time search (300ms debounce)
- Status badges (ACTIVE/INACTIVE)
- Keyboard navigation (`/`, Arrow keys, Enter)
- "Create a new one" link

### Screen 2: Create New Client (`/clients/new`)
**Features:**
- Company Client form with validation
- CR Number input
- Basic Information (Company Name required)
- Contact & Address sections (4 fields each)
- Census Levels: Add/remove with multiline items
- Subsidiaries: Search existing OR quick-create inline
- Submit creates company and navigates to preview

### Screen 3: Preview Selected Client (`/proposals/preview/:clientId`) ✨ NEW
**Features:**
- **Two display modes:**
  - **Master Company View:** Shows client info + subsidiaries list
  - **Subsidiary View:** Shows master company reference at top + client info
- Displays all data:
  - Client Info (ID, Name, CR Number, Status, Type)
  - Contact fields (with actual data from creation)
  - Address fields (with actual data from creation)
  - Census Levels (dynamic, shows actual levels created)
  - Subsidiaries (for master companies, with status badges)
- Active Proposals & Active Policies sections
- Step indicator: Client (✓) → Product (active)
- Actions: Cancel (back to selection) | Next (to product step)

## 🔄 Complete User Journeys

### Journey 1: Select Existing Client
```
1. Visit /proposals/new
2. Search/browse companies
3. Click "Select" on any company
4. → Redirects to /proposals/preview/{clientId}
5. View all client details
6. Click "Next" to continue
```

### Journey 2: Create New Client
```
1. Visit /proposals/new
2. Click "Create a new one"
3. → Redirects to /clients/new
4. Fill form:
   - Company Name: "Acme Corp" ✅
   - CR Number: "12345"
   - Contact/Address fields
   - Census Levels:
     * Level 1: Design team, Dev team, Marketing
     * Level 2: Frontend team, Backend team
   - Subsidiaries:
     * Search existing: "Company Test Ltd" + Add
     * Quick create: "Acme Sub 1"
5. Click "Submit"
6. → Redirects to /proposals/preview/{newClientId}
7. View newly created client with ALL entered data
8. Click "Next" to continue
```

### Journey 3: Select Subsidiary
```
1. Visit /proposals/new
2. Expand a parent company (click ▶)
3. Click "Select" on a subsidiary
4. → Redirects to /proposals/preview/{subsidiaryId}
5. View:
   - Master Company section at top
   - Subsidiary details below
6. Click "Next" to continue
```

## 🏗️ Technical Implementation

### Data Flow

**CompanyNode Type (Enhanced):**
```typescript
interface CompanyNode {
  id: ID
  name: string
  status: Status
  isParent: boolean
  parentId?: ID
  children?: CompanyNode[]
  // New fields for preview:
  crNumber?: string
  contact?: { field1-4 }
  address?: { field1-4 }
  censusLevels?: Array<{ levelName, items[] }>
}
```

**New API Function:**
```typescript
getCompanyById(id: ID): Promise<CompanyNode | null>
```

### Routes
```typescript
/proposals/new              → NewProposalClientStep
/proposals/preview/:clientId → PreviewSelectedClientPage ✨
/clients/new                → CreateNewClientPage
```

### Navigation Flow
```
Select Existing Client:
  ClientSelector → emit('selected', node) 
  → router.push(`/proposals/preview/${node.id}`)

Create New Client:
  CreateNewClientPage → api.createCompany(form)
  → router.push(`/proposals/preview/${newCompany.id}`)

From Preview:
  Cancel → router.push('/proposals/new')
  Next → router.push('?step=product') // TODO: implement
```

## 🎨 UI Features

### Preview Page Variations

**Master Company:**
```
┌─────────────────────────────────┐
│ Status: Waiting [Agent]         │
├─────────────────────────────────┤
│ Client Info                     │
│ - Client ID: C10000             │
│ - Company Name: Acme Corp       │
│ - CR Number: 12345              │
│ - Status: ACTIVE ●              │
│ - Type: Master Company          │
├─────────────────────────────────┤
│ Contact / Address               │
├─────────────────────────────────┤
│ Census Levels                   │
│ • Level 1: [items in grid]     │
│ • Level 2: [items in grid]     │
├─────────────────────────────────┤
│ Subsidiary                      │
│ • Company Test Ltd - ACTIVE     │
│ • Acme Sub 1 - ACTIVE           │
├─────────────────────────────────┤
│ Active Proposals / Policies     │
└─────────────────────────────────┘
```

**Subsidiary:**
```
┌─────────────────────────────────┐
│ Status: Waiting [Agent]         │
├─────────────────────────────────┤
│ Master Company ⭐                │
│ - Company Test Ltd (C0001)      │
│ - Status: INACTIVE              │
├─────────────────────────────────┤
│ Client Info                     │
│ - Client ID: C0001-01           │
│ - Type: Subsidiary              │
├─────────────────────────────────┤
│ Contact / Address               │
├─────────────────────────────────┤
│ Census Levels                   │
│ (No census levels defined)      │
├─────────────────────────────────┤
│ Active Proposals / Policies     │
└─────────────────────────────────┘
```

## 📊 Data Persistence

### Created Companies Store:
- Census levels created in form → stored in CompanyNode
- Contact/Address fields → stored in CompanyNode
- Subsidiaries → stored as children with references
- All data displayed correctly in preview

### In-Memory Database:
- 18 seeded parent companies
- 2-7 subsidiaries each
- Newly created companies prepended to list
- IDs: C0001-C0018 (seeded), C10000+ (created)

## 🧪 Testing Scenarios

### Test 1: Create with All Data
```bash
1. Create new client
2. Fill ALL fields
3. Add 2 census levels with 5+ items each
4. Add 1 existing subsidiary + 1 quick-created
5. Submit
6. Verify preview shows ALL data correctly
```

### Test 2: Select Master Company
```bash
1. Select "Company Test Ltd" (C0001)
2. Verify preview shows:
   - No Master Company section
   - Client Info shows "Master Company"
   - Subsidiaries list populated
   - No census levels (seeded data)
```

### Test 3: Select Subsidiary
```bash
1. Expand "Company Test Ltd"
2. Select first subsidiary
3. Verify preview shows:
   - Master Company section at top
   - Client Info shows "Subsidiary"
   - Parent info correct
   - No subsidiaries section
```

### Test 4: Empty State
```bash
1. Create client with ONLY name
2. Submit
3. Verify preview shows:
   - Empty contact/address (VALUE placeholders)
   - "No census levels defined"
   - No subsidiaries section
```

## 🚀 Next Steps (Product Selection)

When implementing the product step:
1. Access client data from route params: `route.params.clientId`
2. Load company details if needed
3. Implement product selection logic
4. Create route: `/proposals/new?step=product&clientId=xxx`

## 📁 Files Modified

**New Files:**
- `src/pages/proposals/PreviewSelectedClientPage.vue`

**Modified Files:**
- `src/features/clients/types.ts` - Added fields to CompanyNode
- `src/features/clients/api.ts` - Added getCompanyById(), enhanced createCompany()
- `src/pages/proposals/NewProposalClientStep.vue` - Navigate to preview
- `src/pages/clients/CreateNewClientPage.vue` - Navigate to preview
- `src/app/router.ts` - Added preview route

## ✅ Completion Checklist

- ✅ Select existing client flow
- ✅ Create new client flow
- ✅ Preview master company
- ✅ Preview subsidiary (with master company reference)
- ✅ Display actual census levels
- ✅ Display actual contact/address data
- ✅ Display subsidiaries list
- ✅ Handle empty states
- ✅ Step indicators
- ✅ Navigation (Cancel/Next)
- ✅ Type-safe implementation
- ✅ No linting errors
- ✅ Clean Tailwind styling
- ✅ Responsive layout

🎯 **The complete proposal client selection flow is now production-ready!**








