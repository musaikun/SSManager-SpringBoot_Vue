<template>
  <div class="progress-indicator" :class="{ 'tutorial-mode': showTutorial }">
    <div
      v-for="(step, index) in steps"
      :key="step.id"
      class="progress-item"
    >
      <!-- ステップドット -->
      <div
        class="progress-step"
        :class="{ active: step.active }"
        @click="handleStepClick(step)"
      >
        <div class="step-dot" :class="{ 'tutorial-pulse': showTutorial }"></div>
        <div class="step-label">{{ step.label }}</div>
      </div>

      <!-- 線（最後のステップ以外） -->
      <div
        v-if="index < steps.length - 1"
        class="progress-line"
      ></div>
    </div>

    <!-- チュートリアルヒント -->
    <div v-if="showTutorial" class="tutorial-hint">
      <span class="hint-icon">👆</span>
      <span class="hint-text">タップで画面移動できます</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgress } from '../composables/useProgress'
import type { ProgressStepInfo } from '../types/timeRegister'

const router = useRouter()
const { steps } = useProgress()

const showTutorial = ref(false)

const handleStepClick = (step: ProgressStepInfo) => {
  if (!step.clickable) return

  // チュートリアルを非表示
  showTutorial.value = false
  localStorage.setItem('progressTutorialShown', 'true')

  // ステップに応じてルート遷移
  if (step.id === 'calendar') {
    router.push('/calendar')
  } else if (step.id === 'time-register') {
    router.push('/time-register')
  } else if (step.id === 'confirm') {
    router.push('/confirm')
  }
}

onMounted(() => {
  // 初回のみチュートリアルを表示
  const tutorialShown = localStorage.getItem('progressTutorialShown')
  if (!tutorialShown) {
    setTimeout(() => {
      showTutorial.value = true
      // 5秒後に自動で非表示
      setTimeout(() => {
        showTutorial.value = false
        localStorage.setItem('progressTutorialShown', 'true')
      }, 5000)
    }, 500)
  }
})
</script>

<style scoped>
.progress-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
  position: relative;
}

.progress-item {
  display: flex;
  align-items: center;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.progress-step:hover .step-dot {
  transform: scale(1.1);
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.progress-step.active .step-dot {
  width: 14px;
  height: 14px;
  background: white;
  box-shadow:
    0 0 10px rgba(255, 255, 255, 0.8),
    0 0 20px rgba(255, 255, 255, 0.6),
    0 0 30px rgba(255, 255, 255, 0.4);
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow:
      0 0 10px rgba(255, 255, 255, 0.8),
      0 0 20px rgba(255, 255, 255, 0.6),
      0 0 30px rgba(255, 255, 255, 0.4);
  }
  50% {
    box-shadow:
      0 0 15px rgba(255, 255, 255, 1),
      0 0 30px rgba(255, 255, 255, 0.8),
      0 0 45px rgba(255, 255, 255, 0.6);
  }
}

.step-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  transition: all 0.3s ease;
}

.progress-step.active .step-label {
  color: white;
  font-weight: 700;
}

.progress-line {
  width: 60px;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 0.75rem;
  position: relative;
  top: -10px;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .progress-indicator {
    padding: 0.5rem 0.5rem;
  }

  .step-dot {
    width: 10px;
    height: 10px;
  }

  .progress-step.active .step-dot {
    width: 12px;
    height: 12px;
  }

  .step-label {
    font-size: 0.65rem;
  }

  .progress-line {
    width: 40px;
    margin: 0 0.5rem;
  }
}

@media (max-width: 480px) {
  .step-dot {
    width: 8px;
    height: 8px;
  }

  .progress-step.active .step-dot {
    width: 10px;
    height: 10px;
  }

  .step-label {
    font-size: 0.6rem;
  }

  .progress-line {
    width: 30px;
    margin: 0 0.3rem;
  }
}

/* チュートリアルアニメーション */
.tutorial-pulse {
  animation: tutorial-pulse-animation 1.5s ease-in-out infinite;
}

@keyframes tutorial-pulse-animation {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.8;
  }
}

.tutorial-hint {
  position: absolute;
  bottom: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: hint-bounce 0.5s ease-in-out, hint-fade-in 0.3s ease-in;
  white-space: nowrap;
}

@keyframes hint-bounce {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-5px);
  }
}

@keyframes hint-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.hint-icon {
  font-size: 1.25rem;
  animation: hint-point 1s ease-in-out infinite;
}

@keyframes hint-point {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.hint-text {
  font-size: 0.85rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
