<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterView } from 'vue-router'

const router = useRouter()
const sidebarOpen = ref(false)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const navigateTo = (path: string) => {
  router.push(path)
  sidebarOpen.value = false
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <!-- Header -->
    <header
      class="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30 h-16 flex items-center"
    >
      <div class="flex-1 flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <div class="flex items-center space-x-3">
          <button
            @click="toggleSidebar"
            class="text-gray-600 hover:text-gray-900 focus:outline-none lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div class="flex items-center space-x-2">
            <div class="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
              <span class="text-white text-xs font-bold">CG</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900">Multi Group Policies</h1>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <button class="p-2 text-gray-600 hover:text-gray-900 focus:outline-none">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span class="text-white text-sm font-medium">U</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main layout container -->
    <div class="flex flex-1 pt-16 overflow-hidden">
      <!-- Sidebar -->
      <aside
        class="w-64 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-300 ease-in-out z-20 lg:translate-x-0"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <nav class="px-4 py-6 space-y-2">
          <button
            @click="navigateTo('/policies')"
            class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            <div class="flex items-center space-x-3">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>All Policies</span>
            </div>
          </button>
          <button
            @click="navigateTo('/proposals')"
            class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            <div class="flex items-center space-x-3">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Proposals</span>
            </div>
          </button>
          <button
            @click="navigateTo('/proposals/new')"
            class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            <div class="flex items-center space-x-3">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Proposal</span>
            </div>
          </button>
          <button
            @click="navigateTo('/policies/master/new')"
            class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition-colors"
          >
            <div class="flex items-center space-x-3">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Master Policy</span>
            </div>
          </button>

          <div class="pt-6 border-t border-gray-200 mt-6">
            <p
              class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              Document Upload Demos
            </p>
            <div class="mt-2 space-y-1">
              <button
                @click="navigateTo('/demo/doc-tree')"
                class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-sm transition-colors"
              >
                Tree View Demo
              </button>
              <button
                @click="navigateTo('/demo/doc-grid')"
                class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-sm transition-colors"
              >
                Grid View Demo
              </button>
              <button
                @click="navigateTo('/demo/doc-type')"
                class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-sm transition-colors"
              >
                Doc Type View Demo
              </button>
            </div>
          </div>

          <div class="pt-6 border-t border-gray-200 mt-6">
            <p
              class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider"
            >
              Premium & Payment Demos
            </p>
            <div class="mt-2 space-y-1">
              <button
                @click="navigateTo('/demo/billing-tree')"
                class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-sm transition-colors"
              >
                Premium & Payment Demo
              </button>
              <button
                @click="navigateTo('/demo/issuance')"
                class="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 text-sm transition-colors"
              >
                Issuance Demo
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Main content area -->
      <main class="flex-1 overflow-auto bg-gray-50 p-6">
        <div class="max-w-full mx-auto">
          <RouterView />
        </div>
      </main>
    </div>

    <!-- Mobile overlay -->
    <transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        @click="toggleSidebar"
        class="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
      />
    </transition>
  </div>
</template>
