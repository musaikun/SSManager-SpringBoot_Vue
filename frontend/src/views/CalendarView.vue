<template>
  <div class="calendar-view">
    <!-- ヘッダー -->
    <header class="calendar-header">
      <button @click="goToToday" class="today-btn">今月</button>
      <button @click="previousMonth" class="nav-btn">‹</button>
      <h1 class="current-month">{{ currentMonthInfo.displayText }}</h1>
      <button @click="nextMonth" class="nav-btn">›</button>
    </header>

    <!-- ツールバー -->
    <div class="calendar-toolbar">
      <div class="weekday-buttons">
        <button
          v-for="(day, index) in weekdays"
          :key="index"
          @click="selectByWeekday(index)"
          class="weekday-btn"
          :class="{ weekend: index === 0 || index === 6 }"
        >
          {{ day }}
        </button>
      </div>
      <div class="action-buttons">
        <button @click="selectAll" class="action-btn">全選択</button>
        <button @click="clearAll" class="action-btn">クリア</button>
        <button @click="loadTemplate" class="action-btn">テンプレート読込</button>
        <button @click="showSaveTemplateDialog" class="action-btn">テンプレート保存</button>
      </div>
    </div>

    <!-- カレンダー本体 -->
    <div class="calendar-grid">
      <!-- 曜日ヘッダー -->
      <div class="calendar-weekdays">
        <div
          v-for="(day, index) in weekdays"
          :key="index"
          class="weekday-header"
          :class="{ weekend: index === 0 || index === 6 }"
        >
          {{ day }}
        </div>
      </div>

      <!-- 日付セル -->
      <div class="calendar-dates">
        <div
          v-for="cell in calendarCells"
          :key="cell.dateString"
          class="date-cell"
          :class="{
            'other-month': !cell.isCurrentMonth,
            'today': cell.isToday,
            'holiday': cell.isHoliday,
            'saturday': cell.dayOfWeek === 6,
            'sunday': cell.dayOfWeek === 0,
            'selected': cell.isSelected
          }"
          @click="handleDateClick(cell)"
        >
          <div class="date-number">{{ cell.date.getDate() }}</div>
          <div v-if="cell.isHoliday" class="holiday-name">{{ cell.holidayName }}</div>
        </div>
      </div>
    </div>

    <!-- 選択済みリスト -->
    <div v-if="selectedCount > 0" class="selected-list">
      <h3>選択済み: {{ selectedCount }}日</h3>
      <div class="selected-dates">
        <span
          v-for="dateStr in selectedDates.slice(0, 10)"
          :key="dateStr"
          class="selected-date-chip"
        >
          {{ formatDisplayShort(dateStr) }}
        </span>
        <span v-if="selectedCount > 10">... 他{{ selectedCount - 10 }}日</span>
      </div>
    </div>

    <!-- 次へボタン -->
    <div class="footer">
      <button
        @click="navigateToTimeRegister"
        class="next-btn"
        :disabled="selectedCount === 0"
      >
        次へ（時間登録）
      </button>
    </div>

    <!-- テンプレート保存ダイアログ（簡易版） -->
    <div v-if="showTemplateDialog" class="dialog-overlay" @click="hideTemplateDialog">
      <div class="dialog" @click.stop>
        <h3>テンプレート保存</h3>
        <input v-model="templateName" placeholder="テンプレート名" />
        <div class="dialog-actions">
          <button @click="saveTemplateConfirm">保存</button>
          <button @click="hideTemplateDialog">キャンセル</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCalendar } from '../composables/useCalendar'
import { useHolidays } from '../composables/useHolidays'
import { useCalendarStore } from '../stores/calendar'
import { formatDisplayDate } from '../utils/dateUtils'
import type { CalendarCell } from '../types/calendar'

const router = useRouter()
const store = useCalendarStore()

// Composables
const {
  calendarCells,
  currentMonthInfo,
  selectedDates,
  selectedCount,
  toggleDate,
  selectAll,
  clearAll,
  selectByWeekday,
  goToToday,
  previousMonth,
  nextMonth,
  saveTemplate,
  loadTemplate
} = useCalendar()

const { fetchHolidaysWithCache } = useHolidays()

// ローカル状態
const weekdays = ['日', '月', '火', '水', '木', '金', '土']
const showTemplateDialog = ref(false)
const templateName = ref('')

// 初期化
onMounted(async () => {
  // 祝日データを取得してストアに保存
  await fetchHolidaysWithCache()
  const holidays = useHolidays().holidays.value
  store.setHolidays(holidays)
})

// イベントハンドラ
const handleDateClick = (cell: CalendarCell) => {
  if (!cell.isCurrentMonth) return
  toggleDate(cell.dateString)
}

const formatDisplayShort = (dateStr: string) => {
  const date = new Date(dateStr)
  return formatDisplayDate(date)
}

const showSaveTemplateDialog = () => {
  if (selectedCount.value === 0) {
    alert('選択された日付がありません')
    return
  }
  showTemplateDialog.value = true
}

const hideTemplateDialog = () => {
  showTemplateDialog.value = false
  templateName.value = ''
}

const saveTemplateConfirm = () => {
  if (!templateName.value.trim()) {
    alert('テンプレート名を入力してください')
    return
  }
  saveTemplate(templateName.value)
  hideTemplateDialog()
  alert('テンプレートを保存しました')
}

const navigateToTimeRegister = () => {
  if (selectedCount.value === 0) return
  router.push('/time-register')
}
</script>

<style scoped>
.calendar-view {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #1b1b15, #2f3a2a);
  color: white;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
}

/* ヘッダー */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.current-month {
  font-size: 2rem;
  font-weight: 700;
  min-width: 200px;
  text-align: center;
}

.today-btn, .nav-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.today-btn:hover, .nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-btn {
  font-size: 1.5rem;
  padding: 0.5rem 1.25rem;
}

/* ツールバー */
.calendar-toolbar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.weekday-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.weekday-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #6f3ad0, #a36bff);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.weekday-btn.weekend {
  background: linear-gradient(135deg, #d03a6f, #ff6ba3);
}

.weekday-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(111, 58, 208, 0.4);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* カレンダー */
.calendar-grid {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
  margin-bottom: 2rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.weekday-header {
  text-align: center;
  padding: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.weekday-header.weekend {
  color: #ff6ba3;
}

.calendar-dates {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.date-cell {
  aspect-ratio: 1;
  padding: 0.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.date-cell:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.date-cell.other-month {
  opacity: 0.3;
  cursor: not-allowed;
}

.date-cell.other-month:hover {
  transform: none;
}

.date-cell.today {
  border: 2px solid #42b883;
}

.date-cell.selected {
  background: linear-gradient(135deg, #6f3ad0, #a36bff);
  color: white;
  font-weight: 700;
}

.date-cell.holiday:not(.selected) {
  background: rgba(255, 107, 163, 0.2);
}

.date-cell.saturday:not(.selected):not(.holiday) {
  color: #6ba3ff;
}

.date-cell.sunday:not(.selected):not(.holiday) {
  color: #ff6ba3;
}

.date-number {
  font-size: 1.125rem;
  font-weight: 600;
}

.holiday-name {
  font-size: 0.625rem;
  margin-top: 0.25rem;
  text-align: center;
  line-height: 1.2;
}

/* 選択済みリスト */
.selected-list {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.selected-list h3 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.selected-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-date-chip {
  padding: 0.375rem 0.75rem;
  background: rgba(111, 58, 208, 0.3);
  border-radius: 16px;
  font-size: 0.875rem;
}

/* フッター */
.footer {
  display: flex;
  justify-content: center;
}

.next-btn {
  padding: 1rem 3rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #6f3ad0, #a36bff);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.next-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(111, 58, 208, 0.6);
}

.next-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
  opacity: 0.5;
}

/* ダイアログ */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  width: min(400px, 90vw);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dialog h3 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.dialog input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.dialog input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.dialog-actions {
  display: flex;
  gap: 1rem;
}

.dialog-actions button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dialog-actions button:first-child {
  background: linear-gradient(135deg, #6f3ad0, #a36bff);
  color: white;
}

.dialog-actions button:last-child {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.dialog-actions button:hover {
  transform: translateY(-2px);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .calendar-view {
    padding: 1rem;
  }

  .current-month {
    font-size: 1.5rem;
    min-width: 150px;
  }

  .date-number {
    font-size: 1rem;
  }

  .holiday-name {
    font-size: 0.5rem;
  }
}
</style>
