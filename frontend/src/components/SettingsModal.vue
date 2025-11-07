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
            <div class="time-settings">
              <div class="time-input-group">
                <label class="time-label">開始時刻</label>
                <input
                  type="time"
                  v-model="defaultStartTime"
                  class="time-input"
                />
              </div>
              <div class="time-input-group">
                <label class="time-label">終了時刻</label>
                <input
                  type="time"
                  v-model="defaultEndTime"
                  class="time-input"
                />
              </div>
            </div>
            <p class="settings-note">※ 新規シフト作成時のデフォルト時刻として使用されます</p>
          </div>

          <!-- 履歴管理 -->
          <div class="settings-section">
            <h3 class="section-title">履歴管理</h3>
            <button @click="deleteNonFavorites" class="action-btn delete-history-btn">
              <span class="action-icon">🗑️</span>
              <span class="action-label">お気に入り以外の履歴を削除</span>
            </button>
            <p class="settings-note">※ ⭐お気に入り登録されたシフトは残ります</p>
          </div>

          <!-- その他の設定 -->
          <div class="settings-section">
            <h3 class="section-title">その他</h3>
            <div class="toggle-setting">
              <label class="toggle-label">
                <input
                  type="checkbox"
                  v-model="autoCalculateBreak"
                  class="toggle-checkbox"
                />
                <span class="toggle-text">休憩時間を自動計算</span>
              </label>
              <p class="toggle-desc">勤務時間に応じて休憩時間を自動で差し引きます</p>
            </div>
          </div>

          <!-- 保存ボタン -->
          <div class="button-section">
            <button @click="saveSettings" class="save-btn">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// 設定の状態
const defaultStartTime = ref('09:00')
const defaultEndTime = ref('18:00')
const autoCalculateBreak = ref(true)

// LocalStorageから設定を読み込み
const loadSettings = () => {
  const savedSettings = localStorage.getItem('appSettings')
  if (savedSettings) {
    const settings = JSON.parse(savedSettings)
    defaultStartTime.value = settings.defaultStartTime || '09:00'
    defaultEndTime.value = settings.defaultEndTime || '18:00'
    autoCalculateBreak.value = settings.autoCalculateBreak !== false
  }
}

// 設定を保存
const saveSettings = () => {
  const settings = {
    defaultStartTime: defaultStartTime.value,
    defaultEndTime: defaultEndTime.value,
    autoCalculateBreak: autoCalculateBreak.value
  }
  localStorage.setItem('appSettings', JSON.stringify(settings))
  alert('設定を保存しました')
  emit('close')
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

// モーダルが開いたら設定を読み込み
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadSettings()
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.time-settings {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.time-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.time-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
}

.settings-note {
  font-size: 0.75rem;
  color: #999;
  margin: 0.5rem 0 0 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.action-btn:hover {
  border-color: #ef4444;
  background: #fef2f2;
}

.action-icon {
  font-size: 1.25rem;
}

.action-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.toggle-setting {
  margin-bottom: 1rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggle-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.toggle-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.toggle-desc {
  font-size: 0.75rem;
  color: #999;
  margin: 0.25rem 0 0 2rem;
}

.button-section {
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.save-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}
</style>
