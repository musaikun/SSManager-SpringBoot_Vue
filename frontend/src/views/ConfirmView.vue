<template>
  <div class="confirm-view">
    <div class="confirm-container">
      <!-- 休憩時間設定 -->
      <div class="break-time-section">
        <label class="break-time-toggle">
          <input
            type="checkbox"
            :checked="includeBreak"
            @change="handleBreakToggle"
          />
          <span>休憩時間を引く</span>
          <button @click="showBreakHelp" class="help-btn">?</button>
        </label>
      </div>

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
              <td class="date-cell" :class="{
                'saturday': workDay.dayOfWeek === 6,
                'sunday': workDay.dayOfWeek === 0,
                'holiday': isHoliday(workDay.date)
              }">{{ workDay.displayDate }}</td>
              <td class="time-cell">
                <span :class="{
                  'custom-time': workDay.customStartTime,
                  'bulk-time': workDay.isBulkApplied && !workDay.customStartTime && workDay.startTime !== workDay.initialStartTime
                }">{{ workDay.startTime }}</span>
                <span class="separator">〜</span>
                <span :class="{
                  'custom-time': workDay.customEndTime,
                  'bulk-time': workDay.isBulkApplied && !workDay.customEndTime && workDay.endTime !== workDay.initialEndTime
                }">{{ workDay.endTime }}</span>
              </td>
              <td class="hours-cell">
                <div v-html="formatWorkTime(workDay)"></div>
              </td>
              <td class="status-cell">
                <span v-if="workDay.isModified" class="custom-badge">個別設定</span>
                <span v-else-if="workDay.isBulkApplied" class="bulk-badge">一括設定</span>
                <span v-else class="initial-badge">初期設定</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 合計統計 -->
      <div class="total-summary-section">
        <div class="summary-compact">
          <div class="summary-item">
            <span class="summary-label">勤務日数</span>
            <span class="summary-value">{{ totalSummary.workDays }}日</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-item">
            <span class="summary-label">総勤務時間</span>
            <span class="summary-value">{{ formatMinutesToHours(totalSummary.totalWorkMinutes) }}</span>
          </div>
          <div v-if="includeBreak" class="summary-divider"></div>
          <div v-if="includeBreak" class="summary-item">
            <span class="summary-label">実働時間</span>
            <span class="summary-value highlight">{{ formatMinutesToHours(totalSummary.totalActualWorkMinutes) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ヘルプモーダル（Teleportでbody直下に配置） -->
    <Teleport to="body">
      <div v-if="showHelpModal" class="modal-overlay" @click="showHelpModal = false" @touchmove.prevent>
        <div class="modal-content help-modal" @click.stop>
          <h3 class="modal-title">休憩時間のルール</h3>
          <div class="help-content">
            <div class="help-row">
              <span class="help-label">6時間未満:</span>
              <span class="help-value">休憩なし</span>
            </div>
            <div class="help-row">
              <span class="help-label">6時間以上8時間未満:</span>
              <span class="help-value">45分</span>
            </div>
            <div class="help-row">
              <span class="help-label">8時間以上:</span>
              <span class="help-value">60分</span>
            </div>
            <div class="help-note">
              ※ 労働基準法 第34条の要点（休憩の原則）を参考にしています。
            </div>
          </div>
          <button @click="showHelpModal = false" class="close-btn">閉じる</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimeRegisterStore } from '../stores/timeRegister'
import { useTimeFormat } from '../composables/useTimeFormat'
import { useTimeCalculation } from '../composables/useTimeCalculation'
import { useHolidays } from '../composables/useHolidays'
import type { WorkDay } from '../types/timeRegister'

const timeRegisterStore = useTimeRegisterStore()
const { isHoliday } = useHolidays()

const { includeBreak, workDays } = storeToRefs(timeRegisterStore)
const { totalSummary } = storeToRefs(timeRegisterStore)

const { formatMinutesToHours } = useTimeFormat()
const { calculateBreakTime } = useTimeCalculation()

// ヘルプモーダルの状態
const showHelpModal = ref(false)

// アクティブな勤務日（削除されていない）
const activeWorkDays = computed(() => {
  return workDays.value.filter(wd => !wd.isRemoved)
})

// 勤務時間のフォーマット
const formatWorkTime = (workDay: WorkDay) => {
  if (includeBreak.value) {
    const breakMinutes = calculateBreakTime(workDay.workMinutes)
    const actualMinutes = workDay.workMinutes - breakMinutes
    return `${formatMinutesToHours(actualMinutes)}<br>休憩${breakMinutes}分`
  }
  return formatMinutesToHours(workDay.workMinutes)
}

// 休憩時間トグル
const handleBreakToggle = () => {
  timeRegisterStore.toggleBreak()
}

// 休憩時間ヘルプ
const showBreakHelp = () => {
  showHelpModal.value = true
}
</script>

<style scoped>
.confirm-view {
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.confirm-container {
  max-width: 900px;
  margin: 0 auto;
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
  font-size: 0.85rem;
  table-layout: fixed;
}

.confirm-table thead {
  background: #f8f9fa;
}

.confirm-table th {
  padding: 0.875rem 0.5rem;
  text-align: left;
  font-weight: 700;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.confirm-table th:nth-child(1) {
  width: 20%;
}

.confirm-table th:nth-child(2) {
  width: 30%;
}

.confirm-table th:nth-child(3) {
  width: 32%;
}

.confirm-table th:nth-child(4) {
  width: 18%;
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
  padding: 0.75rem 0.5rem;
  color: #333;
}

.date-cell {
  font-weight: 600;
  white-space: nowrap;
}

.date-cell.saturday {
  color: #2563eb;
}

.date-cell.sunday,
.date-cell.holiday {
  color: #ef4444;
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

/* 一括設定された時間のみ青色 */
.bulk-time {
  color: #2563eb;
  font-weight: 700;
}

.hours-cell {
  font-weight: 600;
  color: #666;
  font-size: 0.8rem;
  line-height: 1.3;
}

.status-cell {
  text-align: center;
  padding-left: 0.25rem !important;
  padding-right: 0.25rem !important;
}

.initial-badge {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background: #9ca3af;
  color: white;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 700;
  white-space: nowrap;
}

.bulk-badge {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background: #3b82f6;
  color: white;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 700;
  white-space: nowrap;
}

.custom-badge {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background: #f59e0b;
  color: white;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 700;
  white-space: nowrap;
}

/* 合計統計 */
.total-summary-section {
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.summary-compact {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
}

.summary-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #333;
}

.summary-value.highlight {
  font-size: 1.05rem;
  color: #667eea;
}

.summary-divider {
  width: 1px;
  height: 2.5rem;
  background: #e0e0e0;
}

/* 休憩時間設定 */
.break-time-section {
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.break-time-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.break-time-toggle input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.help-btn {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  border: none;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.help-btn:hover {
  background: #764ba2;
  transform: scale(1.1);
}

/* モーダル共通 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
  max-height: 80vh;
  overflow-y: auto;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ヘルプモーダル */
.help-modal {
  max-width: 400px;
  width: 100%;
}

.modal-title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #667eea;
  text-align: center;
}

.help-content {
  margin-bottom: 1.5rem;
}

.help-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.help-row:last-child {
  border-bottom: none;
}

.help-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.help-value {
  font-size: 1rem;
  font-weight: 700;
  color: #667eea;
}

.help-note {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f0f4ff;
  border-left: 3px solid #667eea;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #555;
  line-height: 1.5;
}

.close-btn {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .confirm-view {
    padding: 0.75rem;
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

  .initial-badge,
  .bulk-badge,
  .custom-badge {
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

  .initial-badge,
  .bulk-badge,
  .custom-badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }
}
</style>
