<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="emit('close')">
      <div class="modal-content settings-modal" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">設定</h2>
          <button @click="emit('close')" class="close-btn">×</button>
        </div>

        <div class="modal-body">
          <!-- デフォルト時刻設定 -->
          <div class="settings-section">
            <h3 class="section-title">デフォルト時刻</h3>

            <!-- 開始時刻 -->
            <div class="time-setting">
              <label class="time-label">開始時刻</label>
              <div class="time-display" @click="openTimePicker('start')">
                {{ displayStartTime }}
                <span class="edit-icon">✎</span>
              </div>
            </div>

            <!-- 終了時刻 -->
            <div class="time-setting">
              <label class="time-label">終了時刻</label>
              <div class="time-display" @click="openTimePicker('end')">
                {{ displayEndTime }}
                <span class="edit-icon">✎</span>
              </div>
            </div>

            <p class="settings-note">※ 一括設定の初期値として使用されます</p>
          </div>

          <!-- 履歴管理 -->
          <div class="settings-section">
            <h3 class="section-title">履歴管理</h3>
            <button @click="deleteNonFavorites" class="action-btn delete-history-btn">
              <span class="action-icon">🗑️</span>
              <span class="action-label">お気に入り以外を削除</span>
            </button>
            <p class="settings-note">※ ⭐お気に入りは残ります</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 時刻選択モーダル -->
    <div v-if="showTimePicker" class="modal-overlay" @click="closeTimePicker">
      <div class="modal-content time-picker-modal" @click.stop>
        <h3 class="modal-title">{{ timePickerType === 'start' ? '開始時刻' : '終了時刻' }}</h3>

        <div class="modal-section">
          <div class="modal-section-header">
            <div class="toggle-switch">
              <input type="checkbox" id="periodToggle" v-model="isPm" class="toggle-input">
              <label for="periodToggle" class="toggle-label">
                <span class="toggle-text-am">午前</span>
                <span class="toggle-text-pm">午後</span>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- 時間選択 -->
          <div class="hour-selector-row">
            <button
              v-for="hour in hourButtons.slice(0, 6)"
              :key="'hour-' + hour"
              class="hour-btn"
              :class="{ active: selectedHour === hour }"
              @click="selectHour(hour)"
            >
              {{ hour }}
            </button>
          </div>
          <div class="hour-selector-row">
            <button
              v-for="hour in hourButtons.slice(6, 12)"
              :key="'hour-' + hour"
              class="hour-btn"
              :class="{ active: selectedHour === hour }"
              @click="selectHour(hour)"
            >
              {{ hour }}
            </button>
          </div>

          <!-- 分選択 -->
          <div class="minute-selector-row">
            <button
              v-for="minute in [0, 15, 30, 45]"
              :key="'min-' + minute"
              class="minute-btn"
              :class="{ active: selectedMinute === minute }"
              @click="selectMinute(minute)"
            >
              {{ String(minute).padStart(2, '0') }}
            </button>
          </div>

          <div class="time-preview">選択: <span>{{ formattedSelectedTime }}</span></div>
        </div>

        <div class="modal-actions">
          <button @click="closeTimePicker" class="cancel-btn">キャンセル</button>
          <button @click="applyTime" class="apply-btn">決定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimeRegisterStore } from '../stores/timeRegister'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const timeRegisterStore = useTimeRegisterStore()
const { bulkSettings } = storeToRefs(timeRegisterStore)

// 時刻ピッカーの状態
const showTimePicker = ref(false)
const timePickerType = ref<'start' | 'end'>('start')
const isPm = ref(false)
const selectedHour = ref(9)
const selectedMinute = ref(0)

// 表示用の時刻
const displayStartTime = computed(() => bulkSettings.value.startTime)
const displayEndTime = computed(() => bulkSettings.value.endTime)

// 時間ボタン
const hourButtons = computed(() => {
  if (isPm.value) {
    return [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  } else {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  }
})

// 選択中の時刻の表示
const formattedSelectedTime = computed(() => {
  const h = String(selectedHour.value).padStart(2, '0')
  const m = String(selectedMinute.value).padStart(2, '0')
  return `${h}:${m}`
})

// 時刻ピッカーを開く
const openTimePicker = (type: 'start' | 'end') => {
  timePickerType.value = type
  const timeStr = type === 'start' ? bulkSettings.value.startTime : bulkSettings.value.endTime
  const [hourStr, minuteStr] = timeStr.split(':')
  const hour = parseInt(hourStr)
  const minute = parseInt(minuteStr)

  selectedHour.value = hour
  selectedMinute.value = minute
  isPm.value = hour >= 12

  showTimePicker.value = true
}

// 時刻ピッカーを閉じる
const closeTimePicker = () => {
  showTimePicker.value = false
}

// 時間選択
const selectHour = (hour: number) => {
  selectedHour.value = hour
}

// 分選択
const selectMinute = (minute: number) => {
  selectedMinute.value = minute
}

// 時刻を適用
const applyTime = () => {
  const timeStr = formattedSelectedTime.value
  if (timePickerType.value === 'start') {
    bulkSettings.value.startTime = timeStr
  } else {
    bulkSettings.value.endTime = timeStr
  }
  closeTimePicker()
}

// お気に入り以外の履歴を削除
const deleteNonFavorites = () => {
  if (!confirm('お気に入り以外の履歴を削除してもよろしいですか？')) {
    return
  }

  const savedShifts = JSON.parse(localStorage.getItem('savedShifts') || '[]')
  const favorites = savedShifts.filter((shift: any) => shift.isFavorite)
  localStorage.setItem('savedShifts', JSON.stringify(favorites))

  alert(`${savedShifts.length - favorites.length}件の履歴を削除しました`)
}

// 午前/午後切り替え時に時間を調整
watch(isPm, (newIsPm) => {
  if (newIsPm && selectedHour.value < 12) {
    selectedHour.value += 12
  } else if (!newIsPm && selectedHour.value >= 12) {
    selectedHour.value -= 12
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: #999;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.25rem;
}

.settings-section {
  margin-bottom: 1.5rem;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.4rem;
  border-bottom: 2px solid #667eea;
}

.time-setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.time-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.time-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #667eea;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
  justify-content: center;
}

.time-display:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.edit-icon {
  font-size: 0.875rem;
  color: #999;
}

.settings-note {
  font-size: 0.7rem;
  color: #999;
  margin: 0.5rem 0 0 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  justify-content: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.action-btn:hover {
  border-color: #ef4444;
  background: #fef2f2;
}

.action-icon {
  font-size: 1.125rem;
}

.action-label {
  font-weight: 600;
  color: #333;
}

/* Time Picker Modal */
.time-picker-modal {
  max-width: 350px;
}

.modal-section {
  margin-bottom: 1rem;
}

.modal-section-header {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
}

.toggle-input {
  display: none;
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 140px;
  height: 36px;
  background: #e0e0e0;
  border-radius: 18px;
  padding: 0 0.5rem;
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
}

.toggle-text-am,
.toggle-text-pm {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  z-index: 1;
  transition: color 0.3s;
}

.toggle-slider {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 64px;
  height: 30px;
  background: white;
  border-radius: 15px;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-label .toggle-slider {
  transform: translateX(70px);
}

.toggle-input:checked + .toggle-label .toggle-text-pm {
  color: #667eea;
}

.toggle-input:not(:checked) + .toggle-label .toggle-text-am {
  color: #667eea;
}

.hour-selector-row,
.minute-selector-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.hour-btn,
.minute-btn {
  padding: 0.6rem 0.3rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hour-btn:hover,
.minute-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.hour-btn.active,
.minute-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

.time-preview {
  text-align: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #666;
}

.time-preview span {
  font-weight: 700;
  color: #667eea;
  font-size: 1.125rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.apply-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.apply-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
