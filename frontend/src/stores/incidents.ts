import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Incident } from '@/types'
import api from '@/services/api'

export const useIncidentsStore = defineStore('incidents', () => {
  // State
  const incidents = ref<Incident[]>([])
  const currentIncident = ref<Incident | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const incidentCount = computed(() => incidents.value.length)

  const incidentsBySeverity = computed(() => ({
    high: incidents.value.filter(i => i.severity === 'High').length,
    medium: incidents.value.filter(i => i.severity === 'Medium').length,
    low: incidents.value.filter(i => i.severity === 'Low').length
  }))

  const incidentsByStatus = computed(() => ({
    open: incidents.value.filter(i => i.status === 'Open').length,
    inProgress: incidents.value.filter(i => i.status === 'InProgress').length,
    resolved: incidents.value.filter(i => i.status === 'Resolved').length,
    closed: incidents.value.filter(i => i.status === 'Closed').length
  }))

  const recentIncidents = computed(() =>
    [...incidents.value]
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 5)
  )

  // Actions
  async function fetchIncidents() {
    loading.value = true
    error.value = null
    try {
      const response = await api.getIncidents()
      if (response.success && response.data) {
        incidents.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch incidents'
      console.error('Error fetching incidents:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchIncident(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.getIncident(id)
      if (response.success && response.data) {
        currentIncident.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch incident'
      console.error('Error fetching incident:', err)
    } finally {
      loading.value = false
    }
  }

  async function createIncident(incident: Partial<Incident>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.createIncident(incident)
      if (response.success) {
        await fetchIncidents()
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create incident'
      console.error('Error creating incident:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateIncident(id: string, incident: Partial<Incident>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.updateIncident(id, incident)
      if (response.success) {
        await fetchIncidents()
        if (currentIncident.value?.uid === id) {
          await fetchIncident(id)
        }
        return response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update incident'
      console.error('Error updating incident:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteIncident(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.deleteIncident(id)
      if (response.success) {
        await fetchIncidents()
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete incident'
      console.error('Error deleting incident:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    incidents,
    currentIncident,
    loading,
    error,
    incidentCount,
    incidentsBySeverity,
    incidentsByStatus,
    recentIncidents,
    fetchIncidents,
    fetchIncident,
    createIncident,
    updateIncident,
    deleteIncident
  }
})
