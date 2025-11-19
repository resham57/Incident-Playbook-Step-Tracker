import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlaybookTemplate } from '@/types'
import api from '@/services/api'

export const usePlaybooksStore = defineStore('playbooks', () => {
  // State
  const playbooks = ref<PlaybookTemplate[]>([])
  const currentPlaybook = ref<PlaybookTemplate | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const playbookCount = computed(() => playbooks.value.length)

  const activePlaybooks = computed(() =>
    playbooks.value.filter(p => p.is_active)
  )

  // Actions
  async function fetchPlaybooks() {
    loading.value = true
    error.value = null
    try {
      const response = await api.getPlaybooks()
      if (response.success && response.data) {
        playbooks.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch playbooks'
      console.error('Error fetching playbooks:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchPlaybook(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.getPlaybook(id)
      if (response.success && response.data) {
        currentPlaybook.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch playbook'
      console.error('Error fetching playbook:', err)
    } finally {
      loading.value = false
    }
  }

  async function createPlaybook(playbook: Partial<PlaybookTemplate>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.createPlaybook(playbook)
      if (response.success) {
        await fetchPlaybooks()
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create playbook'
      console.error('Error creating playbook:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePlaybook(id: string, playbook: Partial<PlaybookTemplate>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.updatePlaybook(id, playbook)
      if (response.success) {
        await fetchPlaybooks()
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update playbook'
      console.error('Error updating playbook:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deletePlaybook(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.deletePlaybook(id)
      if (response.success) {
        await fetchPlaybooks()
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete playbook'
      console.error('Error deleting playbook:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    playbooks,
    currentPlaybook,
    loading,
    error,
    playbookCount,
    activePlaybooks,
    fetchPlaybooks,
    fetchPlaybook,
    createPlaybook,
    updatePlaybook,
    deletePlaybook
  }
})
