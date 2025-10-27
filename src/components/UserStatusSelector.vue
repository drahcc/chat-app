<template>
  <q-btn flat icon="circle" :color="statusColor" size="sm">
    <q-menu>
      <q-list style="min-width: 120px">
        <q-item clickable v-close-popup @click="setStatus('online')">
          <q-item-section avatar>
            <q-icon name="circle" color="green" />
          </q-item-section>
          <q-item-section>Online</q-item-section>
          <q-item-section side v-if="currentStatus === 'online'">
            <q-icon name="check" color="primary" />
          </q-item-section>
        </q-item>
        
        <q-item clickable v-close-popup @click="setStatus('dnd')">
          <q-item-section avatar>
            <q-icon name="do_not_disturb" color="orange" />
          </q-item-section>
          <q-item-section>Do Not Disturb</q-item-section>
          <q-item-section side v-if="currentStatus === 'dnd'">
            <q-icon name="check" color="primary" />
          </q-item-section>
        </q-item>
        
        <q-item clickable v-close-popup @click="setStatus('offline')">
          <q-item-section avatar>
            <q-icon name="offline_bolt" color="grey" />
          </q-item-section>
          <q-item-section>Offline</q-item-section>
          <q-item-section side v-if="currentStatus === 'offline'">
            <q-icon name="check" color="primary" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    
    <q-tooltip>Status: {{ currentStatus }} (click to change)</q-tooltip>
  </q-btn>
</template>

<script setup>
import { useChannelsStore } from 'src/stores/channelsStore'
import { computed } from 'vue'

const store = useChannelsStore()

const currentStatus = computed(() => store.getUserStatus(store.currentUser))

const statusColor = computed(() => {
  switch (currentStatus.value) {
    case 'online': return 'green'
    case 'dnd': return 'orange'
    case 'offline': return 'grey'
    default: return 'grey'
  }
})

function setStatus(status) {
  store.setUserStatus(status)
}
</script>

<style scoped>
.q-item {
  min-height: 40px;
}
</style>