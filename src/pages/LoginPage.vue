<template>
  <q-page class="flex flex-center column bg-grey-2 q-pa-md">
    <!-- ЛОГО -->
    <img
      src="~assets/logo1png.png"
      alt="ChatZone Logo"
      style="width: 120px; margin-bottom: 20px;"
    />

    <!-- ЗАГЛАВИЕ -->
    <div class="text-h4 q-mb-lg text-primary text-bold">
      Welcome to ChatZone
    </div>

    <!-- КАРТАТА С ФОРМАТА -->
    <q-card class="q-pa-lg" style="width: 300px; max-width: 90%;">
      <q-input
        v-model="email"
        label="Email"
        type="email"
        outlined
        class="q-mb-md"
      />
      <q-input
        v-model="password"
        label="Password"
        type="password"
        outlined
        class="q-mb-md"
      />

      <q-btn
        label="Sign In"
        color="primary"
        class="full-width q-mb-sm"
        @click="handleLogin"
      />

      <!-- БУТОН ЗА КАНАЛИ -->
      <q-btn
        flat
        label="🎯 GO TO CHANNELS (TEST)"
        color="secondary"
        @click="router.push('/channels')"
        class="full-width q-mb-sm"
      />

      <q-btn
        flat
        label="Create Account"
        color="primary"
        @click="goToRegister"
        class="full-width"
      />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const email = ref('')
const password = ref('')

function handleLogin() {
  if (!email.value || !password.value) {
    $q.notify({
      type: 'negative',
      message: 'Please fill in all fields',
      timeout: 2000
    })
    return
  }

  // Временен логин - винаги успешен за тестване
  $q.notify({
    type: 'positive',
    message: 'Login successful!',
    timeout: 1500
  })

  // Отиди директно към каналите след логин
  setTimeout(() => {
    router.push('/channels')
  }, 1000)
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