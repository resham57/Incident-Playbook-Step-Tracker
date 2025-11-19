<template>
  <div class="dashboard">
    <h1 class="page-title">Incident Response Dashboard</h1>

    <div v-if="incidentsStore.loading || usersStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <div v-else>
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon incidents-icon">📋</div>
          <div class="stat-info">
            <div class="stat-value">{{ incidentsStore.incidentCount }}</div>
            <div class="stat-label">Total Incidents</div>
          </div>
        </div>

        <div class="stat-card severity-high">
          <div class="stat-icon">🔴</div>
          <div class="stat-info">
            <div class="stat-value">{{ incidentsStore.incidentsBySeverity.high }}</div>
            <div class="stat-label">High Severity</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-info">
            <div class="stat-value">{{ incidentsStore.incidentsByStatus.inProgress }}</div>
            <div class="stat-label">In Progress</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-value">{{ usersStore.activeUsers.length }}</div>
            <div class="stat-label">Active Team Members</div>
          </div>
        </div>
      </div>

      <!-- Recent Incidents -->
      <div class="section">
        <div class="section-header">
          <h2>Recent Incidents</h2>
          <router-link to="/incidents" class="btn btn-primary">View All</router-link>
        </div>

        <div v-if="incidentsStore.recentIncidents.length === 0" class="empty-state">
          <p>No incidents found</p>
        </div>

        <div v-else class="incidents-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Severity</th>
                <th>TLP</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="incident in incidentsStore.recentIncidents" :key="incident.uid">
                <td>
                  <router-link :to="`/incidents/${incident.uid}`" class="incident-title">
                    {{ incident.title }}
                  </router-link>
                </td>
                <td>
                  <span :class="['badge', 'badge-' + getSeverityClass(incident.severity)]">
                    {{ incident.severity }}
                  </span>
                </td>
                <td>
                  <span :class="['badge', 'badge-' + getTlpClass(incident.tlp)]">
                    {{ incident.tlp }}
                  </span>
                </td>
                <td>
                  <span :class="['badge', 'badge-' + getStatusClass(incident.status)]">
                    {{ incident.status }}
                  </span>
                </td>
                <td>{{ incident.assigned_to?.name || 'Unassigned' }}</td>
                <td>{{ formatDate(incident.created_at) }}</td>
                <td>
                  <router-link :to="`/incidents/${incident.uid}`" class="btn btn-sm">
                    View
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h2>Quick Actions</h2>
        <div class="quick-actions">
          <router-link to="/incidents" class="action-card">
            <div class="action-icon">➕</div>
            <div class="action-title">New Incident</div>
            <div class="action-desc">Report a new security incident</div>
          </router-link>

          <router-link to="/playbooks" class="action-card">
            <div class="action-icon">📚</div>
            <div class="action-title">View Playbooks</div>
            <div class="action-desc">Browse incident response playbooks</div>
          </router-link>

          <router-link to="/users" class="action-card">
            <div class="action-icon">👥</div>
            <div class="action-title">Manage Team</div>
            <div class="action-desc">View and manage team members</div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useIncidentsStore } from '@/stores/incidents'
import { useUsersStore } from '@/stores/users'
import type { Severity, TLP, IncidentStatus } from '@/types'

const incidentsStore = useIncidentsStore()
const usersStore = useUsersStore()

onMounted(async () => {
  await Promise.all([
    incidentsStore.fetchIncidents(),
    usersStore.fetchUsers()
  ])
})

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
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
