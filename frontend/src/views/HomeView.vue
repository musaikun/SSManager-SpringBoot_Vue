<template>
  <div class="home-container">
    <!-- タイトルを3つに分割 -->
    <h1 class="wind-text">
      <span class="title-s">S</span>
      <span class="shine-x">×</span>
      <span class="title-s2">S Manager</span>
    </h1>

    <!-- 始めるボタン（中央配置） -->
    <div class="btn-wrapper">
      <button class="main-btn" @click="startAnimation">始める</button>
    </div>

    <!-- ログインフォーム（初期非表示） -->
    <div class="login-form" :class="{ show: showLoginForm }">
      <input type="text" placeholder="ユーザーID">
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showLoginForm = ref(false)
const animationPlayed = ref(false)

/**
 * アニメーション開始
 */
const startAnimation = () => {
  if (animationPlayed.value) return
  animationPlayed.value = true

  // TODO: アニメーション実装
  // 今は単純にログインフォームを表示
  setTimeout(() => {
    showLoginForm.value = true
  }, 500)
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
  font-size: 4rem;
  letter-spacing: 0.05em;
  gap: 8px;
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
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
}

.login-form button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(111, 58, 208, 0.4);
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
</style>
