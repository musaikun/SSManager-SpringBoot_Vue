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
    navigationStore.setForward()
    router.push('/confirm')
  } else if (route.path === '/confirm') {
    // 提出方法選択モーダルを開く
    timeRegisterStore.openSubmitModal()
  }
}

// ヘッダーアイコンのハンドラー
const handleHistoryClick = () => {
  // TODO: 過去の提出記録画面へ遷移
  alert('過去の提出記録（実装予定）')
}

const handleLogoClick = () => {
  router.push('/')
}

const handleSettingsClick = () => {
  // TODO: 初期値設定画面へ遷移
  alert('初期値設定（実装予定）')
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
        <div class="header-icons">
          <button class="header-icon-btn" @click="handleHistoryClick" title="過去の提出記録">
            <span class="icon">📋</span>
          </button>
          <button class="header-logo-btn" @click="handleLogoClick" title="ホームに戻る">
            <span class="logo-text">S×S Manager</span>
          </button>
          <button class="header-icon-btn" @click="handleSettingsClick" title="初期値設定">
            <span class="icon">⚙️</span>
          </button>
        </div>
      </div>

      <!-- メインコンテンツ（スライド） -->
      <div class="slider-content">
        <PageSlider :pages="sliderPages" />
      </div>

      <!-- フッター（固定） -->
      <div class="fixed-footer">
        <ProgressIndicator />
        <div class="footer-buttons" v-if="route.path !== '/confirm'">
          <button v-if="showBackButton" @click="handleBack" class="action-btn back-btn">
            戻る
          </button>
          <button @click="handleNext" class="action-btn next-btn">
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
  background: #1a1a2e;
}

/* スライドレイアウト */
.slider-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
}

.fixed-header {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  z-index: 100;
}

.header-icons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-icon-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
}

.header-icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-icon-btn .icon {
  font-size: 1.25rem;
}

.header-logo-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 12px;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-logo-btn:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.logo-text {
  font-size: 0.95rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
