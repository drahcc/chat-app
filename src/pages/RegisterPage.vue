<template>
  <q-page class="register-page">
    <div class="register-container">
      <!-- Icon -->
      <div class="icon-wrapper">
        <q-icon name="person_add" size="60px" color="primary" />
      </div>

      <h1 class="welcome-title">Create Account</h1>
      <p class="subtitle">Join the ChatZone community</p>

      <!-- Registration Form Card -->
      <q-card class="register-card">
        <q-card-section>
          <q-input
            v-model="nickname"
            label="Nickname"
            outlined
            dense
            class="input-field"
          />

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

          <q-input
            v-model="confirmPassword"
            label="Confirm Password"
            :type="showConfirmPassword ? 'text' : 'password'"
            outlined
            dense
            class="input-field"
          >
            <template v-slot:append>
              <q-icon
                :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>

          <q-btn
            label="Create Account"
            class="register-btn full-width q-mt-md"
            @click="register"
            :loading="loading"
            unelevated
          />

          <div class="divider">
            <span>Already have an account?</span>
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
    </div>

    <!-- SUCCESS DIALOG -->
    <q-dialog v-model="showSuccess" persistent>
      <q-card class="success-dialog">
        <q-card-section class="text-center q-pa-lg">
          <q-icon name="check_circle" color="positive" size="80px" class="q-mb-md" />
          <div class="text-h5 text-positive q-mb-sm">Account Created!</div>
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  width: 100%;
  max-width: 400px;
}

/* Icon */
.icon-wrapper {
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
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

/* Register Card */
.register-card {
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
.register-btn {
  background: #007bff !important;
  color: white !important;
  font-weight: 600;
  font-size: 1rem;
  padding: 12px 24px;
  border-radius: 8px !important;
  text-transform: none;
  transition: all 0.3s ease;
}

.register-btn:hover {
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

.login-btn {
  border-color: #ddd !important;
  color: #333 !important;
  font-weight: 500;
  border-radius: 8px !important;
  text-transform: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
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
}
</style>
