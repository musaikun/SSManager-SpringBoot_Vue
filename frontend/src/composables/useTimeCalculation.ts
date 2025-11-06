import type { TimeString, BreakTimeResult, BreakTimeRule } from '../types/timeRegister'
import { useTimeFormat } from './useTimeFormat'

/**
 * 時間計算用Composable
 */
export function useTimeCalculation() {
  const { parseTime } = useTimeFormat()

  /**
   * 休憩時間のルール
   */
  const breakRules: BreakTimeRule[] = [
    { minWorkMinutes: 0, maxWorkMinutes: 6 * 60, breakMinutes: 0 },
    { minWorkMinutes: 6 * 60, maxWorkMinutes: 8 * 60, breakMinutes: 45 },
    { minWorkMinutes: 8 * 60, maxWorkMinutes: null, breakMinutes: 60 }
  ]

  /**
   * 開始時刻と終了時刻から勤務時間（分）を計算
   * @param startTime 開始時刻
   * @param endTime 終了時刻
   * @returns 勤務時間（分）
   */
  const calculateWorkMinutes = (startTime: TimeString, endTime: TimeString): number => {
    const start = parseTime(startTime)
    const end = parseTime(endTime)

    let startMinutes = start.hour * 60 + start.minute
    let endMinutes = end.hour * 60 + end.minute

    // 終了時刻が開始時刻より前の場合は翌日とみなす（日付をまたぐ勤務）
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60
    }

    return endMinutes - startMinutes
  }

  /**
   * 勤務時間から休憩時間を計算
   * @param workMinutes 勤務時間（分）
   * @returns 休憩時間（分）
   */
  const calculateBreakTime = (workMinutes: number): number => {
    for (const rule of breakRules) {
      if (workMinutes >= rule.minWorkMinutes) {
        if (rule.maxWorkMinutes === null || workMinutes < rule.maxWorkMinutes) {
          return rule.breakMinutes
        }
      }
    }
    return 0
  }

  /**
   * 勤務時間と休憩時間から実労働時間を計算
   * @param workMinutes 勤務時間（分）
   * @returns { breakMinutes, actualWorkMinutes }
   */
  const calculateBreakTimeResult = (workMinutes: number): BreakTimeResult => {
    const breakMinutes = calculateBreakTime(workMinutes)
    const actualWorkMinutes = Math.max(0, workMinutes - breakMinutes)

    return {
      breakMinutes,
      actualWorkMinutes
    }
  }

  /**
   * 時刻が妥当かチェック
   * @param hour 0-23
   * @param minute 0-59
   * @returns 妥当ならtrue
   */
  const isValidTime = (hour: number, minute: number): boolean => {
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
  }

  /**
   * 終了時刻が開始時刻より後かチェック（翌日考慮）
   * @param startTime 開始時刻
   * @param endTime 終了時刻
   * @returns 有効ならtrue
   */
  const isValidTimeRange = (startTime: TimeString, endTime: TimeString): boolean => {
    const workMinutes = calculateWorkMinutes(startTime, endTime)
    return workMinutes > 0 && workMinutes <= 24 * 60
  }

  /**
   * 休憩時間のルールを取得
   * @returns ルールの配列
   */
  const getBreakRules = (): BreakTimeRule[] => {
    return breakRules
  }

  return {
    calculateWorkMinutes,
    calculateBreakTime,
    calculateBreakTimeResult,
    isValidTime,
    isValidTimeRange,
    getBreakRules
  }
}
