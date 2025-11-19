<template>
  <div class="users-page">
    <div class="page-header">
      <h1 class="page-title">Team Overview</h1>
      <button @click="showCreateForm = true" class="btn btn-primary">+ Add User</button>
    </div>

    <!-- Create User Form -->
    <div v-if="showCreateForm" class="modal-overlay" @click.self="showCreateForm = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Add Team Member</h2>
          <button @click="showCreateForm = false" class="btn-close">×</button>
        </div>
        <form @submit.prevent="handleCreateUser" class="user-form">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="newUser.name" type="text" required placeholder="Full name" />
          </div>

          <div class="form-group">
            <label>Email *</label>
            <input v-model="newUser.email" type="email" required placeholder="email@company.com" />
          </div>

          <div class="form-group">
            <label>Role *</label>
            <select v-model="newUser.role" required>
              <option value="">Select role</option>
              <option value="incident_commander">Incident Commander</option>
              <option value="analyst">Security Analyst</option>
              <option value="technical_lead">Technical Lead</option>
            </select>
          </div>

          <div class="form-group">
            <label>Department</label>
            <input v-model="newUser.department" type="text" placeholder="Department name" />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input v-model="newUser.is_active" type="checkbox" />
              <span>Active User</span>
            </label>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-actions">
            <button type="button" @click="showCreateForm = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="loading" class="btn btn-primary">
              {{ loading ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Team Overview -->
    <div v-if="!usersStore.loading && usersStore.users.length > 0" class="section">
      <div class="role-stats">
        <div class="role-stat-card">
          <div class="role-icon commander">👨‍✈️</div>
          <div class="role-info">
            <div class="role-count">{{ usersStore.usersByRole.incident_commander }}</div>
            <div class="role-name">Incident Commanders</div>
          </div>
        </div>

        <div class="role-stat-card">
          <div class="role-icon analyst">🔍</div>
          <div class="role-info">
            <div class="role-count">{{ usersStore.usersByRole.analyst }}</div>
            <div class="role-name">Security Analysts</div>
          </div>
        </div>

        <div class="role-stat-card">
          <div class="role-icon technical">⚙️</div>
          <div class="role-info">
            <div class="role-count">{{ usersStore.usersByRole.technical_lead }}</div>
            <div class="role-name">Technical Leads</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Members List -->
    <div v-if="usersStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Loading team members...</p>
    </div>

    <div v-else-if="usersStore.users.length === 0" class="empty-state">
      <p>No team members found</p>
    </div>

    <div v-else class="users-grid">
      <h2>Team Members</h2>
      <div v-for="user in usersStore.users" :key="user.uid" class="user-card">
        <div class="user-header">
          <div class="user-avatar-large">{{ user.name?.charAt(0) || '?' }}</div>
          <div class="user-status">
            <span v-if="user.is_active" class="status-badge active">Active</span>
            <span v-else class="status-badge inactive">Inactive</span>
          </div>
        </div>

        <div class="user-details">
          <h3 class="user-name">{{ user.name }}</h3>
          <p class="user-email">{{ user.email }}</p>
          <div class="user-meta">
            <span :class="['role-badge', 'role-' + user.role]">
              {{ formatRole(user.role) }}
            </span>
          </div>
          <p v-if="user.department" class="user-department">{{ user.department }}</p>
        </div>

        <div class="user-stats">
          <div class="stat">
            <div class="stat-value">{{ user.assigned_incidents?.length || 0 }}</div>
            <div class="stat-label">Assigned Incidents</div>
          </div>
        </div>

        <div v-if="user.assigned_incidents && user.assigned_incidents.length > 0" class="user-incidents">
          <h4>Recent Incidents</h4>
          <div class="incident-list">
            <div v-for="incident in user.assigned_incidents.slice(0, 3)" :key="incident.uid" class="incident-mini">
              <router-link :to="`/incidents/${incident.uid}`">
                {{ incident.title }}
              </router-link>
              <span :class="['badge', 'badge-' + getStatusClass(incident.status)]">
                {{ incident.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import type { UserRole, IncidentStatus } from '@/types'

const usersStore = useUsersStore()

const showCreateForm = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const newUser = ref({
  name: '',
  email: '',
  role: '' as UserRole | '',
  department: '',
  is_active: true
})

onMounted(async () => {
  await usersStore.fetchUsers()
})

async function handleCreateUser() {
  loading.value = true
  error.value = null

  try {
    await usersStore.createUser(newUser.value)
    showCreateForm.value = false
    newUser.value = {
      name: '',
      email: '',
      role: '',
      department: '',
      is_active: true
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create user'
  } finally {
    loading.value = false
  }
}

function formatRole(role: UserRole): string {
  return role.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
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
</script>
