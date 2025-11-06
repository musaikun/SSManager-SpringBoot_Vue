<template>
  <div class="confirm-view">
    <!-- ヘッダー（固定） -->
    <div class="header-fixed">
      <ProgressIndicator />
    </div>

    <!-- メインコンテンツ（スクロール可能） -->
    <div class="confirm-content">
      <div class="confirm-container">
      <!-- 確認テーブル -->
      <div class="confirm-table-wrapper">
        <table class="confirm-table">
          <thead>
            <tr>
              <th>日付</th>
              <th>時間</th>
              <th>勤務時間</th>
              <th>設定</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(workDay, index) in activeWorkDays"
              :key="workDay.date"
              :class="{ modified: workDay.isModified }"
            >
              <td class="date-cell">{{ workDay.displayDate }}</td>
              <td class="time-cell">
                <span :class="{ 'custom-time': workDay.customStartTime }">{{ workDay.startTime }}</span>
                <span class="separator">〜</span>
                <span :class="{ 'custom-time': workDay.customEndTime }">{{ workDay.endTime }}</span>
              </td>
              <td class="hours-cell">{{ formatWorkTime(workDay) }}</td>
              <td class="status-cell">
                <span v-if="workDay.isModified" class="custom-badge">個別設定</span>
                <span v-else class="default-badge">一括設定</span>
              </td>
            </tr>
          </tbody>
        </table>
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
      </div>
    </div>

    <!-- フッター（固定） -->
    <div class="footer-fixed">
      <div class="footer-buttons">
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
    return `${formatMinutesToHours(actualMinutes)} / 休憩${formatMinutesToHours(breakMinutes)}`
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
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ヘッダー固定 */
.header-fixed {
  flex-shrink: 0;
  padding: 1rem 1rem 0 1rem;
  z-index: 10;
}

/* メインコンテンツ（スクロール可能） */
.confirm-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 1rem;
  min-height: 0;
}

/* フッター固定 */
.footer-fixed {
  flex-shrink: 0;
  padding: 1rem;
  background: transparent;
  z-index: 10;
}

.footer-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  max-width: 900px;
  margin: 0 auto;
}

.confirm-container {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 1rem;
}

/* 確認テーブル */
.confirm-table-wrapper {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.confirm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.confirm-table thead {
  background: #f8f9fa;
}

.confirm-table th {
  padding: 0.875rem;
  text-align: left;
  font-weight: 700;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.confirm-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.confirm-table tbody tr:hover {
  background: #f9f9f9;
}

.confirm-table tbody tr.modified {
  background: #fef3c7;
}

.confirm-table tbody tr.modified:hover {
  background: #fde68a;
}

.confirm-table td {
  padding: 0.75rem 0.875rem;
  color: #333;
}

.date-cell {
  font-weight: 600;
  white-space: nowrap;
}

.time-cell {
  font-weight: 600;
  color: #667eea;
  white-space: nowrap;
}

.time-cell .separator {
  color: #999;
  margin: 0 0.25rem;
}

/* 個別設定された時間のみ黄色 */
.custom-time {
  color: #d97706;
  font-weight: 700;
}

.hours-cell {
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}

.status-cell {
  text-align: center;
}

.custom-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #f59e0b;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.default-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0e0e0;
  color: #666;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
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

.submit-btn {
  background: linear-gradient(135deg, #f97316, #fb923c);
  color: white;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .header-fixed {
    padding: 0.75rem 0.75rem 0 0.75rem;
  }

  .confirm-content {
    padding: 0 0.75rem;
  }

  .footer-fixed {
    padding: 0.75rem;
  }

  .action-btn {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }

  .confirm-table-wrapper {
    padding: 1rem;
  }

  .confirm-table {
    font-size: 0.85rem;
  }

  .confirm-table th,
  .confirm-table td {
    padding: 0.5rem;
  }

  .custom-badge,
  .default-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
  }

  .total-summary-section {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .confirm-table-wrapper {
    padding: 0.75rem;
  }

  .confirm-table {
    font-size: 0.75rem;
  }

  .confirm-table th,
  .confirm-table td {
    padding: 0.4rem;
  }

  .custom-badge,
  .default-badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }
}
</style>
