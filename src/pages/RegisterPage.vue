<template>
  <q-page class="register-page">
    <!-- Animated Background -->
    <div class="background-animation">
      <div class="bubble bubble-1"></div>
      <div class="bubble bubble-2"></div>
      <div class="bubble bubble-3"></div>
      <div class="bubble bubble-4"></div>
      <div class="bubble bubble-5"></div>
      <div class="bubble bubble-6"></div>
    </div>

    <div class="register-container">
      <!-- Logo with glow effect -->
      <div class="logo-wrapper">
        <q-icon name="person_add" size="80px" class="logo-icon" />
        <div class="logo-glow"></div>
      </div>

      <h1 class="welcome-title">
        <span class="gradient-text">Create Account</span>
      </h1>
      <p class="subtitle">Join the ChatZone community</p>

      <!-- Glassmorphism Card -->
      <q-card class="register-card">
        <q-card-section>
          <q-input
            v-model="nickname"
            label="Nickname"
            outlined
            dark
            class="input-field"
            :input-style="{ color: 'white' }"
          >
            <template v-slot:prepend>
              <q-icon name="badge" color="purple" />
            </template>
          </q-input>

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
              <q-icon name="lock" color="pink" />
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

          <q-input
            v-model="confirmPassword"
            label="Confirm Password"
            :type="showConfirmPassword ? 'text' : 'password'"
            outlined
            dark
            class="input-field"
            :input-style="{ color: 'white' }"
            :rules="[val => val === password || 'Passwords must match']"
          >
            <template v-slot:prepend>
              <q-icon name="lock_outline" color="amber" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="grey-5"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>

          <!-- Password Strength Indicator -->
          <div v-if="password" class="password-strength q-mb-md">
            <div class="strength-label">Password Strength:</div>
            <div class="strength-bars">
              <div class="strength-bar" :class="{ active: passwordStrength >= 1 }"></div>
              <div class="strength-bar" :class="{ active: passwordStrength >= 2 }"></div>
              <div class="strength-bar" :class="{ active: passwordStrength >= 3 }"></div>
              <div class="strength-bar" :class="{ active: passwordStrength >= 4 }"></div>
            </div>
            <span class="strength-text">{{ strengthText }}</span>
          </div>

          <q-btn
            label="Create Account"
            class="register-btn full-width q-mt-sm"
            @click="register"
            :loading="loading"
            unelevated
          >
            <template v-slot:loading>
              <q-spinner-dots color="white" />
            </template>
          </q-btn>

          <div class="divider">
            <span>already have an account?</span>
          </div>

          <q-btn
            outline
            label="Back to Login"
            class="login-btn full-width"
            @click="goToLogin"
            icon="arrow_back"
          />
        </q-card-section>
      </q-card>

      <!-- Footer -->
      <p class="footer-text">
        🔐 Your data is safe with us
      </p>
    </div>

    <!-- SUCCESS DIALOG -->
    <q-dialog v-model="showSuccess" persistent>
      <q-card class="success-dialog">
        <q-card-section class="text-center q-pa-lg">
          <q-icon name="check_circle" color="positive" size="80px" class="q-mb-md" />
          <div class="text-h5 text-positive q-mb-sm">Account Created! 🎉</div>
          <div class="text-grey-6">Welcome to ChatZone, {{ nickname }}!</div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-lg">
          <q-btn 
            label="Go to Login" 
            color="positive" 
            @click="goToLogin"
            unelevated
            class="q-px-xl"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ERROR DIALOG -->
    <q-dialog v-model="showError" persistent>
      <q-card class="error-dialog">
        <q-card-section class="row items-center">
          <q-icon name="error" color="negative" size="2rem" class="q-mr-sm" />
          <div class="text-h6">Registration Error</div>
        </q-card-section>
        <q-card-section>{{ errorMessage }}</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const nickname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)

const showSuccess = ref(false)
const showError = ref(false)
const errorMessage = ref('')

// Password strength calculator
const passwordStrength = computed(() => {
  const pwd = password.value
  let strength = 0
  if (pwd.length >= 6) strength++
  if (pwd.length >= 10) strength++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) strength++
  if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) strength++
  return strength
})

const strengthText = computed(() => {
  const texts = ['Weak', 'Fair', 'Good', 'Strong']
  return texts[passwordStrength.value - 1] || ''
})

async function register() {
  if (!nickname.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all fields.'
    showError.value = true
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    showError.value = true
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.'
    showError.value = true
    return
  }

  loading.value = true

  try {
    await axios.post('http://127.0.0.1:3333/register', {
      username: nickname.value,
      email: email.value,
      password: password.value
    })

    showSuccess.value = true

  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Server error.'
    showError.value = true
  }

  loading.value = false
}

function goToLogin() {
  router.push('/')
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
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
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.2), rgba(103, 58, 183, 0.2));
  animation: float 18s infinite ease-in-out;
}

.bubble-1 {
  width: 100px;
  height: 100px;
  left: 5%;
  top: 15%;
  animation-delay: 0s;
}

.bubble-2 {
  width: 140px;
  height: 140px;
  right: 10%;
  top: 25%;
  animation-delay: 3s;
}

.bubble-3 {
  width: 70px;
  height: 70px;
  left: 25%;
  bottom: 25%;
  animation-delay: 5s;
}

.bubble-4 {
  width: 90px;
  height: 90px;
  right: 20%;
  bottom: 20%;
  animation-delay: 7s;
}

.bubble-5 {
  width: 55px;
  height: 55px;
  left: 45%;
  top: 8%;
  animation-delay: 9s;
}

.bubble-6 {
  width: 65px;
  height: 65px;
  right: 35%;
  bottom: 10%;
  animation-delay: 11s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-40px) rotate(180deg) scale(1.1);
    opacity: 0.7;
  }
}

/* Container */
.register-container {
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
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Logo */
.logo-wrapper {
  position: relative;
  margin-bottom: 15px;
}

.logo-icon {
  color: white;
  filter: drop-shadow(0 0 25px rgba(233, 69, 96, 0.6));
  animation: pulse 3s infinite ease-in-out;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(233, 69, 96, 0.25) 0%, transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

/* Title */
.welcome-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  text-align: center;
}

.gradient-text {
  background: linear-gradient(90deg, #e94560, #7c4dff, #00bcd4);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient 4s ease infinite;
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
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
  margin: 0 0 25px 0;
  letter-spacing: 1.5px;
}

/* Glassmorphism Card */
.register-card {
  width: 400px;
  max-width: 95vw;
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px !important;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
}

.input-field {
  margin-bottom: 14px;
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
  border-color: rgba(233, 69, 96, 0.5);
}

.input-field :deep(.q-field--outlined.q-field--focused .q-field__control:after) {
  border-color: #e94560;
  border-width: 2px;
}

/* Password Strength */
.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

.strength-bars {
  display: flex;
  gap: 4px;
}

.strength-bar {
  width: 30px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.strength-bar.active:nth-child(1) {
  background: #e94560;
}

.strength-bar.active:nth-child(2) {
  background: #ff9800;
}

.strength-bar.active:nth-child(3) {
  background: #8bc34a;
}

.strength-bar.active:nth-child(4) {
  background: #4caf50;
}

.strength-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  font-weight: 500;
}

/* Buttons */
.register-btn {
  background: linear-gradient(135deg, #e94560, #7c4dff) !important;
  color: white !important;
  font-weight: 600;
  font-size: 1rem;
  padding: 14px 24px;
  border-radius: 14px !important;
  text-transform: none;
  transition: all 0.3s ease;
}

.register-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(233, 69, 96, 0.4);
}

.divider {
  display: flex;
  align-items: center;
  margin: 18px 0;
  color: rgba(255, 255, 255, 0.35);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
}

.divider span {
  padding: 0 12px;
  font-size: 0.85rem;
}

.login-btn {
  border-color: rgba(255, 255, 255, 0.25) !important;
  color: white !important;
  font-weight: 500;
  border-radius: 14px !important;
  text-transform: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

/* Footer */
.footer-text {
  color: rgba(255, 255, 255, 0.35);
  margin-top: 25px;
  font-size: 0.85rem;
}

/* Dialogs */
.error-dialog,
.success-dialog {
  border-radius: 20px;
  min-width: 320px;
}

.success-dialog {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.full-width {
  width: 100%;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .welcome-title {
    font-size: 1.6rem;
  }
  
  .logo-icon {
    font-size: 60px !important;
  }
  
  .register-card {
    padding: 8px;
  }
  
  .strength-bar {
    width: 22px;
  }
}
</style>
