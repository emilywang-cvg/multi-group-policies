import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/proposals',
    },
    // Policies routes commented out temporarily - uncomment if needed
    // {
    //   path: '/policies',
    //   name: 'Policies',
    //   component: () => import('@/pages/PoliciesPage.vue'),
    // },
    // {
    //   path: '/policies/master/new',
    //   name: 'NewMasterPolicy',
    //   component: () => import('@/pages/NewMasterPolicyPage.vue'),
    // },
    // {
    //   path: '/policies/master/:id',
    //   name: 'MasterPolicyDetail',
    //   component: () => import('@/pages/MasterPolicyDetailPage.vue'),
    // },
    {
      path: '/proposals/:proposalId/add-members',
      name: 'proposal-add-members',
      component: () => import('@/pages/proposals/AddMembersPage.vue'),
    },
    {
      path: '/proposals/select-product',
      name: 'proposal-select-product',
      component: () => import('@/pages/proposals/SelectProductPage.vue'),
    },
    {
      path: '/proposals/preview/:clientId',
      name: 'proposal-preview',
      component: () => import('@/pages/proposals/PreviewSelectedClientPage.vue'),
    },
    {
      path: '/proposals/new',
      name: 'proposal-new',
      component: () => import('@/pages/proposals/NewProposalClientStep.vue'),
    },
    {
      path: '/proposals/:proposalId',
      name: 'proposal-detail',
      component: () => import('@/pages/proposals/ProposalDetailPage.vue'),
    },
    {
      path: '/proposals',
      name: 'proposals-list',
      component: () => import('@/pages/proposals/ProposalListPage.vue'),
    },
    {
      path: '/clients/new',
      name: 'client-new',
      component: () => import('@/pages/clients/CreateNewClientPage.vue'),
    },
    {
      path: '/demo/doc-tree',
      name: 'doc-tree-demo',
      component: () => import('@/features/document-upload/TreeViewDemo.vue'),
    },
    {
      path: '/demo/doc-grid',
      name: 'doc-grid-demo',
      component: () => import('@/features/document-upload/GridViewDemo.vue'),
    },
    {
      path: '/demo/doc-type',
      name: 'doc-type-demo',
      component: () => import('@/features/document-upload/DocTypeViewDemo.vue'),
    },
    {
      path: '/demo/billing-tree',
      name: 'billing-tree-demo',
      component: () => import('@/features/demo/views/BillingTreeDemo.vue'),
    },
    {
      path: '/demo/issuance',
      name: 'issuance-demo',
      component: () => import('@/features/demo/views/IssuanceDemo.vue'),
    },
  ],
})

export default router

