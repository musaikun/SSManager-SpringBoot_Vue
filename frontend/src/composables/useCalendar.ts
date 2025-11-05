import { computed } from 'vue'
import { useCalendarStore } from '../stores/calendar'
import type { CalendarCell, DateString } from '../types/calendar'
import {
  formatDateString,
  getDayOfWeek,
  isToday,
  isSameMonth,
  getCalendarDates,
  getMonthDates
} from '../utils/dateUtils'

/**
 * カレンダーロジック用Composable
 */
export function useCalendar() {
  const store = useCalendarStore()

  /**
   * カレンダーに表示する全てのセル情報を生成
   */
  const calendarCells = computed<CalendarCell[]>(() => {
    const { currentYear, currentMonth } = store
    const allDates = getCalendarDates(currentYear, currentMonth)
    const currentMonthDate = new Date(currentYear, currentMonth, 1)

    return allDates.map(date => {
      const dateString = formatDateString(date)
      const dayOfWeek = getDayOfWeek(date)
      const isCurrentMonth = isSameMonth(date, currentMonthDate)

      return {
        date,
        dateString,
        dayOfWeek,
        isCurrentMonth,
        isToday: isToday(date),
        isHoliday: store.isHoliday(dateString),
        holidayName: store.getHolidayName(dateString),
        isSelected: store.isDateSelected(dateString)
      }
    })
  })

  /**
   * 当月のみのセル情報
   */
  const currentMonthCells = computed<CalendarCell[]>(() => {
    return calendarCells.value.filter(cell => cell.isCurrentMonth)
  })

  /**
   * 当月の全日付（DateString配列）
   */
  const currentMonthDates = computed<DateString[]>(() => {
    const { currentYear, currentMonth } = store
    return getMonthDates(currentYear, currentMonth).map(date => formatDateString(date))
  })

  /**
   * カレンダーを週ごとに分割
   */
  const calendarWeeks = computed<CalendarCell[][]>(() => {
    const weeks: CalendarCell[][] = []
    const cells = calendarCells.value

    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }

    return weeks
  })

  /**
   * 日付を選択/解除
   */
  const toggleDate = (dateString: DateString) => {
    store.toggleDate(dateString)
  }

  /**
   * 全選択
   */
  const selectAll = () => {
    store.selectAll(currentMonthDates.value)
  }

  /**
   * 全解除
   */
  const clearAll = () => {
    store.clearAll()
  }

  /**
   * 曜日で選択
   */
  const selectByWeekday = (dayOfWeek: number) => {
    store.selectByWeekday(currentMonthDates.value, dayOfWeek)
  }

  /**
   * 月を変更
   */
  const setMonth = (year: number, month: number) => {
    store.setMonth(year, month)
  }

  /**
   * 今月に戻る
   */
  const goToToday = () => {
    const today = new Date()
    store.setMonth(today.getFullYear(), today.getMonth())
  }

  /**
   * 前月に移動
   */
  const previousMonth = () => {
    store.previousMonth()
  }

  /**
   * 次月に移動
   */
  const nextMonth = () => {
    store.nextMonth()
  }

  /**
   * テンプレートを保存
   */
  const saveTemplate = (name: string) => {
    if (store.selectedCount === 0) {
      throw new Error('選択された日付がありません')
    }
    store.saveTemplate(name)
  }

  /**
   * テンプレートを読み込み
   */
  const loadTemplate = () => {
    store.loadTemplate()
  }

  /**
   * 前月のデータをコピー
   */
  const copyPreviousMonth = () => {
    store.copyPreviousMonth()
  }

  /**
   * 現在の状態を前月データとして保存
   */
  const savePreviousMonthData = () => {
    store.savePreviousMonthData()
  }

  return {
    // Computed
    calendarCells,
    currentMonthCells,
    currentMonthDates,
    calendarWeeks,

    // Store state (readonly)
    currentYear: computed(() => store.currentYear),
    currentMonth: computed(() => store.currentMonth),
    selectedDates: computed(() => store.selectedDatesArray),
    selectedCount: computed(() => store.selectedCount),
    currentMonthInfo: computed(() => store.currentMonthInfo),

    // Actions
    toggleDate,
    selectAll,
    clearAll,
    selectByWeekday,
    setMonth,
    goToToday,
    previousMonth,
    nextMonth,
    saveTemplate,
    loadTemplate,
    copyPreviousMonth,
    savePreviousMonthData
  }
}
