<template>
  <div class="circular-time-picker">
    <!-- 円形時計エリア -->
    <div class="clock-container">
      <svg :width="svgSize" :height="svgSize" class="clock-svg">
        <!-- 背景円 -->
        <circle
          :cx="centerX"
          :cy="centerY"
          :r="outerRadius + 20"
          fill="transparent"
          stroke="#e0e0e0"
          stroke-width="1"
        />

        <!-- 時間選択（外側の円） -->
        <g class="hours-layer">
          <g
            v-for="hour in displayHours"
            :key="'hour-' + hour"
            class="hour-item"
            @click="selectHour(hour)"
          >
            <circle
              :cx="getHourPosition(hour).x"
              :cy="getHourPosition(hour).y"
              :r="28"
              :class="{ active: currentHour === hour }"
              class="hour-circle"
            />
            <text
              :x="getHourPosition(hour).x"
              :y="getHourPosition(hour).y"
              class="hour-text"
              :class="{ active: currentHour === hour }"
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {{ hour }}
            </text>
          </g>
        </g>

        <!-- 分選択（内側の円） -->
        <g class="minutes-layer">
          <g
            v-for="minuteData in minutePositions"
            :key="'minute-' + minuteData.minute"
            class="minute-item"
            @click="selectMinute(minuteData.minute)"
          >
            <circle
              :cx="getMinutePosition(minuteData.angle).x"
              :cy="getMinutePosition(minuteData.angle).y"
              :r="24"
              :class="{ active: currentMinute === minuteData.minute }"
              class="minute-circle"
            />
            <text
              :x="getMinutePosition(minuteData.angle).x"
              :y="getMinutePosition(minuteData.angle).y"
              class="minute-text"
              :class="{ active: currentMinute === minuteData.minute }"
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {{ String(minuteData.minute).padStart(2, '0') }}
            </text>
          </g>
        </g>

        <!-- 中央のAM/PMトグル -->
        <g class="period-toggle" @click="togglePeriod">
          <rect
            :x="centerX - 35"
            :y="centerY - 20"
            width="70"
            height="40"
            rx="20"
            :class="{ pm: isPM }"
            class="toggle-bg"
          />
          <text
            :x="centerX"
            :y="centerY + 6"
            class="toggle-text"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ isPM ? 'PM' : 'AM' }}
          </text>
        </g>
      </svg>

      <!-- 現在選択中の時刻表示 -->
      <div class="current-selection">
        選択中: <span class="time-display">{{ formattedCurrentTime }}</span>
      </div>
    </div>

    <!-- 確定エリア -->
    <div class="confirm-area">
      <div class="time-displays">
        <div class="time-slot" :class="{ filled: startTime !== null }">
          <div class="slot-label">開始時間</div>
          <div class="slot-time">{{ startTime || '--:--' }}</div>
        </div>
        <div class="time-slot" :class="{ filled: endTime !== null }">
          <div class="slot-label">終了時間</div>
          <div class="slot-time">{{ endTime || '--:--' }}</div>
        </div>
      </div>

      <div class="action-buttons">
        <button
          @click="confirmTime('start')"
          :disabled="!canConfirm"
          class="confirm-btn start-btn"
        >
          開始時間に設定
        </button>
        <button
          @click="confirmTime('end')"
          :disabled="!canConfirm"
          class="confirm-btn end-btn"
        >
          終了時間に設定
        </button>
      </div>

      <button
        @click="resetSelection"
        class="reset-btn"
      >
        選択をクリア
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  initialStartTime?: string | null
  initialEndTime?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  initialStartTime: null,
  initialEndTime: null
})

// Emits
const emit = defineEmits<{
  (e: 'update:startTime', value: string | null): void
  (e: 'update:endTime', value: string | null): void
  (e: 'confirm', data: { startTime: string | null; endTime: string | null }): void
}>()

// SVGサイズ設定
const svgSize = 360
const centerX = svgSize / 2
const centerY = svgSize / 2
const outerRadius = 120 // 時間の円
const innerRadius = 60  // 分の円

// 状態管理
const currentHour = ref<number | null>(null)
const currentMinute = ref<number | null>(null)
const isPM = ref(false)
const startTime = ref<string | null>(props.initialStartTime)
const endTime = ref<string | null>(props.initialEndTime)

// 表示する時間（AM: 0-11, PM: 12-23）
const displayHours = computed(() => {
  if (isPM.value) {
    return [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  } else {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  }
})

// 分の位置データ（4方向）
const minutePositions = [
  { minute: 0, angle: -90 },   // 12時方向
  { minute: 15, angle: 0 },    // 3時方向
  { minute: 30, angle: 90 },   // 6時方向
  { minute: 45, angle: 180 }   // 9時方向
]

// 時間の位置を計算
const getHourPosition = (hour: number) => {
  const index = displayHours.value.indexOf(hour)
  const angle = (index * 30 - 90) * (Math.PI / 180) // 12個を30度ずつ配置
  return {
    x: centerX + outerRadius * Math.cos(angle),
    y: centerY + outerRadius * Math.sin(angle)
  }
}

// 分の位置を計算
const getMinutePosition = (angleDeg: number) => {
  const angleRad = angleDeg * (Math.PI / 180)
  return {
    x: centerX + innerRadius * Math.cos(angleRad),
    y: centerY + innerRadius * Math.sin(angleRad)
  }
}

// 現在選択中の時刻をフォーマット
const formattedCurrentTime = computed(() => {
  const hourStr = currentHour.value !== null
    ? String(currentHour.value).padStart(2, '0')
    : '--'
  const minuteStr = currentMinute.value !== null
    ? String(currentMinute.value).padStart(2, '0')
    : '--'
  return `${hourStr}:${minuteStr}`
})

// 確定ボタンの有効化判定（時間と分の両方が選択済み）
const canConfirm = computed(() => {
  return currentHour.value !== null && currentMinute.value !== null
})

// 時間を選択
const selectHour = (hour: number) => {
  currentHour.value = hour
  // 時間に応じてAM/PMを自動設定
  isPM.value = hour >= 12
}

// 分を選択
const selectMinute = (minute: number) => {
  currentMinute.value = minute
}

// AM/PMトグル
const togglePeriod = () => {
  isPM.value = !isPM.value
  // 現在選択中の時間を更新
  if (currentHour.value !== null) {
    if (isPM.value && currentHour.value < 12) {
      currentHour.value += 12
    } else if (!isPM.value && currentHour.value >= 12) {
      currentHour.value -= 12
    }
  }
}

// 時刻を確定
const confirmTime = (type: 'start' | 'end') => {
  if (!canConfirm.value) return

  const timeStr = formattedCurrentTime.value

  if (type === 'start') {
    startTime.value = timeStr
    emit('update:startTime', timeStr)
  } else {
    endTime.value = timeStr
    emit('update:endTime', timeStr)
  }

  // 選択をクリア
  resetSelection()
}

// 選択をクリア
const resetSelection = () => {
  currentHour.value = null
  currentMinute.value = null
}

// 全体を確定（親コンポーネントに通知）
const confirmAll = () => {
  emit('confirm', {
    startTime: startTime.value,
    endTime: endTime.value
  })
}

// 外部から呼び出せるようにexposeする
defineExpose({
  confirmAll,
  resetAll: () => {
    startTime.value = null
    endTime.value = null
    resetSelection()
  }
})
</script>

<style scoped>
.circular-time-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.clock-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.clock-svg {
  cursor: pointer;
  user-select: none;
}

/* 時間の円 */
.hour-circle {
  fill: #f5f5f5;
  stroke: #e0e0e0;
  stroke-width: 2;
  transition: all 0.2s ease;
  cursor: pointer;
}

.hour-circle:hover {
  fill: rgba(102, 126, 234, 0.1);
  stroke: #667eea;
}

.hour-circle.active {
  fill: #667eea;
  stroke: #667eea;
  stroke-width: 3;
}

.hour-text {
  font-size: 16px;
  font-weight: 600;
  fill: #333;
  pointer-events: none;
  transition: all 0.2s ease;
}

.hour-text.active {
  fill: white;
  font-size: 18px;
}

/* 分の円 */
.minute-circle {
  fill: #f8f9fa;
  stroke: #d0d0d0;
  stroke-width: 2;
  transition: all 0.2s ease;
  cursor: pointer;
}

.minute-circle:hover {
  fill: rgba(16, 185, 129, 0.1);
  stroke: #10b981;
}

.minute-circle.active {
  fill: #10b981;
  stroke: #10b981;
  stroke-width: 3;
}

.minute-text {
  font-size: 14px;
  font-weight: 600;
  fill: #666;
  pointer-events: none;
  transition: all 0.2s ease;
}

.minute-text.active {
  fill: white;
  font-size: 16px;
}

/* AM/PMトグル */
.period-toggle {
  cursor: pointer;
}

.toggle-bg {
  fill: #e0e0e0;
  transition: all 0.3s ease;
}

.toggle-bg:hover {
  fill: #d0d0d0;
}

.toggle-bg.pm {
  fill: #667eea;
}

.toggle-text {
  font-size: 16px;
  font-weight: 700;
  fill: #666;
  pointer-events: none;
  transition: all 0.3s ease;
}

.toggle-bg.pm + .toggle-text {
  fill: white;
}

/* 現在選択中の時刻 */
.current-selection {
  font-size: 1rem;
  color: #666;
  font-weight: 600;
}

.time-display {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

/* 確定エリア */
.confirm-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 360px;
}

.time-displays {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.time-slot {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  text-align: center;
  transition: all 0.3s ease;
}

.time-slot.filled {
  background: #e8f5e9;
  border-color: #4caf50;
}

.slot-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.slot-time {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
}

.time-slot.filled .slot-time {
  color: #4caf50;
}

/* ボタン */
.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.confirm-btn {
  padding: 0.875rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.start-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.start-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.end-btn {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
}

.end-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);
}

.reset-btn {
  padding: 0.75rem;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: #e0e0e0;
}

/* レスポンシブ */
@media (max-width: 480px) {
  .circular-time-picker {
    padding: 1rem;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
