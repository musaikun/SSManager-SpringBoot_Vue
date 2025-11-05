<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import HelloWorld from './components/HelloWorld.vue'

const apiResponse = ref<string>('')
const loading = ref<boolean>(false)
const error = ref<string>('')

const API_BASE_URL = 'http://localhost:8080/api'

/**
 * Backend API疎通テスト - /api/hello
 */
const testApiHello = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get(`${API_BASE_URL}/hello`)
    apiResponse.value = JSON.stringify(response.data, null, 2)
  } catch (e: any) {
    error.value = `Error: ${e.message}`
    apiResponse.value = ''
  } finally {
    loading.value = false
  }
}

/**
 * Backend API疎通テスト - /api/ping
 */
const testApiPing = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await axios.get(`${API_BASE_URL}/ping`)
    apiResponse.value = response.data
  } catch (e: any) {
    error.value = `Error: ${e.message}`
    apiResponse.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />

  <!-- API連携テストセクション -->
  <div class="api-test">
    <h2>Backend API 疎通テスト</h2>
    <div class="button-group">
      <button @click="testApiHello" :disabled="loading">Test /api/hello</button>
      <button @click="testApiPing" :disabled="loading">Test /api/ping</button>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <pre v-if="apiResponse" class="response">{{ apiResponse }}</pre>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

/* API Test Styles */
.api-test {
  margin-top: 2rem;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #f9f9f9;
}

.api-test h2 {
  margin-bottom: 1rem;
  color: #333;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.button-group button {
  padding: 0.5rem 1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.button-group button:hover:not(:disabled) {
  background: #35a372;
}

.button-group button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading {
  color: #646cff;
  font-weight: bold;
  margin: 1rem 0;
}

.error {
  color: #ff4444;
  font-weight: bold;
  margin: 1rem 0;
}

.response {
  background: #2d2d2d;
  color: #00ff00;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  overflow-x: auto;
}
</style>
