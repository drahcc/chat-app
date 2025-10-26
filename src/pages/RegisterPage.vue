<template>
  <q-page class="flex flex-center column bg-grey-2 q-pa-md">
    <div class="text-h4 q-mb-lg">Create a New Account</div>

    <q-card class="q-pa-lg" style="width: 300px; max-width: 90%;">
      <q-input v-model="nickname" label="Nickname" outlined class="q-mb-md" />
      <q-input v-model="email" label="Email" type="email" outlined class="q-mb-md" />
      <q-input v-model="password" label="Password" type="password" outlined class="q-mb-md" />
      <q-input v-model="confirmPassword" label="Confirm Password" type="password" outlined class="q-mb-md" />

      <q-btn label="Register" color="primary" class="full-width q-mb-sm" @click="register" />

      <q-btn flat label="Back to Login" color="primary" @click="goToLogin" />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const nickname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

function register() {
  if (!nickname.value || !email.value || !password.value || !confirmPassword.value) {
    alert('Please fill in all fields.')
    return
  }
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match.')
    return
  }
  // Тук по-късно ще добавим реална регистрация (backend)
  alert(`Registered successfully!\nNickname: ${nickname.value}\nEmail: ${email.value}`)
  router.push('/')
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
