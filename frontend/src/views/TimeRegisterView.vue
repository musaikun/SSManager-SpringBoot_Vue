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
          <div class="bulk-time-settings">
            <div class="bulk-time-item">
              <button @click="openBulkTimeModal('start')" class="bulk-time-btn">
                開始時刻設定
              </button>
              <div class="bulk-time-display">{{ bulkSettings.startTime }}</div>
            </div>
            <div class="bulk-time-item">
              <button @click="openBulkTimeModal('end')" class="bulk-time-btn">
                終了時刻設定
              </button>
              <div class="bulk-time-display">{{ bulkSettings.endTime }}</div>
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
          @click="handleTimeClick(index, 'both')"
        >
          <div class="card-content-horizontal">
            <div class="card-date">{{ workDay.displayDate }}</div>
            <div class="card-time-section">
              <span class="time-value">{{ workDay.startTime }}</span>
              <span class="time-separator">〜</span>
              <span class="time-value">{{ workDay.endTime }}</span>
            </div>
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
        <button @click="handleNext" class="action-btn next-btn">
          次へ
        </button>
      </div>
    </div>

    <!-- 時刻選択モーダル -->
    <div v-if="showTimeModal" class="modal-overlay" @click="cancelTimeEdit">
      <div class="modal-content time-picker-modal" @click.stop>
        <div class="modal-header-row">
          <!-- 一括設定モードのヘッダー -->
          <h3 class="modal-title" v-if="isBulkMode">
            {{ bulkTimeType === 'start' ? '開始時刻設定' : '終了時刻設定' }}
          </h3>
          <!-- 個別設定モードのヘッダー -->
          <h3 class="modal-title" v-else-if="currentEditIndex !== null && workDays[currentEditIndex]">
            {{ workDays[currentEditIndex].displayDate }}
          </h3>

          <!-- シフトを外すボタン（個別設定のみ） -->
          <button @click="handleRemoveFromModal" class="remove-shift-btn" v-if="!isBulkMode && currentEditIndex !== null && workDays[currentEditIndex]">
            {{ workDays[currentEditIndex].isRemoved ? 'シフトを戻す' : 'シフトを外す' }}
          </button>
        </div>

        <!-- 開始時間 -->
        <div class="modal-section" v-if="!isBulkMode || bulkTimeType === 'start'">
          <div class="modal-section-header">
            <label class="modal-label">開始時間</label>
            <div class="toggle-switch">
              <input type="checkbox" id="startPeriodToggle" v-model="startPm" class="toggle-input">
              <label for="startPeriodToggle" class="toggle-label">
                <span class="toggle-text-am">午前</span>
                <span class="toggle-text-pm">午後</span>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- 時間選択（24時間制：午前0-11、午後12-23） -->
          <div class="hour-selector-row">
            <button
              v-for="hour in startHourButtons.slice(0, 6)"
              :key="'start-' + hour"
              class="hour-btn"
              :class="{ active: selectedStartHour === hour }"
              @click="selectStartHour(hour)"
            >
              {{ hour }}
            </button>
          </div>
          <div class="hour-selector-row">
            <button
              v-for="hour in startHourButtons.slice(6, 12)"
              :key="'start-' + hour"
              class="hour-btn"
              :class="{ active: selectedStartHour === hour }"
              @click="selectStartHour(hour)"
            >
              {{ hour }}
            </button>
          </div>

          <!-- 分選択 -->
          <div class="minute-selector-row">
            <button
              v-for="minute in [0, 15, 30, 45]"
              :key="'start-min-' + minute"
              class="minute-btn"
              :class="{ active: selectedStartMinute === minute }"
              @click="selectStartMinute(minute)"
            >
              {{ String(minute).padStart(2, '0') }}
            </button>
          </div>

          <div class="time-preview">選択: <span>{{ formattedStartTime }}</span></div>
        </div>

        <!-- 終了時間 -->
        <div class="modal-section" v-if="!isBulkMode || bulkTimeType === 'end'">
          <div class="modal-section-header">
            <label class="modal-label">終了時間</label>
            <div class="toggle-switch">
              <input type="checkbox" id="endPeriodToggle" v-model="endPm" class="toggle-input">
              <label for="endPeriodToggle" class="toggle-label">
                <span class="toggle-text-am">午前</span>
                <span class="toggle-text-pm">午後</span>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- 時間選択（24時間制：午前0-11、午後12-23） -->
          <div class="hour-selector-row">
            <button
              v-for="hour in endHourButtons.slice(0, 6)"
              :key="'end-' + hour"
              class="hour-btn"
              :class="{ active: selectedEndHour === hour }"
              @click="selectEndHour(hour)"
            >
              {{ hour }}
            </button>
          </div>
          <div class="hour-selector-row">
            <button
              v-for="hour in endHourButtons.slice(6, 12)"
              :key="'end-' + hour"
              class="hour-btn"
              :class="{ active: selectedEndHour === hour }"
              @click="selectEndHour(hour)"
            >
              {{ hour }}
            </button>
          </div>

          <!-- 分選択 -->
          <div class="minute-selector-row">
            <button
              v-for="minute in [0, 15, 30, 45]"
              :key="'end-min-' + minute"
              class="minute-btn"
              :class="{ active: selectedEndMinute === minute }"
              @click="selectEndMinute(minute)"
            >
              {{ String(minute).padStart(2, '0') }}
            </button>
          </div>

          <div class="time-preview">選択: <span>{{ formattedEndTime }}</span></div>
        </div>

        <div class="modal-work-hours" v-if="!isBulkMode">
          勤務時間: <span>{{ calculatedWorkHours }}</span>
        </div>

        <div class="modal-buttons">
          <button @click="cancelTimeEdit" class="btn-modal btn-secondary-modal">キャンセル</button>
          <button @click="confirmTimeEdit" class="btn-modal btn-primary-modal">設定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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

// 時刻選択モーダルの状態（24時間制）
const showTimeModal = ref(false)
const currentEditIndex = ref<number | null>(null)
const isBulkMode = ref(false) // 一括設定モードかどうか
const bulkTimeType = ref<'start' | 'end'>('start') // 一括設定の種類（開始 or 終了）
const startPm = ref(false) // 午前=false（0-11）, 午後=true（12-23）
const endPm = ref(true)
const selectedStartHour = ref(9) // 0-23の範囲
const selectedStartMinute = ref(0) // 0, 15, 30, 45
const selectedEndHour = ref(18) // 0-23の範囲
const selectedEndMinute = ref(0) // 0, 15, 30, 45

// アクティブな勤務日（削除されていない）
const activeWorkDays = computed(() => {
  return workDays.value
})

// 開始時間ボタン配列（午前: 0-11、午後: 12-23）
const startHourButtons = computed(() => {
  if (startPm.value) {
    return [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  } else {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  }
})

// 終了時間ボタン配列（午前: 0-11、午後: 12-23）
const endHourButtons = computed(() => {
  if (endPm.value) {
    return [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  } else {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  }
})

// 選択された開始時刻をフォーマット（24時間制なのでそのまま）
const formattedStartTime = computed(() => {
  return `${String(selectedStartHour.value).padStart(2, '0')}:${String(selectedStartMinute.value).padStart(2, '0')}`
})

// 選択された終了時刻をフォーマット（24時間制なのでそのまま）
const formattedEndTime = computed(() => {
  return `${String(selectedEndHour.value).padStart(2, '0')}:${String(selectedEndMinute.value).padStart(2, '0')}`
})

// 計算された勤務時間
const calculatedWorkHours = computed(() => {
  const { calculateWorkMinutes } = useTimeCalculation()
  const minutes = calculateWorkMinutes(formattedStartTime.value, formattedEndTime.value)
  return formatMinutesToHours(minutes)
})

// 午前/午後トグル切替時の時間調整
watch(startPm, (isPm) => {
  // 午前（0-11）と午後（12-23）の範囲をチェック
  if (isPm && selectedStartHour.value < 12) {
    selectedStartHour.value = selectedStartHour.value + 12
  } else if (!isPm && selectedStartHour.value >= 12) {
    selectedStartHour.value = selectedStartHour.value - 12
  }
})

watch(endPm, (isPm) => {
  // 午前（0-11）と午後（12-23）の範囲をチェック
  if (isPm && selectedEndHour.value < 12) {
    selectedEndHour.value = selectedEndHour.value + 12
  } else if (!isPm && selectedEndHour.value >= 12) {
    selectedEndHour.value = selectedEndHour.value - 12
  }
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

// 開始時間の選択
const selectStartHour = (hour: number) => {
  selectedStartHour.value = hour
  // 時間に応じて午前/午後トグルを自動設定
  startPm.value = hour >= 12
}

// 終了時間の選択
const selectEndHour = (hour: number) => {
  selectedEndHour.value = hour
  // 時間に応じて午前/午後トグルを自動設定
  endPm.value = hour >= 12
}

// 開始時間の分選択
const selectStartMinute = (minute: number) => {
  selectedStartMinute.value = minute
}

// 終了時間の分選択
const selectEndMinute = (minute: number) => {
  selectedEndMinute.value = minute
}

// 一括設定用のモーダルを開く
const openBulkTimeModal = (type: 'start' | 'end') => {
  isBulkMode.value = true
  bulkTimeType.value = type

  // 一括設定の現在値をパース
  const timeStr = type === 'start' ? bulkSettings.value.startTime : bulkSettings.value.endTime
  const [hourStr, minStr] = timeStr.split(':').map(Number)

  if (type === 'start') {
    selectedStartHour.value = hourStr
    selectedStartMinute.value = minStr
    startPm.value = hourStr >= 12
  } else {
    selectedEndHour.value = hourStr
    selectedEndMinute.value = minStr
    endPm.value = hourStr >= 12
  }

  showTimeModal.value = true
}

// 時刻選択モーダルを開く（個別設定用）
const handleTimeClick = (index: number, type: string) => {
  if (!workDays.value[index]) return // undefinedチェック

  isBulkMode.value = false
  const workDay = workDays.value[index]
  currentEditIndex.value = index

  // 開始時刻のパース（24時間制なのでシンプル）
  const [startHourStr, startMinStr] = workDay.startTime.split(':').map(Number)
  selectedStartHour.value = startHourStr
  selectedStartMinute.value = startMinStr
  startPm.value = startHourStr >= 12

  // 終了時刻のパース（24時間制なのでシンプル）
  const [endHourStr, endMinStr] = workDay.endTime.split(':').map(Number)
  selectedEndHour.value = endHourStr
  selectedEndMinute.value = endMinStr
  endPm.value = endHourStr >= 12

  showTimeModal.value = true
}

// 時刻選択モーダルをキャンセル
const cancelTimeEdit = () => {
  showTimeModal.value = false
  currentEditIndex.value = null
  isBulkMode.value = false
}

// 時刻選択モーダルを確定
const confirmTimeEdit = () => {
  if (isBulkMode.value) {
    // 一括設定モードの場合
    if (bulkTimeType.value === 'start') {
      bulkSettings.value.startTime = formattedStartTime.value
    } else {
      bulkSettings.value.endTime = formattedEndTime.value
    }
  } else {
    // 個別設定モードの場合
    if (currentEditIndex.value !== null) {
      timeRegisterStore.updateWorkDay(currentEditIndex.value, {
        startTime: formattedStartTime.value,
        endTime: formattedEndTime.value
      })
    }
  }
  showTimeModal.value = false
  currentEditIndex.value = null
  isBulkMode.value = false
}

// モーダルからシフトを外す
const handleRemoveFromModal = () => {
  if (currentEditIndex.value !== null) {
    timeRegisterStore.toggleRemoveDay(currentEditIndex.value)
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

.bulk-time-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.bulk-time-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bulk-time-btn {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.bulk-time-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.bulk-time-display {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
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
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.work-day-card {
  background: white;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.work-day-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border-left-color: #667eea;
}

.work-day-card.removed {
  opacity: 0.5;
  background: #f5f5f5;
}

.work-day-card.modified {
  border-left-color: #fbbf24;
  background: #fffbeb;
}

.card-content-horizontal {
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

.card-time-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-value {
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
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

.next-btn {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* 時刻選択モーダル */
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
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
}

.time-picker-modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
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

.modal-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #667eea;
}

/* シフトを外すボタン */
.remove-shift-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: #fee;
  color: #ef4444;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-shift-btn:hover {
  background: #fdd;
  transform: translateY(-1px);
}

.modal-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.modal-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #333;
}

/* トグルスイッチ */
.toggle-switch {
  position: relative;
  display: inline-block;
}

.toggle-input {
  display: none;
}

.toggle-label {
  display: flex;
  align-items: center;
  background: #e0e0e0;
  border-radius: 20px;
  padding: 2px;
  cursor: pointer;
  position: relative;
  width: 100px;
  height: 32px;
}

.toggle-text-am,
.toggle-text-pm {
  flex: 1;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 2;
  transition: color 0.3s ease;
  color: #666;
}

.toggle-input:checked ~ .toggle-label .toggle-text-am {
  color: #666;
}

.toggle-input:checked ~ .toggle-label .toggle-text-pm {
  color: white;
}

.toggle-input:not(:checked) ~ .toggle-label .toggle-text-am {
  color: white;
}

.toggle-input:not(:checked) ~ .toggle-label .toggle-text-pm {
  color: #666;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 48px;
  height: 28px;
  background: #ff9800; /* 午前時はオレンジ */
  border-radius: 18px;
  transition: all 0.3s ease;
}

.toggle-input:checked ~ .toggle-label .toggle-slider {
  transform: translateX(48px);
  background: #2196F3; /* 午後時は青 */
}

/* 時間選択ボタン */
.hour-selector-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  min-width: 0; /* グリッドアイテムが縮小できるように */
}

.hour-btn {
  padding: 0.75rem 0.25rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
  overflow: hidden;
}

.hour-btn:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.hour-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transform: scale(1.05);
}

/* 分選択ボタン */
.minute-selector-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  min-width: 0;
}

.minute-btn {
  padding: 0.75rem 0.25rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
  overflow: hidden;
}

.minute-btn:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.minute-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transform: scale(1.05);
}

.time-preview {
  font-size: 0.875rem;
  color: #666;
  text-align: center;
}

.time-preview span {
  font-weight: 700;
  color: #667eea;
  font-size: 1rem;
}

/* 勤務時間表示 */
.modal-work-hours {
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.modal-work-hours span {
  font-size: 1.125rem;
  font-weight: 700;
  color: #667eea;
}

/* モーダルボタン */
.modal-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;
}

.btn-modal {
  padding: 0.875rem 0.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 0;
}

.btn-primary-modal {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary-modal:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary-modal {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary-modal:hover {
  background: #e0e0e0;
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

  .bulk-time-settings {
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
  .time-picker-modal {
    padding: 1rem;
  }

  .hour-btn,
  .minute-btn {
    font-size: 0.75rem;
    padding: 0.5rem 0.15rem;
  }

  .btn-modal {
    font-size: 0.875rem;
    padding: 0.75rem 0.25rem;
  }
}
</style>
