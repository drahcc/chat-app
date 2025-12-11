<template>
  <q-btn flat round size="sm" icon="notifications" :color="buttonColor">
    <q-menu>
      <q-list style="min-width: 200px">
        <q-item clickable v-close-popup @click="setPreference('all')">
          <q-item-section>All messages</q-item-section>
          <q-item-section side v-if="preference === 'all'"><q-icon name="check" color="primary" /></q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="setPreference('mentions_only')">
          <q-item-section>Mentions only</q-item-section>
          <q-item-section side v-if="preference === 'mentions_only'"><q-icon name="check" color="primary" /></q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <q-tooltip>Notifications: {{ preferenceLabel }}</q-tooltip>
  </q-btn>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/authStore'

const authStore = useAuthStore()
const preference = ref(authStore.notificationPreference || 'all')

const preferenceLabel = computed(() =>
  preference.value === 'mentions_only' ? 'Mentions only' : 'All messages'
)

const buttonColor = computed(() =>
  preference.value === 'mentions_only' ? 'orange' : 'primary'
)

onMounted(async () => {
  const pref = await authStore.loadNotificationPreference()
  preference.value = pref || 'all'
})

async function setPreference(value) {
  preference.value = value
  await authStore.setNotificationPreference(value)
}
</script>
