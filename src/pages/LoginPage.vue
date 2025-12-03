<template>
  <q-page class="flex flex-center column bg-grey-2 q-pa-md">

    <img
      src="~assets/logo1png.png"
      alt="ChatZone Logo"
      style="width: 120px; margin-bottom: 20px;"
    />

    <div class="text-h4 q-mb-lg text-primary text-bold">
      Welcome to ChatZone
    </div>

    <q-card class="q-pa-lg" style="width: 300px; max-width: 90%;">
      <q-input v-model="email" label="Email" type="email" outlined class="q-mb-md" />
      <q-input v-model="password" label="Password" type="password" outlined class="q-mb-md" />

      <q-btn
        label="Sign In"
        color="primary"
        class="full-width q-mb-sm"
        @click="handleLogin"
        :loading="loading"
      />

      <q-btn
        flat
        label="Create Account"
        color="primary"
        @click="goToRegister"
        class="full-width"
      />
    </q-card>

    <!-- ERROR DIALOG -->
    <q-dialog v-model="showError" persistent>
      <q-card>
        <q-card-section><div class="text-h6">Login Error</div></q-card-section>
        <q-card-section>{{ errorMessage }}</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- SUCCESS DIALOG -->
    <q-dialog v-model="showSuccess" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6 text-positive">✅ Login Successful!</div>
        </q-card-section>
        <q-card-section>
          Welcome back, {{ successUsername }}!
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Continue to Channels" color="primary" @click="continueToChannels" />
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

  if (result.success) {
    successUsername.value = result.user.username
    showSuccess.value = true
  } else {
    showError.value = true
    errorMessage.value = result.error
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
.full-width {
  width: 100%;
}
</style>
