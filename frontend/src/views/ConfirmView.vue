<template>
  <div class="confirm-view">
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

      <!-- 備考入力欄 -->
      <div class="remarks-section">
        <label for="remarks" class="remarks-label">備考</label>
        <textarea
          id="remarks"
          v-model="remarks"
          class="remarks-input"
          placeholder="上長への連絡事項や希望休暇の理由など"
          rows="4"
        ></textarea>
      </div>
    </div>

    <!-- 提出方法選択モーダル -->
    <Teleport to="body">
      <div v-if="showSubmitModal" class="modal-overlay" @click="timeRegisterStore.closeSubmitModal()">
        <div class="modal-content submit-modal" @click.stop>
          <h3 class="modal-title">提出方法を選択</h3>
          <div class="submit-methods">
            <button @click="submitViaEmail" class="method-btn email-btn">
              <span class="method-icon">📧</span>
              <span class="method-label">メールで送信</span>
            </button>
            <button @click="submitViaLine" class="method-btn line-btn">
              <span class="method-icon">💬</span>
              <span class="method-label">LINEで送信</span>
            </button>
            <button @click="downloadCSV" class="method-btn csv-btn">
              <span class="method-icon">📊</span>
              <span class="method-label">CSVダウンロード</span>
            </button>
            <button @click="copyToClipboard" class="method-btn copy-btn">
              <span class="method-icon">📋</span>
              <span class="method-label">コピーする</span>
            </button>
          </div>
          <button @click="timeRegisterStore.closeSubmitModal()" class="close-modal-btn">キャンセル</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimeRegisterStore } from '../stores/timeRegister'
import { useTimeFormat } from '../composables/useTimeFormat'
import { useTimeCalculation } from '../composables/useTimeCalculation'
import { useHolidays } from '../composables/useHolidays'
import type { WorkDay } from '../types/timeRegister'

const timeRegisterStore = useTimeRegisterStore()
const { isHoliday } = useHolidays()

const { includeBreak, workDays, showSubmitModal } = storeToRefs(timeRegisterStore)
const { totalSummary } = storeToRefs(timeRegisterStore)

const { formatMinutesToHours } = useTimeFormat()
const { calculateBreakTime } = useTimeCalculation()

// ローカル状態
const remarks = ref<string>('')

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

// シフトデータをLocalStorageに保存
const saveShiftData = () => {
  const shiftData = {
    workDays: activeWorkDays.value,
    totalSummary: totalSummary.value,
    remarks: remarks.value,
    submittedAt: new Date().toISOString()
  }

  // LocalStorageに保存
  const savedShifts = JSON.parse(localStorage.getItem('savedShifts') || '[]')
  savedShifts.push(shiftData)
  localStorage.setItem('savedShifts', JSON.stringify(savedShifts))
}

// シフトデータをテキスト形式で生成
const generateShiftText = (): string => {
  let text = '【シフト提出】\n\n'

  activeWorkDays.value.forEach(day => {
    const breakMinutes = calculateBreakTime(day.workMinutes)
    const actualMinutes = day.workMinutes - breakMinutes
    const actualHours = formatMinutesToHours(actualMinutes)
    text += `${day.displayDate}: ${day.startTime}〜${day.endTime} (${actualHours})\n`
  })

  text += `\n【合計】\n`
  text += `勤務日数: ${totalSummary.value.workDays}日\n`
  text += `総勤務時間: ${formatMinutesToHours(totalSummary.value.totalWorkMinutes)}\n`
  if (includeBreak.value) {
    text += `実働時間: ${formatMinutesToHours(totalSummary.value.totalActualWorkMinutes)}\n`
  }

  if (remarks.value.trim()) {
    text += `\n【備考】\n${remarks.value}\n`
  }

  return text
}

// メール送信
const submitViaEmail = () => {
  const subject = encodeURIComponent('シフト提出')
  const body = encodeURIComponent(generateShiftText())
  window.location.href = `mailto:?subject=${subject}&body=${body}`
  saveShiftData()
  timeRegisterStore.closeSubmitModal()
}

// LINE送信
const submitViaLine = () => {
  const text = encodeURIComponent(generateShiftText())
  window.open(`https://line.me/R/share?text=${text}`, '_blank')
  saveShiftData()
  timeRegisterStore.closeSubmitModal()
}

// CSVダウンロード
const downloadCSV = () => {
  let csv = '日付,開始時刻,終了時刻,勤務時間,実働時間,設定\n'

  activeWorkDays.value.forEach(day => {
    const breakMinutes = calculateBreakTime(day.workMinutes)
    const actualMinutes = day.workMinutes - breakMinutes
    const status = day.isModified ? '個別設定' : day.isBulkApplied ? '一括設定' : '初期設定'
    csv += `${day.displayDate},${day.startTime},${day.endTime},${formatMinutesToHours(day.workMinutes)},${formatMinutesToHours(actualMinutes)},${status}\n`
  })

  csv += `\n合計\n`
  csv += `勤務日数,${totalSummary.value.workDays}日\n`
  csv += `総勤務時間,${formatMinutesToHours(totalSummary.value.totalWorkMinutes)}\n`
  csv += `実働時間,${formatMinutesToHours(totalSummary.value.totalActualWorkMinutes)}\n`

  if (remarks.value.trim()) {
    csv += `\n備考\n${remarks.value}\n`
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `shift_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  saveShiftData()
  timeRegisterStore.closeSubmitModal()
}

// クリップボードにコピー
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generateShiftText())
    saveShiftData()
    timeRegisterStore.closeSubmitModal()
  } catch (err) {
    console.error('クリップボードへのコピーに失敗:', err)
  }
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

/* 備考入力欄 */
.remarks-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.remarks-label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.remarks-input {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.remarks-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.remarks-input::placeholder {
  color: #999;
}

/* モーダル */
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
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #333;
  text-align: center;
}

.submit-methods {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.method-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.method-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.method-icon {
  font-size: 2rem;
}

.method-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.close-modal-btn {
  width: 100%;
  padding: 0.875rem;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-modal-btn:hover {
  background: #e0e0e0;
}
</style>
