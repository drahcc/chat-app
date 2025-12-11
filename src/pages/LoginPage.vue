<template>
  <q-page class="login-page">
    <div class="login-container">
      <!-- Logo -->
      <div class="logo-wrapper">
        <img
          src="~assets/logo1png.png"
          alt="ChatZone Logo"
          class="logo-img"
        />
      </div>

      <h1 class="welcome-title">ChatZone</h1>
      <p class="subtitle">Connect, Chat, Share</p>

      <!-- Login Form Card -->
      <q-card class="login-card">
        <q-card-section>
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            class="input-field"
          />

          <q-input
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            class="input-field"
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
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
          />

          <div class="divider">
            <span>Don't have an account?</span>
          </div>

          <q-btn
            outline
            label="Create Account"
            class="register-btn full-width"
            @click="goToRegister"
          />
        </q-card-section>
      </q-card>
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
          Welcome back, <strong>{{ successUsername }}</strong>!
        </q-card-section>
        <q-card-actions align="right">
          <q-btn 
            label="Continue" 
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  width: 100%;
  max-width: 400px;
}

/* Logo */
.logo-wrapper {
  margin-bottom: 30px;
}

.logo-img {
  width: 120px;
  height: auto;
}

/* Title */
.welcome-title {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-align: center;
  color: #1a1a1a;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0 0 40px 0;
  text-align: center;
  letter-spacing: 0.5px;
}

/* Login Card */
.login-card {
  width: 100%;
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: none !important;
}

.input-field {
  margin-bottom: 16px;
}

.input-field :deep(.q-field__label) {
  color: #666;
}

.input-field :deep(.q-field--outlined .q-field__control:before) {
  border-color: #ddd;
}

.input-field :deep(.q-field--outlined .q-field__control:hover:before) {
  border-color: #bbb;
}

.input-field :deep(.q-field--outlined.q-field--focused .q-field__control:after) {
  border-color: #007bff;
  border-width: 2px;
}

/* Buttons */
.login-btn {
  background: #007bff !important;
  color: white !important;
  font-weight: 600;
  font-size: 1rem;
  padding: 12px 24px;
  border-radius: 8px !important;
  text-transform: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: #0056b3 !important;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0 16px 0;
  color: #999;
  font-size: 0.9rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}

.divider span {
  padding: 0 12px;
}

.register-btn {
  border-color: #ddd !important;
  color: #333 !important;
  font-weight: 500;
  border-radius: 8px !important;
  text-transform: none;
  transition: all 0.3s ease;
}

.register-btn:hover {
  background: #f0f0f0 !important;
  border-color: #bbb !important;
}

/* Dialogs */
.error-dialog,
.success-dialog {
  border-radius: 12px;
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
}
</style>
