<template>
  <div class="calendar-view">
    <!-- ヘッダー -->
    <header class="calendar-header">
      <button @click="setThisMonth" class="month-btn" :class="{ active: isThisMonth }">
        今月
      </button>
      <button @click="setNextMonth" class="month-btn" :class="{ active: isNextMonth }">
        来月
      </button>
      <h1 class="current-month">{{ currentMonthInfo.displayText }}</h1>
    </header>

    <!-- ツールバー -->
    <div class="calendar-toolbar">
      <button
        v-for="(day, index) in weekdays"
        :key="index"
        @click="selectByWeekday(index)"
        class="weekday-btn"
      >
        {{ day }}
      </button>
      <button @click="selectAll" class="action-btn">全選択</button>
      <button @click="clearAll" class="action-btn">クリア</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCalendar } from '../composables/useCalendar'
import { useHolidays } from '../composables/useHolidays'
import { useCalendarStore } from '../stores/calendar'
import type { CalendarCell } from '../types/calendar'

const router = useRouter()
const store = useCalendarStore()

// 今月と来月の情報
const today = new Date()
const thisMonth = { year: today.getFullYear(), month: today.getMonth() }
const nextMonthDate = new Date(thisMonth.year, thisMonth.month + 1, 1)
const nextMonth = { year: nextMonthDate.getFullYear(), month: nextMonthDate.getMonth() }

// Composables
const {
  calendarCells,
  currentMonthInfo,
  selectedCount,
  toggleDate,
  selectAll,
  clearAll,
  selectByWeekday,
  setMonth
} = useCalendar()

const { fetchHolidaysWithCache } = useHolidays()

// ローカル状態
const weekdays = ['日', '月', '火', '水', '木', '金', '土']

// 今月・来月の判定
const isThisMonth = computed(() => {
  return store.currentYear === thisMonth.year && store.currentMonth === thisMonth.month
})

const isNextMonth = computed(() => {
  return store.currentYear === nextMonth.year && store.currentMonth === nextMonth.month
})

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

const setThisMonth = () => {
  setMonth(thisMonth.year, thisMonth.month)
}

const setNextMonth = () => {
  setMonth(nextMonth.year, nextMonth.month)
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
  background: linear-gradient(135deg, #1e3a5f, #2d5a7b, #4a7c9e);
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
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.current-month {
  font-size: 2rem;
  font-weight: 700;
  min-width: 200px;
  text-align: center;
}

.month-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.month-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.month-btn.active {
  background: linear-gradient(135deg, #6f3ad0, #a36bff);
  border-color: #a36bff;
}

/* ツールバー */
.calendar-toolbar {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.weekday-btn {
  padding: 0.4rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 2rem;
}

.weekday-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.action-btn {
  padding: 0.4rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
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
  background: rgba(100, 150, 255, 0.2);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(100, 150, 255, 0.6);
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
  background: linear-gradient(135deg, #10b981, #34d399);
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

/* レスポンシブ */
@media (max-width: 768px) {
  .calendar-view {
    padding: 1rem;
  }

  .calendar-header {
    padding: 1rem;
    gap: 0.5rem;
  }

  .current-month {
    font-size: 1.5rem;
    min-width: 120px;
  }

  .month-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.875rem;
  }

  .calendar-toolbar {
    padding: 0.75rem 0.5rem;
    gap: 0.3rem;
  }

  .weekday-btn {
    padding: 0.35rem 0.4rem;
    font-size: 0.75rem;
    min-width: 1.75rem;
  }

  .action-btn {
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
  }

  .calendar-grid {
    padding: 0.5rem;
  }

  .calendar-dates {
    gap: 0.25rem;
  }

  .date-cell {
    padding: 0.25rem;
  }

  .date-number {
    font-size: 0.875rem;
  }

  .holiday-name {
    font-size: 0.5rem;
  }
}
</style>
