<template>
  <div class="confirm-view">
    <!-- 進捗インジケーター -->
    <ProgressIndicator />

    <!-- メインコンテンツ -->
    <div class="confirm-container">
      <!-- 確認カードリスト -->
      <div class="confirm-cards-list">
        <div
          v-for="(workDay, index) in activeWorkDays"
          :key="workDay.date"
          class="confirm-card"
          :class="{ modified: workDay.isModified }"
        >
          <div class="card-header">
            <div class="card-date">{{ workDay.displayDate }}</div>
            <span v-if="workDay.isModified" class="custom-badge">個別設定</span>
          </div>
          <div class="card-time-section">
            <span class="time-value" :class="{ 'custom-time': workDay.customStartTime }">{{ workDay.startTime }}</span>
            <span class="time-separator">〜</span>
            <span class="time-value" :class="{ 'custom-time': workDay.customEndTime }">{{ workDay.endTime }}</span>
          </div>
          <div class="card-hours">
            <span class="hours-icon">💼</span>
            <span class="hours-text">{{ formatWorkTime(workDay) }}</span>
          </div>
        </div>
      </div>

      <!-- 合計統計 -->
      <div class="total-summary-section">
        <div class="summary-card">
          <h3>合計</h3>
          <div class="summary-row">
            <span class="summary-label">勤務日数:</span>
            <span class="summary-value">{{ totalSummary.workDays }}日</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">総勤務時間:</span>
            <span class="summary-value">{{ formatMinutesToHours(totalSummary.totalWorkMinutes) }}</span>
          </div>
          <div v-if="includeBreak" class="summary-row">
            <span class="summary-label">休憩時間:</span>
            <span class="summary-value">{{ formatMinutesToHours(totalSummary.totalBreakMinutes) }}</span>
          </div>
          <div v-if="includeBreak" class="summary-row total">
            <span class="summary-label">実働時間:</span>
            <span class="summary-value highlight">
              {{ formatMinutesToHours(totalSummary.totalActualWorkMinutes) }}
            </span>
          </div>
        </div>
      </div>

      <!-- アクションボタン -->
      <div class="action-buttons">
        <button @click="handleBack" class="action-btn back-btn">
          戻る
        </button>
        <button @click="handleSubmit" class="action-btn submit-btn">
          提出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import ProgressIndicator from '../components/ProgressIndicator.vue'
import { useTimeRegisterStore } from '../stores/timeRegister'
import { useNavigationStore } from '../stores/navigation'
import { useTimeFormat } from '../composables/useTimeFormat'
import { useTimeCalculation } from '../composables/useTimeCalculation'
import type { WorkDay } from '../types/timeRegister'

const router = useRouter()
const timeRegisterStore = useTimeRegisterStore()
const navigationStore = useNavigationStore()

const { includeBreak, workDays } = storeToRefs(timeRegisterStore)
const { totalSummary } = storeToRefs(timeRegisterStore)

const { formatMinutesToHours } = useTimeFormat()
const { calculateBreakTime } = useTimeCalculation()

// アクティブな勤務日（削除されていない）
const activeWorkDays = computed(() => {
  return workDays.value.filter(wd => !wd.isRemoved)
})

// 勤務時間のフォーマット
const formatWorkTime = (workDay: WorkDay) => {
  if (includeBreak.value) {
    const breakMinutes = calculateBreakTime(workDay.workMinutes)
    const actualMinutes = workDay.workMinutes - breakMinutes
    return `${formatMinutesToHours(actualMinutes)} (休憩: ${formatMinutesToHours(breakMinutes)})`
  }
  return formatMinutesToHours(workDay.workMinutes)
}

// 戻る
const handleBack = () => {
  navigationStore.setBackward()
  router.push('/time-register')
}

// 提出
const handleSubmit = () => {
  // TODO: 提出処理を実装
  alert('提出されました（実装予定）')
  console.log('Submit data:', {
    workDays: activeWorkDays.value,
    summary: totalSummary.value
  })
}
</script>

<style scoped>
.confirm-view {
  min-height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  position: relative;
}

.confirm-container {
  max-width: 800px;
  margin: 0 auto;
}

/* 確認カードリスト */
.confirm-cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.confirm-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.2s ease;
}

.confirm-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.confirm-card.modified {
  background: #fef3c7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.card-date {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
}

.custom-badge {
  padding: 0.25rem 0.75rem;
  background: #f59e0b;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.card-time-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.time-value {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
}

/* 個別設定された時間のみ黄色 */
.time-value.custom-time {
  color: #d97706;
  font-weight: 700;
}

.time-separator {
  font-size: 0.875rem;
  color: #999;
}

.card-hours {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.hours-icon {
  font-size: 1rem;
}

.hours-text {
  font-weight: 600;
}

/* 合計統計 */
.total-summary-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.summary-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #333;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total {
  padding-top: 1rem;
  margin-top: 0.5rem;
  border-top: 2px solid #e0e0e0;
}

.summary-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.summary-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #333;
}

.summary-value.highlight {
  font-size: 1.5rem;
  color: #667eea;
}

/* アクションボタン */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-btn {
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
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

.submit-btn {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .confirm-view {
    padding: 0.5rem;
  }

  .total-summary-section {
    padding: 1rem;
  }
}
</style>
