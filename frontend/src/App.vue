<script setup lang="ts">
import { useNavigationStore } from './stores/navigation'
import { storeToRefs } from 'pinia'

const navigationStore = useNavigationStore()
const { transitionName } = storeToRefs(navigationStore)
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
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
}

/* スライドトランジション */
/* 左へスライド（次へ進む） */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform, opacity;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translate3d(100%, 0, 0);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translate3d(-100%, 0, 0);
}

/* 右へスライド（戻る） */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform, opacity;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translate3d(-100%, 0, 0);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translate3d(100%, 0, 0);
}

/* トランジションなし */
.none-enter-active,
.none-leave-active {
  transition: none;
}
</style>
