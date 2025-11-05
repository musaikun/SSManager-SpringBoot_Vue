<template>
  <div class="calendar-container">
    <h1>カレンダー画面</h1>
    <p>Coming soon...</p>
    <button @click="goBack">戻る</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.calendar-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1b1b15, #2f3a2a);
  color: white;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
}

h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.7;
}

button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  color: white;
  background: linear-gradient(135deg, #6f3ad0, #a36bff);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(111, 58, 208, 0.4);
}
</style>
