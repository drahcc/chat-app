<template>
  <q-page class="row">
    <!-- Sidebar с канали (ляво) -->
    <div class="col-3 q-pa-md bg-grey-2">
      <div class="text-h6 q-mb-md">Channels</div>
      <q-list bordered>
        <q-item 
          v-for="channel in channelsStore.getUserChannels"
          :key="channel.id"
          clickable
          v-ripple
          :active="currentChannelId === channel.id"
          @click="selectChannel(channel.id)"
          class="q-mb-sm"
        >
          <q-item-section>
            <q-item-label>#{{ channel.name }}</q-item-label>
            <q-item-label caption>
              {{ channel.members.length }} members
              <q-badge v-if="channelsStore.isChannelNewInvite(channel.id)" color="green" label="NEW" class="q-ml-xs" />
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Main chat area (дясно) -->
    <div class="col-9 column">
      <!-- Chat header -->
      <div v-if="currentChannel" class="q-pa-md bg-primary text-white">
        <div class="row items-center">
          <div class="text-h5">#{{ currentChannel.name }}</div>
          <q-space />
          <div class="text-caption">
            <strong>Online:</strong> 
            <q-badge 
              v-for="user in onlineUsers" 
              :key="user"
              color="green" 
              class="q-ml-xs"
            >
              {{ user }}
            </q-badge>
          </div>
        </div>
      </div>

      <!-- Messages area -->
      <div v-if="currentChannel" class="col-grow q-pa-md scroll">
        <!-- Infinite scroll loader -->
        <div v-if="currentChannel.pagination.hasMore" class="text-center q-mb-md">
          <q-btn 
            label="Load more messages" 
            color="primary" 
            outline 
            @click="loadMore"
            :loading="loading"
          />
        </div>

        <!-- Messages -->
        <div v-for="(message, index) in currentChannel.messages" :key="index" class="q-mb-md">
          <div class="row items-start">
            <div class="col-auto">
              <q-avatar color="primary" text-color="white" size="sm">
                {{ message.user.charAt(0) }}
              </q-avatar>
            </div>
            <div class="col q-ml-md">
              <div class="row items-center">
                <strong class="q-mr-sm">{{ message.user }}</strong>
                <q-badge v-if="message.user === currentChannel.admin" color="orange" label="Admin" size="sm" />
                <span class="text-caption text-grey q-ml-sm">{{ message.time }}</span>
              </div>
              <div>{{ message.text }}</div>
            </div>
          </div>
        </div>

        <!-- No messages -->
        <div v-if="currentChannel.messages.length === 0" class="text-center text-grey q-mt-xl">
          <q-icon name="chat" size="xl" />
          <div>No messages yet. Start the conversation!</div>
        </div>

        <!-- Typing indicator -->
        <div v-if="typingUsers.length > 0" class="text-italic text-grey q-mt-md">
          <q-spinner size="xs" color="primary" />
          {{ typingUsers.join(', ') }} {{ typingUsers.length === 1 ? 'is' : 'are' }} typing...
        </div>
      </div>

      <!-- Input area -->
      <div v-if="currentChannel" class="q-pa-md bg-grey-1">
        <q-input
          v-model="newMessage"
          filled
          placeholder="Type a message or command (/join, /invite, /kick, /cancel, /list)..."
          @keyup.enter="sendMessage"
          @input="startTyping"
        >
          <template v-slot:append>
            <q-btn 
              round 
              dense 
              flat 
              icon="send" 
              @click="sendMessage"
              :disabled="!newMessage.trim()"
            />
          </template>
        </q-input>
        
        <!-- Command help -->
        <div class="text-caption text-grey q-mt-sm">
          <strong>Commands:</strong> /join [name] [private], /invite [user], /kick [user], /cancel, /list
        </div>
      </div>

      <!-- No channel selected -->
      <div v-else class="col-grow flex flex-center text-grey">
        <div class="text-center">
          <q-icon name="tag" size="xl" />
          <div class="q-mt-md">Select a channel to start chatting</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useChannelsStore } from 'src/stores/channelsStore'
import { useRouter } from 'vue-router'

const channelsStore = useChannelsStore()
const router = useRouter()

const currentChannelId = ref(channelsStore.getUserChannels[0]?.id || null)
const newMessage = ref('')
const loading = ref(false)

const currentChannel = computed(() => channelsStore.getChannelById(currentChannelId.value))
const onlineUsers = computed(() => channelsStore.getOnlineUsers.filter(u => currentChannel.value?.members.includes(u)))
const typingUsers = computed(() => channelsStore.getTypingUsers(currentChannelId.value))

// Command handling
function handleCommand(command) {
  const parts = command.slice(1).split(' ')
  const cmd = parts[0].toLowerCase()
  
  let members;
  
  switch(cmd) {
    case 'join':
      if (parts[1]) {
        const result = channelsStore.joinChannel(parts[1], parts[2] || 'public')
        if (result.created) {
          alert(`Channel #${parts[1]} created!`)
          currentChannelId.value = result.id
        } else if (result.error) {
          alert(`Error: ${result.error}`)
        } else {
          alert(`Joined #${parts[1]}`)
          currentChannelId.value = result.id
        }
      }
      break
      
    case 'invite':
      if (parts[1] && currentChannelId.value) {
        const result = channelsStore.inviteUser(currentChannelId.value, parts[1])
        alert(result.message)
      }
      break
      
    case 'kick':
      if (parts[1] && currentChannelId.value) {
        const result = channelsStore.kickUser(currentChannelId.value, parts[1])
        alert(result.message)
      }
      break
      
    case 'cancel':
      if (currentChannelId.value) {
        const result = channelsStore.leaveChannel(currentChannelId.value)
        alert(result.message)
        if (result.success) {
          router.push('/channels')
        }
      }
      break
      
    case 'list':
      members = currentChannel.value?.members || []
      alert(`Channel members: ${members.join(', ')}`)
      break
      
    default:
      alert(`Unknown command: /${cmd}`)
  }
}

function selectChannel(id) {
  currentChannelId.value = id
  channelsStore.resetPagination(id)
}

function sendMessage() {
  if (!newMessage.value.trim() || !currentChannel.value) return
  
  if (newMessage.value.startsWith('/')) {
    handleCommand(newMessage.value)
  } else {
    channelsStore.sendMessage(currentChannelId.value, newMessage.value.trim())
  }
  
  newMessage.value = ''
  stopTyping()
}

function loadMore() {
  loading.value = true
  channelsStore.loadMoreMessages(currentChannelId.value)
  setTimeout(() => loading.value = false, 500)
}

function startTyping() {
  if (currentChannelId.value) {
    channelsStore.startTyping(currentChannelId.value)
  }
}

function stopTyping() {
  if (currentChannelId.value) {
    channelsStore.stopTyping(currentChannelId.value)
  }
}

watch(newMessage, (val) => {
  if (val === '') stopTyping()
  else {
    setTimeout(() => stopTyping(), 3000)
  }
})
</script>

<style scoped>
.scroll {
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}
</style>