<template>
  <div class="incidents-page">
    <div class="page-header">
      <h1 class="page-title">Incidents</h1>
      <button @click="showCreateForm = true" class="btn btn-primary">+ New Incident</button>
    </div>

    <!-- Create Incident Form -->
    <div v-if="showCreateForm" class="modal-overlay" @click.self="showCreateForm = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Create New Incident</h2>
          <button @click="showCreateForm = false" class="btn-close">×</button>
        </div>
        <form @submit.prevent="handleCreateIncident" class="incident-form">
          <div class="form-group">
            <label>Title *</label>
            <input v-model="newIncident.title" type="text" required placeholder="Brief description of the incident" />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="newIncident.description" rows="4" placeholder="Detailed description..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Severity *</label>
              <select v-model="newIncident.severity" required>
                <option value="">Select severity</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div class="form-group">
              <label>TLP Classification *</label>
              <select v-model="newIncident.tlp" required>
                <option value="">Select TLP</option>
                <option value="Red">Red (No sharing)</option>
                <option value="Amber">Amber (Limited sharing)</option>
                <option value="Green">Green (Community)</option>
                <option value="White">White (Unlimited)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Status *</label>
              <select v-model="newIncident.status" required>
                <option value="Open">Open</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div class="form-group">
              <label>Assign To</label>
              <select v-model="newIncident.assigned_to">
                <option value="">Unassigned</option>
                <option v-for="user in usersStore.activeUsers" :key="user.uid" :value="user.uid">
                  {{ user.name }} ({{ user.role }})
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Playbook</label>
            <select v-model="newIncident.playbook">
              <option value="">No playbook</option>
              <option v-for="playbook in playbooksStore.playbooks" :key="playbook.uid" :value="playbook.uid">
                {{ playbook.name }}
              </option>
            </select>
            <small v-if="newIncident.playbook && playbooksStore.playbooks.find(p => p.uid === newIncident.playbook)" class="form-help">
              {{ playbooksStore.playbooks.find(p => p.uid === newIncident.playbook)?.description }}
            </small>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-actions">
            <button type="button" @click="showCreateForm = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="loading" class="btn btn-primary">
              {{ loading ? 'Creating...' : 'Create Incident' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input v-model="searchQuery" type="text" placeholder="Search incidents..." class="search-input" />

      <select v-model="filterSeverity" class="filter-select">
        <option value="">All Severities</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <select v-model="filterStatus" class="filter-select">
        <option value="">All Statuses</option>
        <option value="Open">Open</option>
        <option value="InProgress">In Progress</option>
        <option value="Resolved">Resolved</option>
        <option value="Closed">Closed</option>
      </select>
    </div>

    <!-- Incidents List -->
    <div v-if="incidentsStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Loading incidents...</p>
    </div>

    <div v-else-if="filteredIncidents.length === 0" class="empty-state">
      <p>No incidents found</p>
    </div>

    <div v-else class="incidents-grid">
      <div v-for="incident in filteredIncidents" :key="incident.uid" class="incident-card">
        <div class="incident-card-header">
          <h3>{{ incident.title }}</h3>
          <div class="badges">
            <span :class="['badge', 'badge-' + getSeverityClass(incident.severity)]">
              {{ incident.severity }}
            </span>
            <span :class="['badge', 'badge-' + getTlpClass(incident.tlp)]">
              {{ incident.tlp }}
            </span>
          </div>
        </div>

        <p class="incident-description">{{ incident.description || 'No description' }}</p>

        <div class="incident-meta">
          <div class="meta-item">
            <span class="meta-label">Status:</span>
            <span :class="['badge', 'badge-' + getStatusClass(incident.status)]">
              {{ incident.status }}
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Assigned:</span>
            <span>{{ incident.assigned_to?.name || 'Unassigned' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Artifacts:</span>
            <span>{{ incident.artifacts?.length || 0 }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Created:</span>
            <span>{{ formatDate(incident.created_at) }}</span>
          </div>
        </div>

        <div class="incident-actions">
          <router-link :to="`/incidents/${incident.uid}`" class="btn btn-primary">
            View Details
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useIncidentsStore } from '@/stores/incidents'
import { useUsersStore } from '@/stores/users'
import { usePlaybooksStore } from '@/stores/playbooks'
import type { Severity, TLP, IncidentStatus } from '@/types'

const incidentsStore = useIncidentsStore()
const usersStore = useUsersStore()
const playbooksStore = usePlaybooksStore()

const showCreateForm = ref(false)
const searchQuery = ref('')
const filterSeverity = ref('')
const filterStatus = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const newIncident = ref({
  title: '',
  description: '',
  severity: '' as Severity | '',
  tlp: '' as TLP | '',
  status: 'Open' as IncidentStatus,
  assigned_to: '',
  playbook: ''
})

onMounted(async () => {
  await Promise.all([
    incidentsStore.fetchIncidents(),
    usersStore.fetchUsers(),
    playbooksStore.fetchPlaybooks()
  ])
})

const filteredIncidents = computed(() => {
  let incidents = incidentsStore.incidents

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    incidents = incidents.filter(i =>
      i.title.toLowerCase().includes(query) ||
      i.description?.toLowerCase().includes(query)
    )
  }

  if (filterSeverity.value) {
    incidents = incidents.filter(i => i.severity === filterSeverity.value)
  }

  if (filterStatus.value) {
    incidents = incidents.filter(i => i.status === filterStatus.value)
  }

  return incidents
})

async function handleCreateIncident() {
  loading.value = true
  error.value = null

  try {
    await incidentsStore.createIncident(newIncident.value)
    showCreateForm.value = false
    newIncident.value = {
      title: '',
      description: '',
      severity: '',
      tlp: '',
      status: 'Open',
      assigned_to: '',
      playbook: ''
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create incident'
  } finally {
    loading.value = false
  }
}

function getSeverityClass(severity: Severity): string {
  const map: Record<Severity, string> = {
    High: 'danger',
    Medium: 'warning',
    Low: 'info'
  }
  return map[severity] || 'secondary'
}

function getTlpClass(tlp: TLP): string {
  const map: Record<TLP, string> = {
    Red: 'danger',
    Amber: 'warning',
    Green: 'success',
    White: 'info'
  }
  return map[tlp] || 'secondary'
}

function getStatusClass(status: IncidentStatus): string {
  const map: Record<IncidentStatus, string> = {
    Open: 'info',
    InProgress: 'warning',
    Resolved: 'success',
    Closed: 'secondary'
  }
  return map[status] || 'secondary'
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}
</script>
