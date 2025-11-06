<template>
  <div class="progress-indicator">
    <div
      v-for="(step, index) in steps"
      :key="step.id"
      class="progress-item"
    >
      <!-- ステップ -->
      <div
        class="progress-step"
        :class="{
          completed: step.completed,
          active: step.active,
          clickable: step.clickable
        }"
        @click="handleStepClick(step)"
      >
        <div class="step-circle">
          <span v-if="step.completed" class="check-mark">✓</span>
          <span v-else>{{ step.number }}</span>
        </div>
        <div class="step-label">{{ step.label }}</div>
      </div>

      <!-- 線（最後のステップ以外） -->
      <div
        v-if="index < steps.length - 1"
        class="progress-line"
        :class="{ completed: step.completed }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useProgress } from '../composables/useProgress'
import type { ProgressStepInfo } from '../types/timeRegister'

const router = useRouter()
const { steps } = useProgress()

const handleStepClick = (step: ProgressStepInfo) => {
  if (!step.clickable) return

  // ステップに応じてルート遷移
  if (step.id === 'calendar') {
    router.push('/calendar')
  } else if (step.id === 'time-register') {
    router.push('/time-register')
  } else if (step.id === 'confirm') {
    // TODO: 確認画面実装後に追加
    console.log('確認画面へ')
  }
}
</script>

<style scoped>
.progress-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.progress-item {
  display: flex;
  align-items: center;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.progress-step.clickable {
  cursor: pointer;
}

.progress-step.clickable:hover .step-circle {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.step-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  background: #e0e0e0;
  color: #999;
  transition: all 0.3s ease;
}

.progress-step.completed .step-circle {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.progress-step.active .step-circle {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: scale(1.1);
}

.check-mark {
  font-size: 1.5rem;
}

.step-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}

.progress-step.completed .step-label {
  color: #10b981;
}

.progress-step.active .step-label {
  color: #667eea;
  font-weight: 700;
}

.progress-line {
  width: 80px;
  height: 3px;
  background: #e0e0e0;
  margin: 0 1rem;
  transition: all 0.3s ease;
  position: relative;
  top: -12px;
}

.progress-line.completed {
  background: linear-gradient(90deg, #10b981, #34d399);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .progress-indicator {
    padding: 1rem 0.5rem;
  }

  .step-circle {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .step-label {
    font-size: 0.75rem;
  }

  .progress-line {
    width: 40px;
    margin: 0 0.5rem;
  }
}

@media (max-width: 480px) {
  .step-circle {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }

  .step-label {
    font-size: 0.7rem;
  }

  .progress-line {
    width: 30px;
    margin: 0 0.3rem;
  }
}
</style>
