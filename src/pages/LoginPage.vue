<template>
  <q-page class="login-page">
    <!-- Animated Background -->
    <div class="background-animation">
      <div class="bubble bubble-1"></div>
      <div class="bubble bubble-2"></div>
      <div class="bubble bubble-3"></div>
      <div class="bubble bubble-4"></div>
      <div class="bubble bubble-5"></div>
    </div>

    <div class="login-container">
      <!-- Logo with glow effect -->
      <div class="logo-wrapper">
        <img
          src="~assets/logo1png.png"
          alt="ChatZone Logo"
          class="logo-img"
        />
        <div class="logo-glow"></div>
      </div>

      <h1 class="welcome-title">
        <span class="gradient-text">Welcome to ChatZone</span>
      </h1>
      <p class="subtitle">Connect, Chat, Share</p>

      <!-- Glassmorphism Card -->
      <q-card class="login-card">
        <q-card-section>
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dark
            class="input-field"
            :input-style="{ color: 'white' }"
          >
            <template v-slot:prepend>
              <q-icon name="email" color="cyan" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dark
            class="input-field"
            :input-style="{ color: 'white' }"
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="cyan" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="grey-5"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-btn
            label="Sign In"
            class="login-btn full-width q-mt-md"
            @click="handleLogin"
            :loading="loading"
            unelevated
          >
            <template v-slot:loading>
              <q-spinner-dots color="white" />
            </template>
          </q-btn>

          <div class="divider">
            <span>or</span>
          </div>

          <q-btn
            outline
            label="Create Account"
            class="register-btn full-width"
            @click="goToRegister"
          />
        </q-card-section>
      </q-card>

      <!-- Footer -->
      <p class="footer-text">
        🔒 Secure & Encrypted
      </p>
    </div>

    <!-- ERROR DIALOG -->
    <q-dialog v-model="showError" persistent>
      <q-card class="error-dialog">
        <q-card-section class="row items-center">
          <q-icon name="error" color="negative" size="2rem" class="q-mr-sm" />
          <div class="text-h6">Login Error</div>
        </q-card-section>
        <q-card-section>{{ errorMessage }}</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- SUCCESS DIALOG -->
    <q-dialog v-model="showSuccess" persistent>
      <q-card class="success-dialog">
        <q-card-section class="row items-center">
          <q-icon name="check_circle" color="positive" size="2rem" class="q-mr-sm" />
          <div class="text-h6 text-positive">Login Successful!</div>
        </q-card-section>
        <q-card-section>
          Welcome back, <strong>{{ successUsername }}</strong>! 🎉
        </q-card-section>
        <q-card-actions align="right">
          <q-btn 
            label="Continue to Channels" 
            color="positive" 
            @click="continueToChannels"
            unelevated
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showError = ref(false)
const showSuccess = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const successUsername = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    showError.value = true
    errorMessage.value = 'Please fill in all fields'
    return
  }

  loading.value = true

  const result = await authStore.loginUser(email.value, password.value)

  if (result.success && result.user) {
    successUsername.value = result.user.username || 'User'
    showSuccess.value = true
  } else {
    showError.value = true
    errorMessage.value = result.error || 'Unknown login error'
  }

  loading.value = false
}

function continueToChannels() {
  showSuccess.value = false
  router.push('/channels')
}

function goToRegister() {
  router.push('/register')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  position: relative;
  overflow: hidden;
}

/* Animated Background Bubbles */
.background-animation {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.3), rgba(103, 58, 183, 0.3));
  animation: float 15s infinite ease-in-out;
}

.bubble-1 {
  width: 80px;
  height: 80px;
  left: 10%;
  top: 20%;
  animation-delay: 0s;
}

.bubble-2 {
  width: 120px;
  height: 120px;
  right: 15%;
  top: 30%;
  animation-delay: 2s;
}

.bubble-3 {
  width: 60px;
  height: 60px;
  left: 30%;
  bottom: 20%;
  animation-delay: 4s;
}

.bubble-4 {
  width: 100px;
  height: 100px;
  right: 25%;
  bottom: 15%;
  animation-delay: 6s;
}

.bubble-5 {
  width: 50px;
  height: 50px;
  left: 50%;
  top: 10%;
  animation-delay: 8s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
    opacity: 0.8;
  }
}

/* Container */
.login-container {
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Logo */
.logo-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.logo-img {
  width: 140px;
  height: auto;
  filter: drop-shadow(0 0 20px rgba(0, 188, 212, 0.5));
  animation: pulse 3s infinite ease-in-out;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(0, 188, 212, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Title */
.welcome-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 10px 0;
  text-align: center;
}

.gradient-text {
  background: linear-gradient(90deg, #00bcd4, #7c4dff, #ff4081);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient 3s ease infinite;
}

@keyframes gradient {
  0%, 100% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
}

.subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  margin: 0 0 30px 0;
  letter-spacing: 2px;
}

/* Glassmorphism Card */
.login-card {
  width: 380px;
  max-width: 95vw;
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.input-field {
  margin-bottom: 16px;
}

.input-field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.input-field :deep(.q-field__label) {
  color: rgba(255, 255, 255, 0.7);
}

.input-field :deep(.q-field--outlined .q-field__control:before) {
  border-color: rgba(255, 255, 255, 0.2);
}

.input-field :deep(.q-field--outlined .q-field__control:hover:before) {
  border-color: rgba(0, 188, 212, 0.5);
}

.input-field :deep(.q-field--outlined.q-field--focused .q-field__control:after) {
  border-color: #00bcd4;
  border-width: 2px;
}

/* Buttons */
.login-btn {
  background: linear-gradient(135deg, #00bcd4, #7c4dff) !important;
  color: white !important;
  font-weight: 600;
  font-size: 1rem;
  padding: 12px 24px;
  border-radius: 12px !important;
  text-transform: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 188, 212, 0.4);
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: rgba(255, 255, 255, 0.4);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.divider span {
  padding: 0 15px;
  font-size: 0.9rem;
}

.register-btn {
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  font-weight: 500;
  border-radius: 12px !important;
  text-transform: none;
  transition: all 0.3s ease;
}

.register-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

/* Footer */
.footer-text {
  color: rgba(255, 255, 255, 0.4);
  margin-top: 30px;
  font-size: 0.85rem;
}

/* Dialogs */
.error-dialog,
.success-dialog {
  border-radius: 16px;
}

.full-width {
  width: 100%;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .welcome-title {
    font-size: 1.8rem;
  }
  
  .logo-img {
    width: 100px;
  }
  
  .login-card {
    padding: 10px;
  }
}
</style>
