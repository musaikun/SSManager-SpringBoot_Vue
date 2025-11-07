<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageSlider from './components/PageSlider.vue'
import ProgressIndicator from './components/ProgressIndicator.vue'
import CalendarView from './views/CalendarView.vue'
import TimeRegisterView from './views/TimeRegisterView.vue'
import ConfirmView from './views/ConfirmView.vue'
import HomeView from './views/HomeView.vue'
import { useNavigationStore } from './stores/navigation'
import { useTimeRegisterStore } from './stores/timeRegister'

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()
const timeRegisterStore = useTimeRegisterStore()
const { workDays, totalSummary } = storeToRefs(timeRegisterStore)

// スライド対象のページ
const sliderPages = [
  { name: 'calendar', path: '/calendar', component: CalendarView },
  { name: 'time-register', path: '/time-register', component: TimeRegisterView },
  { name: 'confirm', path: '/confirm', component: ConfirmView }
]

// ホーム画面かどうか
const isHomePage = computed(() => route.path === '/')

// スライドページかどうか
const isSliderPage = computed(() =>
  sliderPages.some(page => page.path === route.path)
)

// 現在のページに応じたボタン設定
const showBackButton = computed(() =>
  route.path === '/time-register' || route.path === '/confirm'
)

const nextButtonLabel = computed(() => {
  if (route.path === '/calendar') return '次へ'
  if (route.path === '/time-register') return '次へ'
  if (route.path === '/confirm') return '提出'
  return '次へ'
})

// ボタンハンドラー
const handleBack = () => {
  navigationStore.setBackward()
  if (route.path === '/time-register') {
    router.push('/calendar')
  } else if (route.path === '/confirm') {
    router.push('/time-register')
  }
}

const handleNext = () => {
  if (route.path === '/calendar') {
    navigationStore.setForward()
    router.push('/time-register')
  } else if (route.path === '/time-register') {
    // 勤務日が選択されているかチェック
    const activeCount = workDays.value.filter(d => !d.isRemoved).length
    if (activeCount === 0) {
      alert('勤務日が選択されていません')
      return
    }
    navigationStore.setForward()
    router.push('/confirm')
  } else if (route.path === '/confirm') {
    // 提出方法選択モーダルを開く
    timeRegisterStore.openSubmitModal()
  }
}
</script>

<template>
  <div id="app">
    <!-- ホーム画面は通常表示 -->
    <HomeView v-if="isHomePage" />

    <!-- カレンダー・時間設定・確認画面 -->
    <div v-else-if="isSliderPage" class="slider-layout">
      <!-- ヘッダー（固定） -->
      <div class="fixed-header">
        <ProgressIndicator />
      </div>

      <!-- メインコンテンツ（スライド） -->
      <div class="slider-content">
        <PageSlider :pages="sliderPages" />
      </div>

      <!-- フッター（固定） -->
      <div class="fixed-footer">
        <div class="footer-buttons">
          <button v-if="showBackButton" @click="handleBack" class="action-btn back-btn">
            戻る
          </button>
          <button @click="handleNext" class="action-btn next-btn" :class="{ 'submit-btn': route.path === '/confirm' }">
            {{ nextButtonLabel }}
          </button>
        </div>
      </div>
    </div>
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

/* スライドレイアウト */
.slider-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.fixed-header {
  flex-shrink: 0;
  padding: 1rem 1rem 0 1rem;
  z-index: 100;
}

.slider-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.fixed-footer {
  flex-shrink: 0;
  padding: 1rem;
  z-index: 100;
}

.footer-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  max-width: 800px;
  margin: 0 auto;
}

.action-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 50px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  max-width: 200px;
}

.back-btn {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.back-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.next-btn {
  background: linear-gradient(135deg, #f97316, #fb923c);
  color: white;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5);
}

.submit-btn {
  background: linear-gradient(135deg, #10b981, #34d399);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.submit-btn:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .fixed-header {
    padding: 0.75rem 0.75rem 0 0.75rem;
  }

  .fixed-footer {
    padding: 0.75rem;
  }

  .action-btn {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
