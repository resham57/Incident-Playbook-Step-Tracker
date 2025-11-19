<template>
  <div class="playbooks-page">
    <div class="page-header">
      <h1 class="page-title">Incident Response Playbooks</h1>
      <button @click="showCreateForm = true" class="btn btn-primary">+ New Playbook</button>
    </div>

    <!-- Create Playbook Form -->
    <div v-if="showCreateForm" class="modal-overlay" @click.self="showCreateForm = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Create New Playbook</h2>
          <button @click="showCreateForm = false" class="btn-close">×</button>
        </div>
        <form @submit.prevent="handleCreatePlaybook" class="playbook-form">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="newPlaybook.name" type="text" required placeholder="Playbook name" />
          </div>

          <div class="form-group">
            <label>Description *</label>
            <textarea v-model="newPlaybook.description" rows="4" required placeholder="Describe this playbook..."></textarea>
          </div>

          <div class="form-group">
            <label>Incident Types</label>
            <div class="tag-input-wrapper">
              <div class="tag-input">
                <input
                  v-model="newIncidentType"
                  @keydown.enter.prevent="addIncidentType"
                  type="text"
                  placeholder="Type incident type and press Enter (e.g., malware, phishing)"
                />
                <button type="button" @click="addIncidentType" class="btn btn-sm btn-secondary">Add</button>
              </div>
              <div v-if="newPlaybook.incident_types.length > 0" class="tags-list">
                <span v-for="type in newPlaybook.incident_types" :key="type" class="tag tag-removable">
                  {{ type }}
                  <button type="button" @click="removeIncidentType(type)" class="tag-remove">×</button>
                </span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Severity Levels</label>
            <div class="severity-checkboxes">
              <label
                v-for="severity in availableSeverities"
                :key="severity"
                class="severity-checkbox"
              >
                <input
                  type="checkbox"
                  :checked="newPlaybook.severity_levels.includes(severity)"
                  @change="toggleSeverity(severity)"
                />
                <span :class="['severity-label', 'severity-' + getSeverityClass(severity)]">
                  {{ severity }}
                </span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Estimated Duration</label>
            <input v-model="newPlaybook.estimated_duration" type="text" placeholder="e.g., 2-4 hours" />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="newPlaybook.is_active" type="checkbox" />
              <span>Active Playbook</span>
            </label>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-actions">
            <button type="button" @click="showCreateForm = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="loading" class="btn btn-primary">
              {{ loading ? 'Creating...' : 'Create Playbook' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Playbooks Grid -->
    <div v-if="playbooksStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Loading playbooks...</p>
    </div>

    <div v-else-if="playbooksStore.playbooks.length === 0" class="empty-state">
      <p>No playbooks found</p>
    </div>

    <div v-else class="playbooks-grid">
      <div v-for="playbook in playbooksStore.playbooks" :key="playbook.uid" class="playbook-card">
        <div class="playbook-header">
          <div class="playbook-icon">📚</div>
          <div class="playbook-status">
            <span v-if="playbook.is_active" class="status-badge active">Active</span>
            <span v-else class="status-badge inactive">Inactive</span>
          </div>
        </div>

        <div class="playbook-content">
          <h3 class="playbook-title">{{ playbook.name }}</h3>
          <p class="playbook-description">{{ playbook.description }}</p>

          <div class="playbook-meta">
            <div v-if="playbook.incident_types && playbook.incident_types.length > 0" class="meta-group">
              <span class="meta-label">Incident Types:</span>
              <div class="tags">
                <span v-for="(type, index) in playbook.incident_types" :key="index" class="tag">
                  {{ type }}
                </span>
              </div>
            </div>

            <div v-if="playbook.severity_levels && playbook.severity_levels.length > 0" class="meta-group">
              <span class="meta-label">Severity Levels:</span>
              <div class="tags">
                <span
                  v-for="(level, index) in playbook.severity_levels"
                  :key="index"
                  :class="['tag', 'tag-' + getSeverityClass(level)]"
                >
                  {{ level }}
                </span>
              </div>
            </div>

            <div v-if="playbook.estimated_duration" class="meta-group">
              <span class="meta-label">Duration:</span>
              <span class="meta-value">{{ playbook.estimated_duration }}</span>
            </div>

            <div v-if="playbook.steps && playbook.steps.length > 0" class="meta-group">
              <span class="meta-label">Steps:</span>
              <span class="meta-value">{{ playbook.steps.length }} steps</span>
            </div>
          </div>

          <!-- Steps Preview -->
          <div v-if="playbook.steps && playbook.steps.length > 0" class="steps-preview">
            <h4>Steps</h4>
            <div class="steps-list">
              <div v-for="step in playbook.steps.slice(0, 3)" :key="step.uid" class="step-item">
                <div class="step-number">{{ step.step_number }}</div>
                <div class="step-content">
                  <div class="step-title">{{ step.title }}</div>
                  <div v-if="step.estimated_time" class="step-time">⏱ {{ step.estimated_time }}</div>
                </div>
              </div>
              <div v-if="playbook.steps.length > 3" class="step-more">
                +{{ playbook.steps.length - 3 }} more steps
              </div>
            </div>
          </div>

          <div class="playbook-footer">
            <div class="playbook-dates">
              <small>Created: {{ formatDate(playbook.created_at) }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePlaybooksStore } from '@/stores/playbooks'

const playbooksStore = usePlaybooksStore()

const showCreateForm = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const newPlaybook = ref({
  name: '',
  description: '',
  incident_types: [] as string[],
  severity_levels: [] as string[],
  estimated_duration: '',
  is_active: true
})

const newIncidentType = ref('')
const availableSeverities = ['High', 'Medium', 'Low']

onMounted(async () => {
  await playbooksStore.fetchPlaybooks()
})

async function handleCreatePlaybook() {
  loading.value = true
  error.value = null

  try {
    await playbooksStore.createPlaybook(newPlaybook.value)
    showCreateForm.value = false
    newPlaybook.value = {
      name: '',
      description: '',
      incident_types: [],
      severity_levels: [],
      estimated_duration: '',
      is_active: true
    }
    newIncidentType.value = ''
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create playbook'
  } finally {
    loading.value = false
  }
}

function getSeverityClass(severity: string): string {
  const severityMap: Record<string, string> = {
    High: 'danger',
    Medium: 'warning',
    Low: 'info'
  }
  return severityMap[severity] || 'secondary'
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

function addIncidentType() {
  const type = newIncidentType.value.trim()
  if (type && !newPlaybook.value.incident_types.includes(type)) {
    newPlaybook.value.incident_types.push(type)
    newIncidentType.value = ''
  }
}

function removeIncidentType(type: string) {
  newPlaybook.value.incident_types = newPlaybook.value.incident_types.filter(t => t !== type)
}

function toggleSeverity(severity: string) {
  const index = newPlaybook.value.severity_levels.indexOf(severity)
  if (index > -1) {
    newPlaybook.value.severity_levels.splice(index, 1)
  } else {
    newPlaybook.value.severity_levels.push(severity)
  }
}
</script>
