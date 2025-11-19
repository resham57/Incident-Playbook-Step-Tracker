<template>
  <div class="incident-detail">
    <div v-if="incidentsStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Loading incident details...</p>
    </div>

    <div v-else-if="!incident" class="error-state">
      <p>Incident not found</p>
      <router-link to="/incidents" class="btn btn-primary">Back to Incidents</router-link>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="detail-header">
        <div>
          <router-link to="/incidents" class="back-link">← Back to Incidents</router-link>
          <h1 class="page-title">{{ incident.title }}</h1>
        </div>
        <div class="header-actions">
          <button @click="showEditForm = true" class="btn btn-secondary">Edit</button>
          <button @click="handleDelete" class="btn btn-danger">Delete</button>
        </div>
      </div>

      <!-- Edit Form Modal -->
      <div v-if="showEditForm" class="modal-overlay" @click.self="showEditForm = false">
        <div class="modal">
          <div class="modal-header">
            <h2>Edit Incident</h2>
            <button @click="showEditForm = false" class="btn-close">×</button>
          </div>
          <form @submit.prevent="handleUpdate" class="incident-form">
            <div class="form-group">
              <label>Title</label>
              <input v-model="editForm.title" type="text" />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea v-model="editForm.description" rows="4"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Severity</label>
                <select v-model="editForm.severity">
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div class="form-group">
                <label>TLP</label>
                <select v-model="editForm.tlp">
                  <option value="Red">Red</option>
                  <option value="Amber">Amber</option>
                  <option value="Green">Green</option>
                  <option value="White">White</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select v-model="editForm.status">
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div class="form-group">
                <label>Assign To</label>
                <select v-model="editForm.assigned_to">
                  <option value="">Unassigned</option>
                  <option v-for="user in usersStore.activeUsers" :key="user.uid" :value="user.uid">
                    {{ user.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Playbook</label>
              <select v-model="editForm.playbook">
                <option value="">No playbook</option>
                <option v-for="playbook in playbooksStore.playbooks" :key="playbook.uid" :value="playbook.uid">
                  {{ playbook.name }}
                </option>
              </select>
              <small v-if="editForm.playbook && playbooksStore.playbooks.find(p => p.uid === editForm.playbook)" class="form-help">
                {{ playbooksStore.playbooks.find(p => p.uid === editForm.playbook)?.description }}
              </small>
            </div>

            <div class="form-actions">
              <button type="button" @click="showEditForm = false" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Update</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Main Content -->
      <div class="detail-grid">
        <!-- Left Column -->
        <div class="detail-main">
          <!-- Overview Card -->
          <div class="card">
            <h2>Overview</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Severity:</span>
                <span :class="['badge', 'badge-' + getSeverityClass(incident.severity)]">
                  {{ incident.severity }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">TLP:</span>
                <span :class="['badge', 'badge-' + getTlpClass(incident.tlp)]">
                  {{ incident.tlp }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span :class="['badge', 'badge-' + getStatusClass(incident.status)]">
                  {{ incident.status }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Created:</span>
                <span>{{ formatDate(incident.created_at) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Updated:</span>
                <span>{{ formatDate(incident.updated_at) }}</span>
              </div>
              <div v-if="incident.closed_at" class="info-item">
                <span class="info-label">Closed:</span>
                <span>{{ formatDate(incident.closed_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="card">
            <h2>Description</h2>
            <p>{{ incident.description || 'No description provided' }}</p>
          </div>

          <!-- Artifacts -->
          <div class="card">
            <div class="card-header-with-action">
              <h2>Artifacts ({{ incident.artifacts?.length || 0 }})</h2>
              <button @click="showArtifactForm = true; editingArtifact = null" class="btn btn-primary btn-sm">
                Add Artifact
              </button>
            </div>

            <div v-if="!incident.artifacts || incident.artifacts.length === 0" class="empty-state">
              <p>No artifacts found</p>
            </div>
            <div v-else class="artifacts-list">
              <div v-for="artifact in incident.artifacts" :key="artifact.uid" class="artifact-item">
                <div class="artifact-header">
                  <div class="artifact-badges">
                    <span :class="['badge', 'badge-' + getArtifactTypeClass(artifact.artifact_type)]">
                      {{ artifact.artifact_type }}
                    </span>
                    <span :class="['badge', 'badge-' + getArtifactStatusClass(artifact.status)]">
                      {{ artifact.status }}
                    </span>
                    <span :class="['badge', 'badge-secondary']">
                      {{ artifact.kind }}
                    </span>
                  </div>
                  <div class="artifact-actions">
                    <button @click="editArtifact(artifact)" class="btn-icon" title="Edit">
                      ✏️
                    </button>
                    <button @click="deleteArtifact(artifact.uid!)" class="btn-icon" title="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
                <div class="artifact-value">{{ artifact.value }}</div>
                <div v-if="artifact.notes" class="artifact-notes">{{ artifact.notes }}</div>
              </div>
            </div>
          </div>

          <!-- Artifact Form Modal -->
          <div v-if="showArtifactForm" class="modal-overlay" @click.self="showArtifactForm = false">
            <div class="modal">
              <div class="modal-header">
                <h2>{{ editingArtifact ? 'Edit Artifact' : 'Add Artifact' }}</h2>
                <button @click="showArtifactForm = false" class="btn-close">×</button>
              </div>
              <form @submit.prevent="handleArtifactSubmit" class="artifact-form">
                <div class="form-group">
                  <label>Value *</label>
                  <input v-model="artifactForm.value" type="text" required placeholder="e.g., 192.168.1.1" />
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Type *</label>
                    <select v-model="artifactForm.artifact_type" required>
                      <option value="ip">IP</option>
                      <option value="domain">Domain</option>
                      <option value="hash">Hash</option>
                      <option value="url">URL</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Status *</label>
                    <select v-model="artifactForm.status" required>
                      <option value="malicious">Malicious</option>
                      <option value="clean">Clean</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>Kind *</label>
                  <select v-model="artifactForm.kind" required>
                    <option value="ioc">IOC (Indicator of Compromise)</option>
                    <option value="asset">Asset</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Notes</label>
                  <textarea v-model="artifactForm.notes" rows="3" placeholder="Optional notes about this artifact"></textarea>
                </div>

                <div class="form-actions">
                  <button type="button" @click="showArtifactForm = false" class="btn btn-secondary">Cancel</button>
                  <button type="submit" class="btn btn-primary">
                    {{ editingArtifact ? 'Update' : 'Add' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- File Form Modal -->
          <div v-if="showFileForm" class="modal-overlay" @click.self="showFileForm = false">
            <div class="modal">
              <div class="modal-header">
                <h2>Upload File</h2>
                <button @click="showFileForm = false" class="btn-close">×</button>
              </div>
              <form @submit.prevent="handleFileSubmit" class="file-form">
                <div class="form-group">
                  <label>Select File *</label>
                  <input
                    type="file"
                    @change="handleFileChange"
                    required
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.tar,.gz,.log,.json,.xml"
                  />
                  <small>Max size: 10MB. Allowed types: images, documents, archives, logs</small>
                  <div v-if="selectedFile" class="file-preview">
                    Selected: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
                  </div>
                </div>

                <div class="form-actions">
                  <button type="button" @click="showFileForm = false" class="btn btn-secondary">Cancel</button>
                  <button type="submit" class="btn btn-primary" :disabled="!selectedFile || uploading">
                    {{ uploading ? 'Uploading...' : 'Upload' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Reference Form Modal -->
          <div v-if="showReferenceForm" class="modal-overlay" @click.self="showReferenceForm = false">
            <div class="modal">
              <div class="modal-header">
                <h2>{{ editingReference ? 'Edit Reference' : 'Add Reference' }}</h2>
                <button @click="showReferenceForm = false" class="btn-close">×</button>
              </div>
              <form @submit.prevent="handleReferenceSubmit" class="reference-form">
                <div class="form-group">
                  <label>Title *</label>
                  <input v-model="referenceForm.title" type="text" required placeholder="e.g., MITRE ATT&CK Technique" />
                </div>

                <div class="form-group">
                  <label>Link *</label>
                  <input v-model="referenceForm.link" type="url" required placeholder="https://example.com" />
                </div>

                <div class="form-actions">
                  <button type="button" @click="showReferenceForm = false" class="btn btn-secondary">Cancel</button>
                  <button type="submit" class="btn btn-primary">
                    {{ editingReference ? 'Update' : 'Add' }}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Related Ticket Form Modal -->
          <div v-if="showRelatedTicketForm" class="modal-overlay" @click.self="showRelatedTicketForm = false">
            <div class="modal">
              <div class="modal-header">
                <h2>Add Related Ticket</h2>
                <button @click="showRelatedTicketForm = false" class="btn-close">×</button>
              </div>
              <form @submit.prevent="handleRelatedTicketSubmit" class="related-ticket-form">
                <div class="form-group">
                  <label>Select Incident *</label>
                  <select v-model="relatedTicketForm.ticketId" required>
                    <option value="">-- Select an incident --</option>
                    <option
                      v-for="inc in availableIncidents"
                      :key="inc.uid"
                      :value="inc.uid"
                    >
                      {{ inc.title }} ({{ inc.severity }})
                    </option>
                  </select>
                </div>

                <div class="form-actions">
                  <button type="button" @click="showRelatedTicketForm = false" class="btn btn-secondary">Cancel</button>
                  <button type="submit" class="btn btn-primary">Add</button>
                </div>
              </form>
            </div>
          </div>

          <!-- Files -->
          <div class="card">
            <div class="card-header-with-action">
              <h2>Files ({{ incident.files?.length || 0 }})</h2>
              <button @click="showFileForm = true" class="btn btn-primary btn-sm">
                Add File
              </button>
            </div>

            <div v-if="!incident.files || incident.files.length === 0" class="empty-state">
              <p>No files attached</p>
            </div>
            <div v-else class="files-list">
              <div v-for="(file, index) in parsedFiles" :key="index" class="file-item">
                <div class="file-info">
                  <span class="file-icon">📎</span>
                  <div class="file-details">
                    <a @click.prevent="downloadFile(file)" class="file-link" style="cursor: pointer;">
                      {{ file.filename }}
                    </a>
                    <small class="file-meta">{{ formatFileSize(file.size) }} • {{ formatDate(file.uploadedAt) }}</small>
                  </div>
                </div>
                <button @click="deleteFile(file.storedName)" class="btn-icon" title="Delete">
                  🗑️
                </button>
              </div>
            </div>
          </div>

          <!-- References -->
          <div class="card">
            <div class="card-header-with-action">
              <h2>References ({{ incident.references?.length || 0 }})</h2>
              <button @click="showReferenceForm = true; editingReference = null" class="btn btn-primary btn-sm">
                Add Reference
              </button>
            </div>

            <div v-if="!incident.references || incident.references.length === 0" class="empty-state">
              <p>No references</p>
            </div>
            <div v-else class="references-list">
              <div v-for="reference in incident.references" :key="reference.uid" class="reference-item">
                <div class="reference-content">
                  <h4>{{ reference.title }}</h4>
                  <a :href="reference.link" target="_blank" class="reference-link">{{ reference.link }}</a>
                </div>
                <div class="reference-actions">
                  <button @click="editReference(reference)" class="btn-icon" title="Edit">
                    ✏️
                  </button>
                  <button @click="deleteReference(reference.uid!)" class="btn-icon" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Related Tickets -->
          <div class="card">
            <div class="card-header-with-action">
              <h2>Related Tickets ({{ incident.related_tickets?.length || 0 }})</h2>
              <button @click="showRelatedTicketForm = true" class="btn btn-primary btn-sm">
                Add Related Ticket
              </button>
            </div>

            <div v-if="!incident.related_tickets || incident.related_tickets.length === 0" class="empty-state">
              <p>No related tickets</p>
            </div>
            <div v-else class="related-tickets-list">
              <div v-for="ticket in incident.related_tickets" :key="ticket.uid" class="ticket-item">
                <div class="ticket-content">
                  <h4>{{ ticket.title }}</h4>
                  <div class="ticket-badges">
                    <span :class="['badge', 'badge-' + getSeverityClass(ticket.severity)]">
                      {{ ticket.severity }}
                    </span>
                    <span :class="['badge', 'badge-' + getStatusClass(ticket.status)]">
                      {{ ticket.status }}
                    </span>
                  </div>
                </div>
                <div class="ticket-actions">
                  <router-link :to="`/incidents/${ticket.uid}`" class="btn-icon" title="View">
                    👁️
                  </router-link>
                  <button @click="removeRelatedTicket(ticket.uid!)" class="btn-icon" title="Remove">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="detail-sidebar">
          <!-- Assignment Card -->
          <div class="card">
            <h3>Assigned To</h3>
            <div v-if="incident.assigned_to && incident.assigned_to.name" class="user-card">
              <div class="user-avatar">{{ incident.assigned_to.name.charAt(0) }}</div>
              <div class="user-info">
                <div class="user-name">{{ incident.assigned_to.name }}</div>
                <div class="user-role">{{ incident.assigned_to.role?.replace('_', ' ') || 'N/A' }}</div>
                <div class="user-email">{{ incident.assigned_to.email || 'N/A' }}</div>
                <div v-if="incident.assigned_to.department" class="user-dept">
                  {{ incident.assigned_to.department }}
                </div>
              </div>
            </div>
            <p v-else class="empty-text">Unassigned</p>
          </div>

          <!-- Playbook Card -->
          <div v-if="incident.playbook" class="card">
            <h3>Playbook</h3>
            <div class="playbook-info">
              <h4>{{ incident.playbook.name }}</h4>
              <p>{{ incident.playbook.description }}</p>
              <div v-if="incident.playbook.estimated_duration" class="playbook-meta">
                <span class="meta-label">Duration:</span>
                <span>{{ incident.playbook.estimated_duration }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIncidentsStore } from '@/stores/incidents'
import { useUsersStore } from '@/stores/users'
import { usePlaybooksStore } from '@/stores/playbooks'
import api from '@/services/api'
import type { Severity, TLP, IncidentStatus, ArtifactType, ArtifactStatus, Artifact, Reference } from '@/types'

const route = useRoute()
const router = useRouter()
const incidentsStore = useIncidentsStore()
const usersStore = useUsersStore()
const playbooksStore = usePlaybooksStore()

const showEditForm = ref(false)
const editForm = ref({
  title: '',
  description: '',
  severity: 'Medium' as Severity,
  tlp: 'Amber' as TLP,
  status: 'Open' as IncidentStatus,
  assigned_to: '',
  playbook: ''
})

const showArtifactForm = ref(false)
const editingArtifact = ref<Artifact | null>(null)
const artifactForm = ref({
  value: '',
  artifact_type: 'ip' as ArtifactType,
  status: 'unknown' as ArtifactStatus,
  kind: 'ioc' as 'asset' | 'ioc',
  notes: ''
})

const showFileForm = ref(false)
const selectedFile = ref<File | null>(null)
const uploading = ref(false)

const showReferenceForm = ref(false)
const editingReference = ref<Reference | null>(null)
const referenceForm = ref({
  title: '',
  link: ''
})

const showRelatedTicketForm = ref(false)
const relatedTicketForm = ref({
  ticketId: ''
})

const incident = computed(() => incidentsStore.currentIncident)
const availableIncidents = computed(() => {
  const currentId = incident.value?.uid
  const relatedIds = incident.value?.related_tickets?.map(t => t.uid) || []
  return incidentsStore.incidents.filter(
    inc => inc.uid !== currentId && !relatedIds.includes(inc.uid)
  )
})

// Parse file metadata from JSON strings
const parsedFiles = computed(() => {
  if (!incident.value?.files) return []
  return incident.value.files.map(f => {
    try {
      return JSON.parse(f)
    } catch {
      // Fallback for old URL-based files
      return {
        filename: f,
        storedName: f,
        size: 0,
        uploadedAt: null
      }
    }
  })
})

async function loadIncident(id: string) {
  await Promise.all([
    incidentsStore.fetchIncident(id),
    usersStore.fetchUsers(),
    incidentsStore.fetchIncidents(),
    playbooksStore.fetchPlaybooks()
  ])

  if (incident.value) {
    editForm.value = {
      title: incident.value.title,
      description: incident.value.description || '',
      severity: incident.value.severity,
      tlp: incident.value.tlp,
      status: incident.value.status,
      assigned_to: incident.value.assigned_to?.uid || '',
      playbook: incident.value.playbook?.uid || ''
    }
  }
}

onMounted(async () => {
  const id = route.params.id as string
  await loadIncident(id)
})

// Watch for route changes to reload incident when navigating between incidents
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadIncident(newId as string)
    }
  }
)

async function handleUpdate() {
  const id = route.params.id as string
  await incidentsStore.updateIncident(id, editForm.value)
  showEditForm.value = false
}

async function handleDelete() {
  if (confirm('Are you sure you want to delete this incident?')) {
    const id = route.params.id as string
    await incidentsStore.deleteIncident(id)
    router.push('/incidents')
  }
}

function editArtifact(artifact: Artifact) {
  editingArtifact.value = artifact
  artifactForm.value = {
    value: artifact.value,
    artifact_type: artifact.artifact_type,
    status: artifact.status,
    kind: artifact.kind,
    notes: artifact.notes || ''
  }
  showArtifactForm.value = true
}

async function handleArtifactSubmit() {
  const incidentId = route.params.id as string

  try {
    if (editingArtifact.value && editingArtifact.value.uid) {
      // Update existing artifact
      await api.updateArtifact(editingArtifact.value.uid, artifactForm.value)
    } else {
      // Create new artifact
      await api.createArtifact(incidentId, artifactForm.value)
    }

    // Refresh the incident data
    await incidentsStore.fetchIncident(incidentId)

    // Reset form and close modal
    showArtifactForm.value = false
    editingArtifact.value = null
    artifactForm.value = {
      value: '',
      artifact_type: 'ip',
      status: 'unknown',
      kind: 'ioc',
      notes: ''
    }
  } catch (error) {
    console.error('Failed to save artifact:', error)
    alert('Failed to save artifact. Please try again.')
  }
}

async function deleteArtifact(artifactId: string) {
  if (confirm('Are you sure you want to delete this artifact?')) {
    const incidentId = route.params.id as string
    try {
      await api.deleteArtifact(artifactId)
      // Refresh the incident data
      await incidentsStore.fetchIncident(incidentId)
    } catch (error) {
      console.error('Failed to delete artifact:', error)
      alert('Failed to delete artifact. Please try again.')
    }
  }
}

// File management functions
function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

async function handleFileSubmit() {
  if (!selectedFile.value) return

  const incidentId = route.params.id as string
  uploading.value = true

  try {
    await api.uploadFileToIncident(incidentId, selectedFile.value)
    await incidentsStore.fetchIncident(incidentId)
    showFileForm.value = false
    selectedFile.value = null
  } catch (error) {
    console.error('Failed to upload file:', error)
    alert('Failed to upload file. Please try again.')
  } finally {
    uploading.value = false
  }
}

async function downloadFile(file: any) {
  const incidentId = route.params.id as string
  try {
    const blob = await api.downloadFile(incidentId, file.storedName)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Failed to download file:', error)
    alert('Failed to download file. Please try again.')
  }
}

async function deleteFile(storedFilename: string) {
  if (confirm('Are you sure you want to delete this file?')) {
    const incidentId = route.params.id as string
    try {
      await api.removeFileFromIncident(incidentId, storedFilename)
      await incidentsStore.fetchIncident(incidentId)
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert('Failed to delete file. Please try again.')
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Reference management functions
function editReference(reference: Reference) {
  editingReference.value = reference
  referenceForm.value = {
    title: reference.title,
    link: reference.link
  }
  showReferenceForm.value = true
}

async function handleReferenceSubmit() {
  const incidentId = route.params.id as string
  try {
    if (editingReference.value && editingReference.value.uid) {
      // Update existing reference
      await api.updateReference(editingReference.value.uid, referenceForm.value)
    } else {
      // Create new reference
      await api.createReference(incidentId, referenceForm.value)
    }

    // Refresh the incident data
    await incidentsStore.fetchIncident(incidentId)

    // Reset form and close modal
    showReferenceForm.value = false
    editingReference.value = null
    referenceForm.value = {
      title: '',
      link: ''
    }
  } catch (error) {
    console.error('Failed to save reference:', error)
    alert('Failed to save reference. Please try again.')
  }
}

async function deleteReference(referenceId: string) {
  if (confirm('Are you sure you want to delete this reference?')) {
    const incidentId = route.params.id as string
    try {
      await api.deleteReference(referenceId)
      await incidentsStore.fetchIncident(incidentId)
    } catch (error) {
      console.error('Failed to delete reference:', error)
      alert('Failed to delete reference. Please try again.')
    }
  }
}

// Related ticket management functions
async function handleRelatedTicketSubmit() {
  const incidentId = route.params.id as string
  try {
    await api.addRelatedTicket(incidentId, relatedTicketForm.value.ticketId)
    await incidentsStore.fetchIncident(incidentId)
    showRelatedTicketForm.value = false
    relatedTicketForm.value.ticketId = ''
  } catch (error) {
    console.error('Failed to add related ticket:', error)
    alert('Failed to add related ticket. Please try again.')
  }
}

async function removeRelatedTicket(ticketId: string) {
  if (confirm('Are you sure you want to remove this related ticket?')) {
    const incidentId = route.params.id as string
    try {
      await api.removeRelatedTicket(incidentId, ticketId)
      await incidentsStore.fetchIncident(incidentId)
    } catch (error) {
      console.error('Failed to remove related ticket:', error)
      alert('Failed to remove related ticket. Please try again.')
    }
  }
}

function getSeverityClass(severity: Severity): string {
  const map: Record<Severity, string> = {
    High: 'danger',
    Medium: 'warning',
    Low: 'info'
  }
  return map[severity]
}

function getTlpClass(tlp: TLP): string {
  const map: Record<TLP, string> = {
    Red: 'danger',
    Amber: 'warning',
    Green: 'success',
    White: 'info'
  }
  return map[tlp]
}

function getStatusClass(status: IncidentStatus): string {
  const map: Record<IncidentStatus, string> = {
    Open: 'info',
    InProgress: 'warning',
    Resolved: 'success',
    Closed: 'secondary'
  }
  return map[status]
}

function getArtifactTypeClass(type: ArtifactType): string {
  return 'primary'
}

function getArtifactStatusClass(status: ArtifactStatus): string {
  const map: Record<ArtifactStatus, string> = {
    malicious: 'danger',
    clean: 'success',
    unknown: 'secondary'
  }
  return map[status]
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}
</script>
