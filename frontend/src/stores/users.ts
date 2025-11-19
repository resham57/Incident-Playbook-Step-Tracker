import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import api from '@/services/api'

export const useUsersStore = defineStore('users', () => {
  // State
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const userCount = computed(() => users.value.length)

  const activeUsers = computed(() =>
    users.value.filter(u => u.is_active)
  )

  const usersByRole = computed(() => ({
    incident_commander: users.value.filter(u => u.role === 'incident_commander').length,
    analyst: users.value.filter(u => u.role === 'analyst').length,
    technical_lead: users.value.filter(u => u.role === 'technical_lead').length
  }))

  // Actions
  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      const response = await api.getUsers()
      if (response.success && response.data) {
        users.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch users'
      console.error('Error fetching users:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.getUser(id)
      if (response.success && response.data) {
        currentUser.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch user'
      console.error('Error fetching user:', err)
    } finally {
      loading.value = false
    }
  }

  async function createUser(user: Partial<User>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.createUser(user)
      if (response.success) {
        await fetchUsers()
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create user'
      console.error('Error creating user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id: string, user: Partial<User>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.updateUser(id, user)
      if (response.success) {
        await fetchUsers()
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update user'
      console.error('Error updating user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.deleteUser(id)
      if (response.success) {
        await fetchUsers()
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete user'
      console.error('Error deleting user:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    currentUser,
    loading,
    error,
    userCount,
    activeUsers,
    usersByRole,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser
  }
})
