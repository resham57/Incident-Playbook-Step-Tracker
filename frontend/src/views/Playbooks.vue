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
            <label>Estimated Duration</label>
            <input v-model="newPlaybook.estimated_duration" type="text" placeholder="e.g., 2-4 hours" />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="newPlaybook.is_active" type="checkbox" />
              <span>Active Playbook</span>
            </label>
          </div>

          <div class="form-group">
            <label>Flow Diagram (Image)</label>
            <input
              type="file"
              @change="handleNewDiagramChange"
              accept="image/*"
            />
            <small>Upload a flow diagram image for this playbook (PNG, JPG, etc.)</small>
            <div v-if="newDiagramFile" class="file-preview">
              Selected: {{ newDiagramFile.name }}
            </div>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-actions">
            <button type="button" @click="showCreateForm = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="loading || uploadingDiagram" class="btn btn-primary">
              {{ loading || uploadingDiagram ? 'Creating...' : 'Create Playbook' }}
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

          <!-- Flow Diagram Preview -->
          <div v-if="playbook.flow_diagram_url" class="diagram-preview">
            <h4>Flow Diagram</h4>
            <img
              :src="getDiagramUrl(playbook.flow_diagram_url)"
              alt="Flow diagram"
              class="diagram-thumbnail"
              @error="handleImageError"
              @load="handleImageLoad"
            />
          </div>

          <div class="playbook-footer">
            <div class="playbook-dates">
              <small>Created: {{ formatDate(playbook.created_at) }}</small>
            </div>
            <button @click="openEditForm(playbook)" class="btn btn-sm btn-secondary">✏️ Edit</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Playbook Form -->
    <div v-if="showEditForm && editPlaybook" class="modal-overlay" @click.self="closeEditForm">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Edit Playbook</h2>
          <button @click="closeEditForm" class="btn-close">×</button>
        </div>
        <form @submit.prevent="handleUpdatePlaybook" class="playbook-form">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="editPlaybook.name" type="text" required placeholder="Playbook name" />
          </div>

          <div class="form-group">
            <label>Description *</label>
            <textarea v-model="editPlaybook.description" rows="4" required placeholder="Describe this playbook..."></textarea>
          </div>

          <div class="form-group">
            <label>Estimated Duration</label>
            <input v-model="editPlaybook.estimated_duration" type="text" placeholder="e.g., 2-4 hours" />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="editPlaybook.is_active" type="checkbox" />
              <span>Active Playbook</span>
            </label>
          </div>

          <div class="form-group">
            <label>Flow Diagram (Image)</label>
            <div v-if="editPlaybook.flow_diagram_url" class="current-diagram">
              <img :src="getDiagramUrl(editPlaybook.flow_diagram_url)" alt="Current flow diagram" style="max-width: 200px; margin-bottom: 10px;" />
              <button type="button" @click="deleteDiagram(editPlaybook.uid!)" class="btn btn-sm btn-danger">Delete Current Diagram</button>
            </div>
            <input
              type="file"
              @change="handleEditDiagramChange"
              accept="image/*"
            />
            <small>Upload a new flow diagram image (will replace existing if any)</small>
            <div v-if="editDiagramFile" class="file-preview">
              Selected: {{ editDiagramFile.name }}
            </div>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-actions">
            <button type="button" @click="closeEditForm" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="loading || uploadingDiagram" class="btn btn-primary">
              {{ loading || uploadingDiagram ? 'Updating...' : 'Update Playbook' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePlaybooksStore } from '@/stores/playbooks'
import type { PlaybookTemplate } from '@/types'
import api from '@/services/api'

const playbooksStore = usePlaybooksStore()

const showCreateForm = ref(false)
const showEditForm = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const newPlaybook = ref({
  name: '',
  description: '',
  estimated_duration: '',
  is_active: true
})

const editPlaybook = ref<PlaybookTemplate | null>(null)

const newDiagramFile = ref<File | null>(null)
const editDiagramFile = ref<File | null>(null)
const uploadingDiagram = ref(false)

onMounted(async () => {
  await playbooksStore.fetchPlaybooks()
})

async function handleCreatePlaybook() {
  loading.value = true
  error.value = null

  try {
    const result = await playbooksStore.createPlaybook(newPlaybook.value)

    // If a diagram file was selected, upload it
    if (newDiagramFile.value && result?.uid) {
      uploadingDiagram.value = true
      try {
        await api.uploadPlaybookDiagram(result.uid, newDiagramFile.value)
        await playbooksStore.fetchPlaybooks() // Refresh to get updated diagram URL
      } catch (uploadErr) {
        console.error('Failed to upload diagram:', uploadErr)
        error.value = 'Playbook created but diagram upload failed'
      } finally {
        uploadingDiagram.value = false
      }
    }

    showCreateForm.value = false
    newPlaybook.value = {
      name: '',
      description: '',
      estimated_duration: '',
      is_active: true
    }
    newDiagramFile.value = null
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create playbook'
  } finally {
    loading.value = false
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

function openEditForm(playbook: PlaybookTemplate) {
  editPlaybook.value = {
    uid: playbook.uid,
    name: playbook.name,
    description: playbook.description,
    estimated_duration: playbook.estimated_duration || '',
    is_active: playbook.is_active !== undefined ? playbook.is_active : true
  }
  showEditForm.value = true
  error.value = null
}

function closeEditForm() {
  showEditForm.value = false
  editPlaybook.value = null
  editDiagramFile.value = null
  error.value = null
}

async function handleUpdatePlaybook() {
  if (!editPlaybook.value || !editPlaybook.value.uid) return

  loading.value = true
  error.value = null

  try {
    await playbooksStore.updatePlaybook(editPlaybook.value.uid, {
      name: editPlaybook.value.name,
      description: editPlaybook.value.description,
      estimated_duration: editPlaybook.value.estimated_duration,
      is_active: editPlaybook.value.is_active
    })

    // If a new diagram file was selected, upload it
    if (editDiagramFile.value && editPlaybook.value.uid) {
      uploadingDiagram.value = true
      try {
        await api.uploadPlaybookDiagram(editPlaybook.value.uid, editDiagramFile.value)
        await playbooksStore.fetchPlaybooks() // Refresh to get updated diagram URL
      } catch (uploadErr) {
        console.error('Failed to upload diagram:', uploadErr)
        error.value = 'Playbook updated but diagram upload failed'
      } finally {
        uploadingDiagram.value = false
      }
    }

    closeEditForm()
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update playbook'
  } finally {
    loading.value = false
  }
}

function handleNewDiagramChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    newDiagramFile.value = target.files[0]
  }
}

function handleEditDiagramChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    editDiagramFile.value = target.files[0]
  }
}

async function deleteDiagram(playbookId: string) {
  if (!confirm('Are you sure you want to delete this flow diagram?')) return

  try {
    await api.deletePlaybookDiagram(playbookId)
    await playbooksStore.fetchPlaybooks()
  } catch (err) {
    console.error('Failed to delete diagram:', err)
    alert('Failed to delete diagram')
  }
}

function getDiagramUrl(url?: string): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`
  console.log('Diagram URL:', fullUrl)
  return fullUrl
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  console.error('Failed to load image:', img.src)
}

function handleImageLoad(event: Event) {
  const img = event.target as HTMLImageElement
  console.log('Image loaded successfully:', img.src)
}
</script>
