/**
 * グループ化機能の型定義
 */

import type { DateString } from './calendar'

/**
 * グループID（0-3の4グループ）
 */
export type GroupId = 0 | 1 | 2 | 3

/**
 * グループカラー（蛍光色）
 */
export type GroupColor = 'fluorescent-black' | 'fluorescent-yellow' | 'fluorescent-pink' | 'fluorescent-purple'

/**
 * グループカラーの設定
 */
export interface GroupColorConfig {
  /** カラー名 */
  name: GroupColor
  /** 表示名 */
  displayName: string
  /** ボーダーカラー（CSS） */
  borderColor: string
  /** グラデーションカラー（CSS） */
  gradientColor: string
  /** シャドウカラー（CSS） */
  shadowColor: string
}

/**
 * グループ情報
 */
export interface Group {
  /** グループID */
  id: GroupId
  /** グループ名（カスタマイズ可能） */
  name: string
  /** カラー */
  color: GroupColor
  /** このグループに属する日付のリスト */
  dates: DateString[]
  /** アクティブか（使用中か） */
  isActive: boolean
}

/**
 * 日付とグループの関連情報
 */
export interface DateGroupMapping {
  /** 日付 */
  date: DateString
  /** この日付に割り当てられたグループIDのリスト */
  groupIds: GroupId[]
}

/**
 * グループストアの状態
 */
export interface GroupState {
  /** 全グループ（最大4つ） */
  groups: Group[]
  /** 日付とグループのマッピング */
  dateGroupMappings: DateGroupMapping[]
}

/**
 * グループ操作のオプション
 */
export interface GroupOperationOptions {
  /** グループID */
  groupId: GroupId
  /** 日付 */
  date: DateString
}

/**
 * 連続した日付のグループ（ボーダー描画用）
 */
export interface DateRange {
  /** 開始日 */
  startDate: DateString
  /** 終了日 */
  endDate: DateString
  /** グループID */
  groupId: GroupId
  /** カラー */
  color: GroupColor
  /** この範囲内の日付リスト */
  dates: DateString[]
}

/**
 * カレンダーセルの位置情報（ボーダー描画用）
 */
export interface CellPosition {
  /** 行インデックス */
  row: number
  /** 列インデックス */
  col: number
  /** 日付 */
  date: DateString
}

/**
 * グループボーダーの描画情報
 */
export interface GroupBorder {
  /** グループID */
  groupId: GroupId
  /** カラー */
  color: GroupColor
  /** ボーダーを描画するセルの位置リスト */
  cells: CellPosition[]
  /** 連続した範囲か */
  isConnected: boolean
}
