<template>
  <q-page class="q-pa-md">
    <!-- Заглавие -->
    <div class="text-h4 q-mb-md text-primary text-bold">
      Your Channels
    </div>

    <!-- Списък с канали -->
    <q-list bordered separator class="q-mb-md rounded-borders">
      <q-item 
        v-for="channel in store.getUserChannels" 
        :key="channel.id"
        clickable 
        v-ripple 
        @click="goToChannel(channel.id)"
        class="q-my-xs"
      >
        <q-item-section avatar>
          <q-icon name="tag" color="primary" />
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-bold"># {{ channel.name }}</q-item-label>
          <q-item-label caption>
            {{ channel.members.length }} members • 
            Admin: {{ channel.admin }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-badge 
            :color="channel.type === 'private' ? 'orange' : 'green'" 
            :label="channel.type" 
          />
        </q-item-section>
      </q-item>

      <!-- Съобщение ако няма канали -->
      <q-item v-if="store.getUserChannels.length === 0">
        <q-item-section>
          <q-item-label class="text-grey text-center">
            No channels yet. Create your first channel!
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Бутони за действие -->
    <div class="row q-gutter-sm justify-center">
      <q-btn 
        label="Create Public Channel" 
        color="primary" 
        icon="add"
        @click="createChannel('public')"
      />
      <q-btn 
        label="Create Private Channel" 
        color="orange" 
        icon="lock"
        @click="createChannel('private')"
      />
      <q-btn 
        label="Join with Command" 
        color="secondary" 
        icon="keyboard"
        @click="goToGeneralAndJoin"
      />
    </div>

    <!-- Брой канали -->
    <div class="text-caption text-grey text-center q-mt-lg">
      {{ store.getUserChannels.length }} channel(s)
    </div>
  </q-page>
</template>

<script setup>
import { useChannelsStore } from 'src/stores/channelsStore'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const store = useChannelsStore()
const router = useRouter()
const $q = useQuasar()

function goToChannel(channelId) {
  router.push(`/chat/${channelId}`)
}

function createChannel(type) {
  $q.dialog({
    title: `Create ${type === 'private' ? 'Private' : 'Public'} Channel`,
    message: 'Enter channel name:',
    prompt: {
      model: '',
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk(name => {
    if (name && name.trim()) {
      const channelName = name.trim()
      const id = store.createChannel(channelName, type)
      
      $q.notify({
        type: 'positive',
        message: `Channel #${channelName} created successfully!`,
        timeout: 2000
      })
      
      // Отиди директно в новия канал
      setTimeout(() => {
        router.push(`/chat/${id}`)
      }, 500)
    }
  })
}

function goToGeneralAndJoin() {
  // Отиди в General канала, където можеш да използваш команди
  router.push('/chat/1')
  $q.notify({
    message: 'Use /join channelName in the chat to join channels!',
    color: 'info',
    timeout: 3000
  })
}
</script>

<style scoped>
.q-item {
  border-radius: 8px;
  margin: 4px 0;
}

.q-item:hover {
  background-color: #f0f0f0;
}
</style>