<template>
  <div class="time-register-view">
    <!-- 進捗インジケーター -->
    <ProgressIndicator />

    <!-- メインコンテンツ -->
    <div class="time-register-container">
      <!-- 一括設定セクション -->
      <div class="bulk-settings-section">
        <div class="section-header">
          <h2>一括設定</h2>
        </div>
        <div class="bulk-settings-content">
          <div class="time-inputs">
            <div class="time-input-group">
              <label>開始時刻</label>
              <input
                type="time"
                v-model="bulkSettings.startTime"
                class="time-input"
              />
            </div>
            <div class="time-input-group">
              <label>終了時刻</label>
              <input
                type="time"
                v-model="bulkSettings.endTime"
                class="time-input"
              />
            </div>
          </div>
          <div class="bulk-actions">
            <button @click="handleBulkApply('both')" class="bulk-btn">
              全日に適用
            </button>
            <button @click="handleBulkApply('start')" class="bulk-btn">
              開始時刻のみ適用
            </button>
            <button @click="handleBulkApply('end')" class="bulk-btn">
              終了時刻のみ適用
            </button>
          </div>
        </div>
      </div>

      <!-- 休憩時間設定 -->
      <div class="break-time-section">
        <label class="break-time-toggle">
          <input
            type="checkbox"
            v-model="includeBreak"
            @change="handleBreakToggle"
          />
          <span>休憩時間を引く</span>
          <button @click="showBreakHelp" class="help-btn">?</button>
        </label>
      </div>

      <!-- 勤務日カードリスト -->
      <div class="work-days-list">
        <div
          v-for="(workDay, index) in activeWorkDays"
          :key="workDay.date"
          class="work-day-card"
          :class="{ removed: workDay.isRemoved, modified: workDay.isModified }"
        >
          <div class="card-header">
            <span class="date-display">{{ workDay.displayDate }}</span>
            <button @click="handleRemoveDay(index)" class="remove-btn">
              {{ workDay.isRemoved ? '復活' : '削除' }}
            </button>
          </div>
          <div class="card-body">
            <div class="time-display">
              <div class="time-item">
                <span class="label">開始</span>
                <button
                  @click="handleTimeClick(index, 'start')"
                  class="time-btn"
                >
                  {{ workDay.startTime }}
                </button>
              </div>
              <div class="time-separator">〜</div>
              <div class="time-item">
                <span class="label">終了</span>
                <button
                  @click="handleTimeClick(index, 'end')"
                  class="time-btn"
                >
                  {{ workDay.endTime }}
                </button>
              </div>
            </div>
            <div class="work-time-display">
              <span class="work-time-label">勤務時間:</span>
              <span class="work-time-value">{{ formatWorkTime(workDay) }}</span>
            </div>
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
        <button @click="handleNext" class="action-btn next-btn">
          次へ
        </button>
      </div>
    </div>

    <!-- 時刻選択モーダル（簡易版） -->
    <div v-if="showTimeModal" class="modal-overlay" @click="cancelTimeEdit">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>時刻設定</h3>
        </div>
        <div class="modal-body">
          <div class="modal-date-info" v-if="currentEditIndex !== null">
            {{ workDays[currentEditIndex].displayDate }}
          </div>
          <div class="modal-time-inputs">
            <div class="modal-time-group">
              <label>開始時刻</label>
              <input
                type="time"
                v-model="tempStartTime"
                class="modal-time-input"
              />
            </div>
            <div class="modal-time-group">
              <label>終了時刻</label>
              <input
                type="time"
                v-model="tempEndTime"
                class="modal-time-input"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="cancelTimeEdit" class="modal-btn cancel-btn">
            キャンセル
          </button>
          <button @click="confirmTimeEdit" class="modal-btn confirm-btn">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import ProgressIndicator from '../components/ProgressIndicator.vue'
import { useCalendarStore } from '../stores/calendar'
import { useTimeRegisterStore } from '../stores/timeRegister'
import { useTimeFormat } from '../composables/useTimeFormat'
import { useTimeCalculation } from '../composables/useTimeCalculation'
import type { BulkApplyType, WorkDay } from '../types/timeRegister'

const router = useRouter()
const calendarStore = useCalendarStore()
const timeRegisterStore = useTimeRegisterStore()

const { bulkSettings, includeBreak, workDays } = storeToRefs(timeRegisterStore)
const { totalSummary } = storeToRefs(timeRegisterStore)

const { formatMinutesToHours } = useTimeFormat()
const { calculateBreakTime } = useTimeCalculation()

// 簡易時刻選択モーダルの状態
const showTimeModal = ref(false)
const currentEditIndex = ref<number | null>(null)
const currentEditType = ref<'start' | 'end'>('start')
const tempStartTime = ref('09:00')
const tempEndTime = ref('18:00')

// アクティブな勤務日（削除されていない）
const activeWorkDays = computed(() => {
  return workDays.value
})

// 初期化
onMounted(() => {
  const selectedDates = calendarStore.selectedDatesArray

  if (selectedDates.length === 0) {
    // 日付が選択されていない場合はカレンダーに戻る
    router.push({ name: 'calendar' })
    return
  }

  // 選択された日付で初期化
  timeRegisterStore.initializeFromDates(selectedDates)
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

// 一括適用
const handleBulkApply = (type: BulkApplyType) => {
  const activeCount = workDays.value.filter(d => !d.isRemoved).length
  let message = ''

  if (type === 'both') {
    message = `全${activeCount}日に\n開始: ${bulkSettings.value.startTime}\n終了: ${bulkSettings.value.endTime}\nを適用しますか？`
  } else if (type === 'start') {
    message = `全${activeCount}日の開始時刻を\n${bulkSettings.value.startTime}に変更しますか？`
  } else if (type === 'end') {
    message = `全${activeCount}日の終了時刻を\n${bulkSettings.value.endTime}に変更しますか？`
  }

  if (confirm(message)) {
    timeRegisterStore.applyBulk(type, 'all')
  }
}

// 休憩時間トグル
const handleBreakToggle = () => {
  timeRegisterStore.toggleBreak()
}

// 休憩時間ヘルプ
const showBreakHelp = () => {
  alert('休憩時間のルール:\n\n6時間未満: 休憩なし\n6時間以上8時間未満: 45分\n8時間以上: 60分')
}

// 日付削除/復活
const handleRemoveDay = (index: number) => {
  timeRegisterStore.toggleRemoveDay(index)
}

// 時刻選択
const handleTimeClick = (index: number, type: 'start' | 'end') => {
  const workDay = workDays.value[index]
  currentEditIndex.value = index
  currentEditType.value = type
  tempStartTime.value = workDay.startTime
  tempEndTime.value = workDay.endTime
  showTimeModal.value = true
}

// 時刻選択モーダルをキャンセル
const cancelTimeEdit = () => {
  showTimeModal.value = false
  currentEditIndex.value = null
}

// 時刻選択モーダルを確定
const confirmTimeEdit = () => {
  if (currentEditIndex.value !== null) {
    timeRegisterStore.updateWorkDay(currentEditIndex.value, {
      startTime: tempStartTime.value,
      endTime: tempEndTime.value
    })
  }
  showTimeModal.value = false
  currentEditIndex.value = null
}

// 戻る
const handleBack = () => {
  router.push({ name: 'calendar' })
}

// 次へ
const handleNext = () => {
  // TODO: 確認画面に遷移
  const activeCount = workDays.value.filter(d => !d.isRemoved).length
  if (activeCount === 0) {
    alert('勤務日が選択されていません')
    return
  }
  console.log('Next to confirmation')
}
</script>

<style scoped>
.time-register-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.time-register-container {
  max-width: 800px;
  margin: 0 auto;
}

/* 一括設定セクション */
.bulk-settings-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.section-header h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #333;
}

.bulk-settings-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-input-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.time-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.bulk-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.bulk-btn {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.bulk-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.bulk-btn:active {
  transform: translateY(0);
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

/* 勤務日カードリスト */
.work-days-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.work-day-card {
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.work-day-card.removed {
  opacity: 0.5;
  background: #f5f5f5;
}

.work-day-card.modified {
  border-left: 4px solid #10b981;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.date-display {
  font-size: 1.125rem;
  font-weight: 700;
  color: #333;
}

.remove-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.work-day-card.removed .remove-btn {
  background: #10b981;
}

.remove-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.time-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.time-item .label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 600;
}

.time-btn {
  padding: 0.75rem;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 700;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.time-btn:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.time-separator {
  font-size: 1.25rem;
  font-weight: 700;
  color: #999;
  margin-top: 1.25rem;
}

.work-time-display {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.work-time-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.work-time-value {
  font-size: 1rem;
  font-weight: 700;
  color: #667eea;
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

.next-btn {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* モーダル */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
  font-weight: 700;
}

.modal-body {
  padding: 1.5rem;
}

.modal-date-info {
  font-size: 1.125rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 1.5rem;
  text-align: center;
}

.modal-time-inputs {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modal-time-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-time-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.modal-time-input {
  padding: 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.modal-time-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-btn {
  padding: 0.875rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .time-register-view {
    padding: 0.5rem;
  }

  .bulk-settings-section,
  .break-time-section,
  .total-summary-section {
    padding: 1rem;
  }

  .time-inputs {
    grid-template-columns: 1fr;
  }

  .bulk-actions {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .time-display {
    flex-direction: column;
    gap: 0.5rem;
  }

  .time-separator {
    transform: rotate(90deg);
    margin: 0;
  }

  .modal-footer {
    grid-template-columns: 1fr;
  }
}
</style>
