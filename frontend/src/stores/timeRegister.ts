import { defineStore } from 'pinia'
import type {
  TimeRegisterState,
  WorkDay,
  BulkSettings,
  TotalSummary,
  TimePickerState,
  BulkApplyType,
  BulkApplyTarget,
  TimePickerMode,
  TimeString
} from '../types/timeRegister'
import type { DateString } from '../types/calendar'

/**
 * 時間登録ストア
 */
export const useTimeRegisterStore = defineStore('timeRegister', {
  state: (): TimeRegisterState => ({
    workDays: [],
    bulkSettings: {
      startTime: '09:00',
      endTime: '18:00'
    },
    includeBreak: false,
    timePicker: {
      isOpen: false,
      mode: 'card',
      currentCardIndex: null,
      selectedStartTime: '09:00',
      selectedEndTime: '18:00'
    }
  }),

  getters: {
    /**
     * 削除されていない勤務日のみ取得
     */
    activeWorkDays: (state): WorkDay[] => {
      return state.workDays.filter(day => !day.isRemoved)
    },

    /**
     * 合計情報を計算
     */
    totalSummary: (state): TotalSummary => {
      const activeWorkDays = state.workDays.filter(day => !day.isRemoved)

      const totalWorkMinutes = activeWorkDays.reduce(
        (sum, day) => sum + day.workMinutes,
        0
      )

      // 休憩時間の計算
      let totalBreakMinutes = 0
      let totalActualWorkMinutes = 0

      if (state.includeBreak) {
        activeWorkDays.forEach(day => {
          const breakMinutes = calculateBreakTime(day.workMinutes)
          totalBreakMinutes += breakMinutes
          totalActualWorkMinutes += day.workMinutes - breakMinutes
        })
      } else {
        totalActualWorkMinutes = totalWorkMinutes
      }

      return {
        workDays: activeWorkDays.length,
        totalWorkMinutes,
        totalActualWorkMinutes,
        totalBreakMinutes
      }
    },

    /**
     * インデックスで勤務日を取得
     */
    workDayByIndex: (state) => {
      return (index: number): WorkDay | undefined => {
        return state.workDays[index]
      }
    },

    /**
     * 個別設定された勤務日のみ取得
     */
    modifiedWorkDays: (state): WorkDay[] => {
      return state.workDays.filter(day => day.isModified && !day.isRemoved)
    },

    /**
     * 個別設定されていない勤務日のみ取得
     */
    unmodifiedWorkDays: (state): WorkDay[] => {
      return state.workDays.filter(day => !day.isModified && !day.isRemoved)
    }
  },

  actions: {
    /**
     * カレンダーから選択された日付を設定
     */
    initializeFromDates(dates: DateString[]) {
      this.workDays = dates.map((date, index) => {
        const dateObj = new Date(date)
        const dayOfWeek = dateObj.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6

        return {
          date,
          dayOfWeek,
          startTime: this.bulkSettings.startTime,
          endTime: this.bulkSettings.endTime,
          workMinutes: calculateWorkMinutes(this.bulkSettings.startTime, this.bulkSettings.endTime),
          isModified: false,
          isRemoved: false,
          displayDate: formatDisplayDate(dateObj, dayOfWeek)
        }
      })
    },

    /**
     * 勤務日を更新
     */
    updateWorkDay(index: number, updates: Partial<WorkDay>) {
      if (index >= 0 && index < this.workDays.length) {
        const workDay = this.workDays[index]

        // 時刻が変更された場合、勤務時間を再計算
        const startTime = updates.startTime ?? workDay.startTime
        const endTime = updates.endTime ?? workDay.endTime
        const workMinutes = calculateWorkMinutes(startTime, endTime)

        this.workDays[index] = {
          ...workDay,
          ...updates,
          startTime,
          endTime,
          workMinutes,
          isModified: true // 更新したらmodifiedフラグを立てる
        }
      }
    },

    /**
     * 勤務日を削除（シフトから外す）
     */
    removeWorkDay(index: number) {
      if (index >= 0 && index < this.workDays.length) {
        this.workDays[index].isRemoved = true
      }
    },

    /**
     * 勤務日の削除/復活を切り替え
     */
    toggleRemoveDay(index: number) {
      if (index >= 0 && index < this.workDays.length) {
        this.workDays[index].isRemoved = !this.workDays[index].isRemoved
      }
    },

    /**
     * 一括設定を更新
     */
    updateBulkSettings(settings: Partial<BulkSettings>) {
      this.bulkSettings = {
        ...this.bulkSettings,
        ...settings
      }
    },

    /**
     * 一括適用
     */
    applyBulk(
      type: BulkApplyType,
      target: BulkApplyTarget,
      dayOfWeek?: number
    ) {
      const targetDays = target === 'all'
        ? this.workDays.filter(day => !day.isRemoved)
        : this.workDays.filter(day => !day.isModified && !day.isRemoved)

      targetDays.forEach((day, index) => {
        const actualIndex = this.workDays.indexOf(day)

        // 曜日指定がある場合はフィルタリング
        if (dayOfWeek !== undefined && day.dayOfWeek !== dayOfWeek) {
          return
        }

        const updates: Partial<WorkDay> = {}

        if (type === 'both' || type === 'start') {
          updates.startTime = this.bulkSettings.startTime
        }
        if (type === 'both' || type === 'end') {
          updates.endTime = this.bulkSettings.endTime
        }

        // 勤務時間を再計算
        const startTime = updates.startTime ?? day.startTime
        const endTime = updates.endTime ?? day.endTime
        updates.workMinutes = calculateWorkMinutes(startTime, endTime)

        // 個別設定を上書きする場合はisModifiedをfalseにする
        if (target === 'all' && day.isModified) {
          updates.isModified = false
        }

        this.workDays[actualIndex] = {
          ...day,
          ...updates
        }
      })
    },

    /**
     * 休憩時間の加味を切り替え
     */
    toggleBreak() {
      this.includeBreak = !this.includeBreak
    },

    /**
     * 時間ピッカーを開く
     */
    openTimePicker(mode: TimePickerMode, cardIndex?: number) {
      if (mode === 'card' && cardIndex !== undefined) {
        const workDay = this.workDays[cardIndex]
        this.timePicker = {
          isOpen: true,
          mode,
          currentCardIndex: cardIndex,
          selectedStartTime: workDay.startTime,
          selectedEndTime: workDay.endTime
        }
      } else if (mode === 'bulk-start' || mode === 'bulk-end') {
        this.timePicker = {
          isOpen: true,
          mode,
          currentCardIndex: null,
          selectedStartTime: this.bulkSettings.startTime,
          selectedEndTime: this.bulkSettings.endTime
        }
      }
    },

    /**
     * 時間ピッカーを閉じる
     */
    closeTimePicker() {
      this.timePicker.isOpen = false
      this.timePicker.currentCardIndex = null
    },

    /**
     * 時間ピッカーで選択した時刻を更新
     */
    updateSelectedTime(startTime: TimeString, endTime: TimeString) {
      this.timePicker.selectedStartTime = startTime
      this.timePicker.selectedEndTime = endTime
    },

    /**
     * 時間ピッカーの選択を確定
     */
    confirmTimePicker() {
      if (this.timePicker.mode === 'card' && this.timePicker.currentCardIndex !== null) {
        this.updateWorkDay(this.timePicker.currentCardIndex, {
          startTime: this.timePicker.selectedStartTime,
          endTime: this.timePicker.selectedEndTime
        })
      } else if (this.timePicker.mode === 'bulk-start') {
        this.updateBulkSettings({
          startTime: this.timePicker.selectedStartTime
        })
      } else if (this.timePicker.mode === 'bulk-end') {
        this.updateBulkSettings({
          endTime: this.timePicker.selectedEndTime
        })
      }
      this.closeTimePicker()
    },

    /**
     * ストアをリセット
     */
    reset() {
      this.workDays = []
      this.bulkSettings = {
        startTime: '09:00',
        endTime: '18:00'
      }
      this.includeBreak = false
      this.timePicker = {
        isOpen: false,
        mode: 'card',
        currentCardIndex: null,
        selectedStartTime: '09:00',
        selectedEndTime: '18:00'
      }
    }
  }
})

// ===== ヘルパー関数 =====

/**
 * 時刻文字列から勤務時間（分）を計算
 */
function calculateWorkMinutes(startTime: TimeString, endTime: TimeString): number {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  let startMinutes = startHour * 60 + startMinute
  let endMinutes = endHour * 60 + endMinute

  // 終了時刻が開始時刻より前の場合は翌日とみなす
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60
  }

  return endMinutes - startMinutes
}

/**
 * 勤務時間から休憩時間を計算
 */
function calculateBreakTime(workMinutes: number): number {
  if (workMinutes < 6 * 60) {
    return 0
  } else if (workMinutes < 8 * 60) {
    return 45
  } else {
    return 60
  }
}

/**
 * 日付オブジェクトから表示用文字列を生成
 */
function formatDisplayDate(date: Date, dayOfWeek: number): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayLabels = ['日', '月', '火', '水', '木', '金', '土']
  const dayLabel = dayLabels[dayOfWeek]

  return `${month}/${day}(${dayLabel})`
}
