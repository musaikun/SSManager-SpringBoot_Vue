<template>
  <div class="home-container">
    <!-- タイトルを3つに分割 -->
    <h1 class="wind-text">
      <span ref="titleSRef" class="title-s" :class="{ 'fade-out-left': isAnimating }">S</span>
      <span ref="shineXRef" class="shine-x" :class="{ exploding: isExploding }">×</span>
      <span ref="titleS2Ref" class="title-s2" :class="{ 'fade-out-right': isAnimating }">S Manager</span>
    </h1>

    <!-- 始めるボタン（中央配置） -->
    <div class="btn-wrapper" :class="{ hidden: isAnimating }">
      <button class="main-btn" @click="startAnimation" :disabled="animationPlayed">始める</button>
    </div>

    <!-- ログインフォーム（初期非表示） -->
    <div class="login-form" :class="{ show: showLoginForm }">
      <input ref="firstInputRef" type="text" placeholder="ユーザーID">
      <input type="password" placeholder="パスワード">
      <button @click="handleLogin">新規登録</button>
    </div>

    <!-- 著作権表示 -->
    <footer class="copyright">
      © 2025 無才 / S×S Manager
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showLoginForm = ref(false)
const animationPlayed = ref(false)
const isAnimating = ref(false)
const isExploding = ref(false)

// 要素への参照
const titleSRef = ref<HTMLElement | null>(null)
const titleS2Ref = ref<HTMLElement | null>(null)
const shineXRef = ref<HTMLElement | null>(null)
const firstInputRef = ref<HTMLInputElement | null>(null)

/**
 * アニメーション開始
 */
const startAnimation = async () => {
  if (animationPlayed.value) return
  animationPlayed.value = true
  isAnimating.value = true

  // DOM更新を待つ
  await nextTick()

  // 700ms後に星分解アニメーション開始
  setTimeout(() => {
    explodeShine()
    showLoginFormDelayed()
  }, 700)
}

/**
 * × を星に分解するアニメーション
 */
const explodeShine = () => {
  if (!shineXRef.value) return

  const rect = shineXRef.value.getBoundingClientRect()
  const xCenter = rect.left + rect.width / 2
  const yCenter = rect.top + rect.height / 2

  // 星パーティクルを生成（40個）
  const particleCount = 40
  for (let i = 0; i < particleCount; i++) {
    createParticle(xCenter, yCenter)
  }

  // × 本体をクラス追加でズームアウト＆フェードアウト
  isExploding.value = true
}

/**
 * パーティクルを生成・アニメーション
 */
const createParticle = (xCenter: number, yCenter: number) => {
  const star = document.createElement('div')
  star.classList.add('x-star')

  // ランダム方向・距離を計算
  const angle = Math.random() * Math.PI * 2
  const distance = Math.random() * 160 + 40
  const tx = Math.cos(angle) * distance
  const ty = Math.sin(angle) * distance

  // CSS変数に設定
  star.style.setProperty('--tx', `${tx}px`)
  star.style.setProperty('--ty', `${ty}px`)

  // 位置を設定
  star.style.left = `${xCenter}px`
  star.style.top = `${yCenter}px`

  // DOMに追加してアニメーション開始
  document.body.appendChild(star)
  star.style.animation = `starExplode 1.5s ease-out forwards`
  star.style.opacity = '1'

  // アニメーション終了後にDOM削除
  setTimeout(() => {
    if (star.parentNode) {
      star.remove()
    }
  }, 1600)
}

/**
 * ログインフォーム表示
 */
const showLoginFormDelayed = () => {
  setTimeout(() => {
    showLoginForm.value = true
    // フォーカスを最初の入力欄に移動
    nextTick(() => {
      if (firstInputRef.value) {
        firstInputRef.value.focus()
      }
    })
  }, 1600)
}

/**
 * ログイン処理（仮）
 */
const handleLogin = () => {
  // TODO: 認証処理
  // 今はカレンダーページに遷移
  router.push('/calendar')
}
</script>

<style scoped>
/* === 背景 === */
.home-container {
  margin: 0;
  min-height: 100vh;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans JP', sans-serif;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background: linear-gradient(135deg, #1b1b15, #2f3a2a, #3e2f1d, #1f2b1f),
              linear-gradient(225deg, #2f3a2a, #1f2b1f, #1b1b15, #3e2f1d),
              linear-gradient(315deg, #3e2f1d, #1b1b15, #2f3a2a, #1f2b1f);
  background-size: 400% 400%;
  animation: bgFlow 25s ease infinite;
}

@keyframes bgFlow {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}

/* === 中央タイトル === */
.wind-text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: clamp(2rem, 8vw, 4rem); /* レスポンシブ: 最小2rem、最大4rem */
  letter-spacing: 0.05em;
  gap: 8px;
  margin: 0;
  padding: 0 1rem; /* 左右に余白を追加 */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  white-space: nowrap; /* 折り返しを防ぐ */
}

/* スマホ対応: さらに小さい画面 */
@media (max-width: 480px) {
  .wind-text {
    font-size: clamp(1.5rem, 10vw, 2.5rem);
    gap: 4px;
  }
}

.title-s, .title-s2 {
  background: linear-gradient(-60deg, rgba(255,255,255,0.9), rgba(220,250,255,0.4), rgba(255,255,255,0.9));
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: windFlow 5s linear infinite;
  transition: transform 0.8s ease, opacity 0.8s ease;
}

@keyframes windFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* === × === */
.shine-x {
  background: linear-gradient(120deg, #3a0d6f, #7c3aff, #d9b3ff, #6f3ad0);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 2px #b393ff)
          drop-shadow(0 0 6px #d9b3ff)
          drop-shadow(0 0 12px #6f3ad0);
  animation: shineMove 3s ease-in-out infinite, flicker 0.8s infinite;
  display: inline-block;
  position: relative;
  z-index: 10;
}

@keyframes shineMove {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

/* === ボタン === */
.btn-wrapper {
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  transition: opacity 0.3s ease;
}

.main-btn {
  padding: 1rem 3rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #6f3ad0, #a36bff);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(111, 58, 208, 0.4);
  transition: all 0.3s ease;
}

.main-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(111, 58, 208, 0.6);
}

.main-btn:active {
  transform: translateY(0);
}

/* スマホ対応: ボタン */
@media (max-width: 480px) {
  .main-btn {
    padding: 0.75rem 2rem;
    font-size: 1rem;
  }
}

/* === ログインフォーム === */
.login-form {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  width: min(400px, 90vw); /* レスポンシブ幅 */
  max-width: 400px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
  z-index: 3;
}

.login-form.show {
  opacity: 1;
  pointer-events: auto;
}

.login-form input {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 8px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.login-form button {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #6f3ad0, #a36bff);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.login-form button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(111, 58, 208, 0.4);
}

/* スマホ対応: ログインフォーム */
@media (max-width: 480px) {
  .login-form {
    padding: 1.5rem;
    gap: 0.75rem;
  }

  .login-form input {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
  }

  .login-form button {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
  }
}

/* === 著作権 === */
.copyright {
  position: absolute;
  bottom: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  z-index: 5;
}

/* === アニメーション === */
/* タイトルのフェードアウト（左） */
.title-s.fade-out-left {
  transform: translateX(-60px);
  opacity: 0;
}

/* タイトルのフェードアウト（右） */
.title-s2.fade-out-right {
  transform: translateX(60px);
  opacity: 0;
}

/* ボタンの非表示 */
.btn-wrapper.hidden {
  opacity: 0;
  pointer-events: none;
}

/* ×の爆発エフェクト */
.shine-x.exploding {
  animation: none !important;
  transition: opacity 1.5s ease-out, transform 1.5s ease-in, filter 1.5s ease-out !important;
  opacity: 0 !important;
  transform: scale(15) !important;
  filter: drop-shadow(0 0 0px rgba(0,0,0,0)) !important;
  visibility: hidden !important;
}
</style>

<style>
/* グローバルスタイル: 星パーティクル（scoped外で定義） */
.x-star {
  position: fixed;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #a36bff 0%, rgba(255,255,255,0) 80%);
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  will-change: transform, opacity;
  z-index: 100;
}

@keyframes starExplode {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(0.5);
  }
}
</style>
