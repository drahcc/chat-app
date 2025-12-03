<template>
  <q-page class="flex flex-center column bg-grey-2 q-pa-md">
    <div class="text-h4 q-mb-lg">Create a New Account</div>

    <q-card class="q-pa-lg" style="width: 300px; max-width: 90%;">
      <q-input v-model="nickname" label="Nickname" outlined class="q-mb-md" />
      <q-input v-model="email" label="Email" type="email" outlined class="q-mb-md" />
      <q-input v-model="password" label="Password" type="password" outlined class="q-mb-md" />
      <q-input v-model="confirmPassword" label="Confirm Password" type="password" outlined class="q-mb-md" />

      <q-btn label="Register" color="primary" class="full-width q-mb-sm" @click="register" />

      <q-btn flat label="Back to Login" color="primary" @click="goToLogin" class="full-width" />
    </q-card>

    <!-- SUCCESS DIALOG -->
    <q-dialog v-model="showSuccess">
      <q-card>
        <q-card-section>
          <div class="text-h6 text-positive">Account Created!</div>
        </q-card-section>
        <q-card-section>
          You can now log in with your new account.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Go to Login" color="primary" @click="goToLogin" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ERROR DIALOG -->
    <q-dialog v-model="showError">
      <q-card>
        <q-card-section>
          <div class="text-h6 text-negative">Registration Error</div>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const nickname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const showSuccess = ref(false)
const showError = ref(false)
const errorMessage = ref('')

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
}

function goToLogin() {
  router.push('/')
}
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
