<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-brand">
          <span class="brand-icon">🛡️</span>
          <span class="brand-text">Incident Response Tracker</span>
        </router-link>

        <div class="nav-links">
          <router-link to="/" class="nav-link" active-class="active">
            <span class="nav-icon">📊</span>
            <span>Dashboard</span>
          </router-link>

          <router-link to="/incidents" class="nav-link" active-class="active">
            <span class="nav-icon">🚨</span>
            <span>Incidents</span>
          </router-link>

          <router-link to="/playbooks" class="nav-link" active-class="active">
            <span class="nav-icon">📚</span>
            <span>Playbooks</span>
          </router-link>

          <router-link to="/users" class="nav-link" active-class="active">
            <span class="nav-icon">👥</span>
            <span>Team</span>
          </router-link>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <router-view />
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 Incident Response Tracker | Powered by Dgraph</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('Incident Response Tracker initialized')
})
</script>
