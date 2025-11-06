<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageSlider from './components/PageSlider.vue'
import CalendarView from './views/CalendarView.vue'
import TimeRegisterView from './views/TimeRegisterView.vue'
import ConfirmView from './views/ConfirmView.vue'
import HomeView from './views/HomeView.vue'

const route = useRoute()

// スライド対象のページ
const sliderPages = [
  { name: 'calendar', path: '/calendar', component: CalendarView },
  { name: 'time-register', path: '/time-register', component: TimeRegisterView },
  { name: 'confirm', path: '/confirm', component: ConfirmView }
]

// ホーム画面かどうか
const isHomePage = computed(() => route.path === '/')
</script>

<template>
  <div id="app">
    <!-- ホーム画面は通常表示 -->
    <HomeView v-if="isHomePage" />

    <!-- カレンダー・時間設定はPageSliderで表示 -->
    <PageSlider v-else :pages="sliderPages" />
  </div>
</template>

<style>
/* グローバルスタイル */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}
</style>
