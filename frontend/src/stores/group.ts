/**
 * グループ化機能のストア
 */

import { defineStore } from 'pinia'
import type {
  Group,
  GroupId,
  GroupColor,
  GroupColorConfig,
  GroupState,
  DateGroupMapping,
  DateRange
} from '../types/group'
import type { DateString } from '../types/calendar'

/**
 * グループカラーの定義（蛍光色4種）
 */
export const GROUP_COLOR_CONFIGS: Record<GroupColor, GroupColorConfig> = {
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
  }
}

/**
 * グループIDに対応するカラーを取得
 */
const getColorForGroupId = (groupId: GroupId): GroupColor => {
  const colors: GroupColor[] = ['fluorescent-black', 'fluorescent-yellow', 'fluorescent-pink', 'fluorescent-purple']
  return colors[groupId]
}

/**
 * 初期グループを作成
 */
const createInitialGroups = (): Group[] => {
  const groups: Group[] = []
  for (let i = 0; i < 4; i++) {
    const id = i as GroupId
    const color = getColorForGroupId(id)
    groups.push({
      id,
      name: `グループ ${i + 1}`,
      color,
      dates: [],
      isActive: false
    })
  }
  return groups
}

export const useGroupStore = defineStore('group', {
  state: (): GroupState => {
    const savedState = localStorage.getItem('groupState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as GroupState
        return parsed
      } catch (e) {
        console.error('Failed to parse saved group state', e)
      }
    }

    return {
      groups: createInitialGroups(),
      dateGroupMappings: []
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
     * グループをリセット（初期状態に戻す）
     */
    reset() {
      this.groups = createInitialGroups()
      this.dateGroupMappings = []
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
    }
  }
})
