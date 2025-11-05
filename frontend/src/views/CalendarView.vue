<template>
  <div
    class="calendar-view"
    @touchstart="handleTouchStart"
    @touchmove.passive="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 進捗インジケーター -->
    <ProgressIndicator />

    <!-- カレンダーカード -->
    <div class="calendar-card">
      <!-- ヘッダー：年月 -->
      <div class="calendar-header">
        <h1 class="current-month">{{ currentMonthInfo.displayText }}</h1>
      </div>

      <!-- 月選択ボタン：今月・来月 -->
      <div class="month-buttons">
        <button @click="setThisMonth" class="month-btn" :class="{ active: isThisMonth }">
          今月
        </button>
        <button @click="setNextMonth" class="month-btn" :class="{ active: isNextMonth }">
          来月
        </button>
      </div>

      <!-- アクションボタン：全選択・クリア -->
      <div class="action-buttons">
        <button @click="selectAll" class="action-btn" :class="{ selected: isAllSelected }">全選択</button>
        <button @click="clearAll" class="action-btn">クリア</button>
      </div>

      <!-- 曜日一括選択ボタン -->
      <div class="weekday-buttons">
        <button
          v-for="(day, index) in weekdays"
          :key="index"
          @click="selectByWeekday(index)"
          class="weekday-btn"
          :class="{ selected: isWeekdayFullySelected(index) }"
        >
          {{ day }}
        </button>
      </div>

      <!-- 曜日ヘッダー -->
      <div class="calendar-weekdays">
        <div
          v-for="(day, index) in weekdays"
          :key="index"
          class="weekday-header"
          :class="{
            sunday: index === 0,
            saturday: index === 6
          }"
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
            'past': cell.isPast,
            'holiday': cell.isHoliday,
            'saturday': cell.dayOfWeek === 6,
            'sunday': cell.dayOfWeek === 0,
            'selected': cell.isSelected
          }"
          @click="handleDateClick(cell)"
        >
          <div class="date-number">{{ cell.date.getDate() }}</div>
        </div>
      </div>

      <!-- 統計情報 -->
      <div class="calendar-stats">
        <div class="stat-summary">
          <span class="stat-label">選択日数:</span>
          <span class="stat-value">{{ selectedCount }}日</span>
        </div>
        <div class="stat-comment">
          （{{ currentMonthInfo.month + 1 }}月の平日は{{ weekdayCount }}日、休日は{{ holidayCount }}日です）
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
import { useNavigationStore } from '../stores/navigation'
import type { CalendarCell } from '../types/calendar'
import ProgressIndicator from '../components/ProgressIndicator.vue'

const router = useRouter()
const store = useCalendarStore()
const navigationStore = useNavigationStore()

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
  weekdayCount,
  holidayCount,
  isAllSelected,
  isWeekdayFullySelected,
  toggleDate,
  selectAll,
  clearAll,
  selectByWeekday,
  setMonth
} = useCalendar()

const { fetchHolidaysWithCache, holidays: holidaysData } = useHolidays()

// ローカル状態
const weekdays = ['日', '月', '火', '水', '木', '金', '土']

// スワイプジェスチャー用の状態
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)

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
  store.setHolidays(holidaysData.value)
})

// イベントハンドラ
const handleDateClick = (cell: CalendarCell) => {
  if (!cell.isCurrentMonth) return
  if (cell.isPast) return // 過去の日付は選択できない
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
  navigationStore.setForward()
  router.push('/time-register')
}

// スワイプジェスチャーハンドラ
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

const handleTouchMove = (e: TouchEvent) => {
  touchEndX.value = e.touches[0].clientX
  touchEndY.value = e.touches[0].clientY
}

const handleTouchEnd = () => {
  const diffX = touchStartX.value - touchEndX.value
  const diffY = Math.abs(touchStartY.value - touchEndY.value)

  // 横方向のスワイプで、縦方向の移動が少ない場合のみ
  if (Math.abs(diffX) > 100 && diffY < 100) {
    // 左スワイプ（次へ進む）
    if (diffX > 0) {
      navigateToTimeRegister()
    }
  }
}
</script>

<style scoped>
.calendar-view {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
}

/* カレンダーカード */
.calendar-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ヘッダー */
.calendar-header {
  text-align: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
}

.current-month {
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

/* 月選択ボタン */
.month-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.month-btn {
  padding: 0.5rem 1.5rem;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1rem;
}

.month-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.month-btn.active {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* アクションボタン */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.action-btn {
  padding: 0.5rem 1.5rem;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  color: #333;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.action-btn.selected {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* 曜日一括選択ボタン */
.weekday-buttons {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.weekday-btn {
  padding: 0.5rem 0.25rem;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  color: #333;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  white-space: nowrap;
  text-align: center;
}

.weekday-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.weekday-btn.selected {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* 統計情報 */
.calendar-stats {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
}

.stat-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: #666;
  font-weight: 600;
}

.stat-value {
  font-size: 1.25rem;
  color: #667eea;
  font-weight: 700;
}

.stat-comment {
  font-size: 0.875rem;
  color: #999;
  font-style: italic;
}

/* 曜日ヘッダー */
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
  color: #666;
}

.weekday-header.sunday {
  color: #ff6ba3;
}

.weekday-header.saturday {
  color: #6ba3ff;
}

/* カレンダー日付グリッド */
.calendar-dates {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.date-cell {
  aspect-ratio: 1;
  padding: 0.5rem;
  border-radius: 8px;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2px solid transparent;
}

.date-cell:hover:not(.other-month):not(.past):not(.selected) {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(102, 126, 234, 0.3);
}

.date-cell.other-month {
  background: transparent;
  color: #ccc;
  cursor: not-allowed;
  border: none;
}

.date-cell.other-month:hover {
  transform: none;
  box-shadow: none;
  background: transparent;
}

.date-cell.past {
  opacity: 0.4;
  cursor: not-allowed;
  background: #e0e0e0;
}

.date-cell.past:hover {
  transform: none;
  box-shadow: none;
}

.date-cell.today:not(.past) {
  border: 2px solid #667eea;
}

.date-cell.selected {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  font-weight: 700;
}

.date-cell.saturday:not(.selected):not(.holiday):not(.past) .date-number {
  color: #6ba3ff;
}

.date-cell.sunday:not(.selected):not(.holiday):not(.past) .date-number {
  color: #ff6ba3;
}

.date-cell.holiday:not(.selected):not(.past) .date-number {
  color: #ff0000;
  font-weight: 700;
}

.date-number {
  font-size: 1.125rem;
  font-weight: 600;
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
  background: linear-gradient(135deg, #f97316, #fb923c);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
}

.next-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5);
}

.next-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .calendar-view {
    padding: 1rem;
  }

  .calendar-card {
    padding: 1rem;
  }

  .calendar-header {
    flex-direction: column;
    gap: 1rem;
  }

  .month-buttons {
    justify-content: center;
  }

  .current-month {
    font-size: 1.5rem;
  }

  .month-btn {
    padding: 0.4rem 1rem;
    font-size: 0.875rem;
  }

  .action-buttons {
    gap: 0.4rem;
  }

  .action-btn {
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
  }

  .weekday-buttons {
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .weekday-btn {
    padding: 0.4rem 0.15rem;
    font-size: 0.75rem;
  }

  .calendar-stats {
    gap: 1rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .stat-item {
    gap: 0.3rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }

  .stat-value {
    font-size: 1rem;
  }

  .calendar-dates {
    gap: 0.25rem;
  }

  .date-cell {
    padding: 0.25rem;
  }

  .date-number {
    font-size: 0.9rem;
  }

  .next-btn {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }
}
</style>
