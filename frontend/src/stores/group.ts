/**
 * グループ化機能のストア
 */

import { defineStore } from 'pinia'
import {
  MAX_GROUPS,
  UNGROUPED_GROUP_ID,
  type Group,
  type GroupId,
  type GroupColor,
  type GroupColorConfig,
  type GroupState,
  type DateGroupMapping,
  type DateRange,
  type TimeOverlap
} from '../types/group'
import type { DateString } from '../types/calendar'
import { useTimeRegisterStore } from './timeRegister'

/**
 * グループカラーの定義（蛍光色10種）
 */
export const GROUP_COLOR_CONFIGS: Record<GroupColor, GroupColorConfig> = {
  'fluorescent-white': {
    name: 'fluorescent-white',
    displayName: '蛍光ホワイト',
    borderColor: '#ffffff',
    gradientColor: 'linear-gradient(135deg, #ffffff, #f0f0f0)',
    shadowColor: 'rgba(255, 255, 255, 0.8)'
  },
  'fluorescent-black': {
    name: 'fluorescent-black',
    displayName: '蛍光ブラック',
    borderColor: '#1a1a1a',
    gradientColor: 'linear-gradient(135deg, #1a1a1a, #404040)',
    shadowColor: 'rgba(26, 26, 26, 0.6)'
  },
  'fluorescent-yellow': {
    name: 'fluorescent-yellow',
    displayName: '蛍光イエロー',
    borderColor: '#ffed4e',
    gradientColor: 'linear-gradient(135deg, #ffed4e, #ffd700)',
    shadowColor: 'rgba(255, 237, 78, 0.6)'
  },
  'fluorescent-pink': {
    name: 'fluorescent-pink',
    displayName: '蛍光ピンク',
    borderColor: '#ff1493',
    gradientColor: 'linear-gradient(135deg, #ff1493, #ff69b4)',
    shadowColor: 'rgba(255, 20, 147, 0.6)'
  },
  'fluorescent-purple': {
    name: 'fluorescent-purple',
    displayName: '蛍光パープル',
    borderColor: '#9d4edd',
    gradientColor: 'linear-gradient(135deg, #9d4edd, #c77dff)',
    shadowColor: 'rgba(157, 78, 221, 0.6)'
  },
  'fluorescent-blue': {
    name: 'fluorescent-blue',
    displayName: '蛍光ブルー',
    borderColor: '#0ea5e9',
    gradientColor: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    shadowColor: 'rgba(14, 165, 233, 0.6)'
  },
  'fluorescent-orange': {
    name: 'fluorescent-orange',
    displayName: '蛍光オレンジ',
    borderColor: '#f97316',
    gradientColor: 'linear-gradient(135deg, #f97316, #fb923c)',
    shadowColor: 'rgba(249, 115, 22, 0.6)'
  },
  'fluorescent-red': {
    name: 'fluorescent-red',
    displayName: '蛍光レッド',
    borderColor: '#ef4444',
    gradientColor: 'linear-gradient(135deg, #ef4444, #f87171)',
    shadowColor: 'rgba(239, 68, 68, 0.6)'
  },
  'fluorescent-cyan': {
    name: 'fluorescent-cyan',
    displayName: '蛍光シアン',
    borderColor: '#06b6d4',
    gradientColor: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    shadowColor: 'rgba(6, 182, 212, 0.6)'
  },
  'fluorescent-magenta': {
    name: 'fluorescent-magenta',
    displayName: '蛍光マゼンタ',
    borderColor: '#d946ef',
    gradientColor: 'linear-gradient(135deg, #d946ef, #e879f9)',
    shadowColor: 'rgba(217, 70, 239, 0.6)'
  }
}

/**
 * 利用可能なカラーのリスト
 */
const AVAILABLE_COLORS: GroupColor[] = [
  'fluorescent-black',
  'fluorescent-yellow',
  'fluorescent-pink',
  'fluorescent-purple',
  'fluorescent-blue',
  'fluorescent-orange',
  'fluorescent-red',
  'fluorescent-cyan',
  'fluorescent-magenta'
]

/**
 * グループIDに対応するカラーを取得
 */
const getColorForGroupId = (groupId: GroupId): GroupColor => {
  return AVAILABLE_COLORS[groupId % AVAILABLE_COLORS.length]
}

/**
 * デフォルトの時給
 */
const DEFAULT_HOURLY_WAGE = 1000

/**
 * 初期グループを作成（1個のデフォルトグループ）
 */
const createInitialGroups = (): Group[] => {
  return [
    {
      id: 0,
      name: 'グループ 1',
      color: getColorForGroupId(0),
      dates: [],
      isActive: false,
      hourlyWage: DEFAULT_HOURLY_WAGE,
      isVisible: true
    }
  ]
}

export const useGroupStore = defineStore('group', {
  state: (): GroupState => {
    const savedState = localStorage.getItem('groupState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as GroupState
        // 後方互換性：isVisibleが未定義の場合はtrueに設定
        parsed.groups = parsed.groups.map(g => ({
          ...g,
          isVisible: g.isVisible ?? true
        }))
        // 後方互換性：ungroupedNameが未定義の場合はデフォルト値を設定
        if (!parsed.ungroupedName) {
          parsed.ungroupedName = 'グループなし'
        }
        return parsed
      } catch (e) {
        console.error('Failed to parse saved group state', e)
      }
    }

    return {
      groups: createInitialGroups(),
      dateGroupMappings: [],
      ungroupedName: 'グループなし'
    }
  },

  getters: {
    /**
     * アクティブなグループのリストを取得
     */
    activeGroups: (state): Group[] => {
      return state.groups.filter(g => g.isActive)
    },

    /**
     * 表示するグループのリストを取得
     */
    visibleGroups: (state): Group[] => {
      return state.groups.filter(g => g.isVisible !== false)
    },

    /**
     * 特定の日付に割り当てられているグループを取得
     */
    getGroupsForDate: (state) => {
      return (date: DateString): Group[] => {
        const mapping = state.dateGroupMappings.find(m => m.date === date)
        if (!mapping) return []
        return state.groups.filter(g => mapping.groupIds.includes(g.id))
      }
    },

    /**
     * 特定のグループに属する日付リストを取得
     */
    getDatesForGroup: (state) => {
      return (groupId: GroupId): DateString[] => {
        const group = state.groups.find(g => g.id === groupId)
        return group ? [...group.dates] : []
      }
    },

    /**
     * 特定のグループIDからグループを取得
     */
    getGroupById: (state) => {
      return (groupId: GroupId): Group | undefined => {
        return state.groups.find(g => g.id === groupId)
      }
    },

    /**
     * 特定のグループの連続した日付範囲を取得（ボーダー描画用）
     */
    getDateRangesForGroup: (state) => {
      return (groupId: GroupId): DateRange[] => {
        const group = state.groups.find(g => g.id === groupId)
        if (!group || group.dates.length === 0) return []

        // 日付をソート
        const sortedDates = [...group.dates].sort()
        const ranges: DateRange[] = []
        let currentRange: DateString[] = [sortedDates[0]]

        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1])
          const currDate = new Date(sortedDates[i])

          // 1日差かチェック
          const diffTime = currDate.getTime() - prevDate.getTime()
          const diffDays = diffTime / (1000 * 60 * 60 * 24)

          if (diffDays === 1) {
            // 連続している
            currentRange.push(sortedDates[i])
          } else {
            // 連続していない - 現在の範囲を保存して新しい範囲を開始
            ranges.push({
              startDate: currentRange[0],
              endDate: currentRange[currentRange.length - 1],
              groupId,
              color: group.color,
              dates: [...currentRange]
            })
            currentRange = [sortedDates[i]]
          }
        }

        // 最後の範囲を追加
        if (currentRange.length > 0) {
          ranges.push({
            startDate: currentRange[0],
            endDate: currentRange[currentRange.length - 1],
            groupId,
            color: group.color,
            dates: [...currentRange]
          })
        }

        return ranges
      }
    },

    /**
     * すべてのグループの連続範囲を取得
     */
    allDateRanges: (state): DateRange[] => {
      const allRanges: DateRange[] = []
      for (const group of state.groups) {
        if (group.isActive) {
          const groupRanges = (useGroupStore().getDateRangesForGroup as (groupId: GroupId) => DateRange[])(group.id)
          allRanges.push(...groupRanges)
        }
      }
      return allRanges
    },

    /**
     * 時間重複を検出
     */
    timeOverlaps: (state): TimeOverlap[] => {
      const overlaps: TimeOverlap[] = []
      const timeRegisterStore = useTimeRegisterStore()

      // 各日付について、複数のグループに属している場合に時間重複をチェック
      for (const mapping of state.dateGroupMappings) {
        if (mapping.groupIds.length < 2) continue // 2つ以上のグループがないと重複しない

        const date = mapping.date
        const workDay = timeRegisterStore.workDays.find(wd => wd.date === date)
        if (!workDay || workDay.isRemoved) continue

        // グループIDのペアで時間重複をチェック
        const overlappingPairs: TimeOverlap['overlappingGroups'] = []

        for (let i = 0; i < mapping.groupIds.length; i++) {
          for (let j = i + 1; j < mapping.groupIds.length; j++) {
            const group1 = state.groups.find(g => g.id === mapping.groupIds[i])
            const group2 = state.groups.find(g => g.id === mapping.groupIds[j])

            if (!group1 || !group2) continue

            // 時間が重複しているかチェック（同じ日に複数のグループ = 重複と判定）
            overlappingPairs.push({
              group1Id: group1.id,
              group2Id: group2.id,
              group1Name: group1.name,
              group2Name: group2.name
            })
          }
        }

        if (overlappingPairs.length > 0) {
          overlaps.push({
            date,
            overlappingGroups: overlappingPairs,
            overlappingTime: {
              start: workDay.startTime,
              end: workDay.endTime
            }
          })
        }
      }

      return overlaps
    },

    /**
     * 特定のグループが時間重複を持つか
     */
    groupHasOverlaps: (state) => {
      return (groupId: GroupId): boolean => {
        const overlaps = (useGroupStore().timeOverlaps as TimeOverlap[])
        return overlaps.some(overlap =>
          overlap.overlappingGroups.some(
            pair => pair.group1Id === groupId || pair.group2Id === groupId
          )
        )
      }
    },

    /**
     * グループ化が1つでも存在するかチェック
     */
    hasAnyGroupedDates: (state): boolean => {
      // 通常のグループ（ID >= 0）にアクティブな日付が存在するかチェック
      return state.groups.some(g => g.id >= 0 && g.dates.length > 0)
    },

    /**
     * 「グループなし」グループを取得
     */
    ungroupedGroup: (state): Group | undefined => {
      return state.groups.find(g => g.id === UNGROUPED_GROUP_ID)
    }
  },

  actions: {
    /**
     * 日付をグループに追加
     */
    addDateToGroup(groupId: GroupId, date: DateString) {
      const group = this.groups.find(g => g.id === groupId)
      if (!group) return

      // グループをアクティブにする
      if (!group.isActive) {
        group.isActive = true
      }

      // グループの日付リストに追加（重複チェック）
      if (!group.dates.includes(date)) {
        group.dates.push(date)
      }

      // マッピングを更新
      let mapping = this.dateGroupMappings.find(m => m.date === date)
      if (!mapping) {
        mapping = { date, groupIds: [] }
        this.dateGroupMappings.push(mapping)
      }

      if (!mapping.groupIds.includes(groupId)) {
        mapping.groupIds.push(groupId)
      }

      this.saveToLocalStorage()
    },

    /**
     * グループから日付を削除
     */
    removeDateFromGroup(groupId: GroupId, date: DateString) {
      const group = this.groups.find(g => g.id === groupId)
      if (!group) return

      // グループの日付リストから削除
      group.dates = group.dates.filter(d => d !== date)

      // グループに日付がなくなったら非アクティブにする
      if (group.dates.length === 0) {
        group.isActive = false
      }

      // マッピングを更新
      const mapping = this.dateGroupMappings.find(m => m.date === date)
      if (mapping) {
        mapping.groupIds = mapping.groupIds.filter(id => id !== groupId)

        // この日付にグループが割り当てられていない場合はマッピングを削除
        if (mapping.groupIds.length === 0) {
          this.dateGroupMappings = this.dateGroupMappings.filter(m => m.date !== date)
        }
      }

      this.saveToLocalStorage()
    },

    /**
     * 日付のグループをトグル
     */
    toggleDateGroup(groupId: GroupId, date: DateString) {
      const group = this.groups.find(g => g.id === groupId)
      if (!group) return

      if (group.dates.includes(date)) {
        this.removeDateFromGroup(groupId, date)
      } else {
        this.addDateToGroup(groupId, date)
      }
    },

    /**
     * 日付をすべてのグループから削除
     */
    removeDateFromAllGroups(date: DateString) {
      for (const group of this.groups) {
        if (group.dates.includes(date)) {
          this.removeDateFromGroup(group.id, date)
        }
      }
    },

    /**
     * グループをクリア
     */
    clearGroup(groupId: GroupId) {
      const group = this.groups.find(g => g.id === groupId)
      if (!group) return

      // すべての日付を削除
      const datesToRemove = [...group.dates]
      for (const date of datesToRemove) {
        this.removeDateFromGroup(groupId, date)
      }

      group.isActive = false
      this.saveToLocalStorage()
    },

    /**
     * すべてのグループをクリア
     */
    clearAllGroups() {
      for (const group of this.groups) {
        this.clearGroup(group.id)
      }
    },

    /**
     * グループ名を更新
     */
    updateGroupName(groupId: GroupId, newName: string) {
      const group = this.groups.find(g => g.id === groupId)
      if (!group) return

      group.name = newName
      this.saveToLocalStorage()
    },

    /**
     * 新しいグループを追加
     */
    addGroup(name?: string): GroupId | null {
      // 最大数をチェック
      if (this.groups.length >= MAX_GROUPS) {
        return null
      }

      // 新しいIDを生成（既存のIDの最大値+1）
      const newId = this.groups.length === 0
        ? 0
        : Math.max(...this.groups.map(g => g.id)) + 1

      const color = getColorForGroupId(newId)
      const newGroup: Group = {
        id: newId,
        name: name || `グループ ${newId + 1}`,
        color,
        dates: [],
        isActive: false,
        hourlyWage: DEFAULT_HOURLY_WAGE,
        isVisible: true
      }

      this.groups.push(newGroup)
      this.saveToLocalStorage()

      return newId
    },

    /**
     * グループを削除
     */
    deleteGroup(groupId: GroupId) {
      // グループをクリア
      this.clearGroup(groupId)

      // グループを削除
      this.groups = this.groups.filter(g => g.id !== groupId)
      this.saveToLocalStorage()
    },

    /**
     * グループを非表示にする
     */
    hideGroup(groupId: GroupId) {
      const group = this.groups.find(g => g.id === groupId)
      if (!group) return

      group.isVisible = false
      this.saveToLocalStorage()
    },

    /**
     * グループを表示する
     */
    showGroup(groupId: GroupId) {
      const group = this.groups.find(g => g.id === groupId)
      if (!group) return

      group.isVisible = true
      this.saveToLocalStorage()
    },

    /**
     * グループの時給を更新
     */
    updateGroupHourlyWage(groupId: GroupId, hourlyWage: number) {
      const group = this.groups.find(g => g.id === groupId)
      if (!group) return

      group.hourlyWage = hourlyWage
      this.saveToLocalStorage()
    },

    /**
     * グループをリセット（初期状態に戻す）
     */
    reset() {
      this.groups = createInitialGroups()
      this.dateGroupMappings = []
      this.ungroupedName = 'グループなし'
      this.saveToLocalStorage()
    },

    /**
     * 「グループなし」の名前を更新
     */
    updateUngroupedName(newName: string) {
      this.ungroupedName = newName || 'グループなし'
      this.saveToLocalStorage()
    },

    /**
     * ローカルストレージに保存
     */
    saveToLocalStorage() {
      try {
        localStorage.setItem('groupState', JSON.stringify(this.$state))
      } catch (e) {
        console.error('Failed to save group state to localStorage', e)
      }
    },

    /**
     * 「グループなし」グループを確保
     */
    ensureUngroupedGroup() {
      // すでに存在する場合は何もしない
      if (this.ungroupedGroup) return

      // 「グループなし」グループを作成
      this.groups.push({
        id: UNGROUPED_GROUP_ID,
        name: this.ungroupedName || 'グループなし',
        color: 'fluorescent-white',
        dates: [],
        isActive: false,
        hourlyWage: 1000,
        isVisible: true
      })
    },

    /**
     * 選択済みだがグループ化されていない日付を「グループなし」に自動追加
     */
    syncUngroupedDates(selectedDates: DateString[]) {
      // 他のグループ化がない場合は何もしない
      if (!this.hasAnyGroupedDates) {
        // グループなしグループを削除
        this.removeUngroupedGroup()
        return
      }

      // グループなしグループを確保
      this.ensureUngroupedGroup()

      const ungroupedGroup = this.ungroupedGroup
      if (!ungroupedGroup) return

      // 選択済みの日付のうち、通常のグループに属していない日付を取得
      const ungroupedDates = selectedDates.filter(date => {
        const groups = this.getGroupsForDate(date)
        // 通常のグループ（ID >= 0）に属していない日付
        return !groups.some(g => g.id >= 0)
      })

      // グループなしグループの日付を更新
      ungroupedGroup.dates = ungroupedDates
      ungroupedGroup.isActive = ungroupedDates.length > 0

      // dateGroupMappingsを更新
      ungroupedDates.forEach(date => {
        let mapping = this.dateGroupMappings.find(m => m.date === date)
        if (!mapping) {
          mapping = { date, groupIds: [] }
          this.dateGroupMappings.push(mapping)
        }
        if (!mapping.groupIds.includes(UNGROUPED_GROUP_ID)) {
          mapping.groupIds.push(UNGROUPED_GROUP_ID)
        }
      })

      // グループなしグループから外れた日付のマッピングを削除
      this.dateGroupMappings.forEach(mapping => {
        if (!ungroupedDates.includes(mapping.date)) {
          mapping.groupIds = mapping.groupIds.filter(id => id !== UNGROUPED_GROUP_ID)
        }
      })

      // 空のマッピングを削除
      this.dateGroupMappings = this.dateGroupMappings.filter(m => m.groupIds.length > 0)

      this.saveToLocalStorage()
    },

    /**
     * 「グループなし」グループを削除
     */
    removeUngroupedGroup() {
      const index = this.groups.findIndex(g => g.id === UNGROUPED_GROUP_ID)
      if (index !== -1) {
        this.groups.splice(index, 1)
        // マッピングからも削除
        this.dateGroupMappings.forEach(mapping => {
          mapping.groupIds = mapping.groupIds.filter(id => id !== UNGROUPED_GROUP_ID)
        })
        this.dateGroupMappings = this.dateGroupMappings.filter(m => m.groupIds.length > 0)
        this.saveToLocalStorage()
      }
    }
  }
})
