<template>
  <q-page class="column flex bg-grey-2">
    <!-- Заглавие -->
    <div class="bg-primary text-white q-pa-sm text-h6">
      # {{ channel?.name || 'Unknown' }}
    </div>

    <!-- Съобщения -->
    <div class="q-pa-md scroll chat-container" style="flex-grow: 1; overflow-y: auto;">
      <div
        v-for="(msg, index) in channel?.messages"
        :key="index"
        :class="['chat-message', msg.from === 'me' ? 'from-me' : 'from-them']"
      >
        <b>{{ msg.user }}:</b><br />
        {{ msg.text }}
        <div class="time">{{ msg.time }}</div>
      </div>
    </div>

    <!-- Команден ред -->
    <div class="row q-pa-sm bg-white">
      <q-input
        v-model="input"
        filled
        class="col-grow q-mr-sm"
        placeholder="Type a message or command..."
        @keyup.enter="handleInput"
      />
      <q-btn label="Send" color="primary" @click="handleInput" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChannelsStore } from 'src/stores/channelsStore'

const route = useRoute()
const router = useRouter()
const store = useChannelsStore()

const input = ref('')
const channelId = ref(route.params.id)
const channel = computed(() => store.getChannelById(channelId.value))

// Следи за промени в URL и обновявай канала
watch(
  () => route.params.id,
  (newId) => {
    channelId.value = newId
  }
)

function handleInput() {
  const val = input.value.trim()
  if (!val) return

  if (val.startsWith('/')) {
    handleCommand(val)
  } else {
    store.sendMessage(channelId.value, val)
  }

  input.value = ''
}

function handleCommand(cmd) {
  const parts = cmd.split(' ')
  const main = parts[0].toLowerCase()

  switch (main) {
    case '/join': {
      const name = parts[1]
      const type = parts[2] || 'public'
      if (!name) {
        alert('Please specify channel name: /join channelName [private]')
        return
      }
      const res = store.joinChannel(name, type)
      
      if (res.error) {
        alert(res.error)
      } else {
        //router.push(`/chat/${res.id}`)
        alert(res.created ? `Created channel ${name}` : `Joined ${name}`)
      }
      break
    }
    case '/invite': {
      const user = parts[1]
      if (!user) {
        alert('Please specify user: /invite username')
        return
      }
      alert('Successfully invited member')
      break
    }
    case '/revoke': {
      const user = parts[1]
      if (!user) {
        alert('Please specify user: /revoke username')
        return
      }
    
      alert('Successfully revoked member')
      break
    }
    case '/kick': {
      const user = parts[1]
      if (!user) {
        alert('Please specify user: /kick username')
        return
      }
     
      alert('Successfully kicked member')
      break
    }
    case '/quit': {
      
      alert('Successfully quit')
      // if (result.includes('deleted')) {
        router.push('/channels')
      // }
      break
    }
    case '/cancel': {
      
      alert('Successfully left/deleted')
      // if (result.includes('deleted') || result.includes('left')) {
        router.push('/channels')
      // }
      break
    }
    case '/list': {
     if (channel.value) {
      //  const members = channel.value.members.join(', ')
    //  const banned = channel.value.banned?.length ? `\nBanned: ${channel.value.banned.join(', ')}` : ''
       alert(`Members: some members found`)
      } else {
        alert('Channel not found')
      }
      break
    }
    default:
      alert('Unknown command: ' + main + '\nAvailable commands: /join, /invite, /revoke, /kick, /quit, /cancel, /list')
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 10px;
}

.chat-message.from-me {
  align-self: flex-end;
  background-color: #1976d2;
  color: white;
  padding: 10px 14px;
  border-radius: 12px 12px 0 12px;
  max-width: 80%;
  word-wrap: break-word;
}

.chat-message.from-them {
  align-self: flex-start;
  background-color: #f1f1f1;
  color: #333;
  padding: 10px 14px;
  border-radius: 12px 12px 12px 0;
  max-width: 80%;
  word-wrap: break-word;
}

.time {
  font-size: 0.7em;
  color: #888;
  margin-top: 4px;
  text-align: right;
}
</style>