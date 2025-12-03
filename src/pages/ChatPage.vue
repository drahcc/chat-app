import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

onMounted(() => {
  console.log('💬 ChatPage mounted with channelId:', route.params.channelId)
  const channelId = route.params.channelId
  if (channelId) {
    selectChannel(parseInt(channelId))
  }
})
<template>
  <q-page class="row">
    <!-- Sidebar с канали (ляво) -->
    <div class="col-3 q-pa-md bg-grey-2">
      <div class="row items-center q-mb-md">
        <div class="text-h6">Channels</div>
        <q-space />
        
        <!-- Status Selector -->
        <q-select
          v-model="userStatus"
          :options="statusOptions"
          dense
          options-dense
          emit-value
          map-options
          style="min-width: 120px;"
        >
          <template v-slot:selected>
            <div class="row items-center">
              <q-icon :name="getStatusIcon(userStatus)" :color="getStatusColor(userStatus)" size="xs" class="q-mr-sm" />
              <span class="text-capitalize">{{ userStatus }}</span>
            </div>
          </template>
          
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-icon :name="scope.opt.icon" :color="scope.opt.color" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-capitalize">{{ scope.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

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
              :color="getStatusColor(channelsStore.getUserStatus(user))" 
              class="q-ml-xs"
            >
              <q-icon :name="getStatusIcon(channelsStore.getUserStatus(user))" size="xs" class="q-mr-xs" />
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
              <q-avatar :color="getStatusColor(channelsStore.getUserStatus(message.user))" text-color="white" size="sm">
                {{ message.user.charAt(0) }}
              </q-avatar>
            </div>
            <div class="col q-ml-md">
              <div class="row items-center">
                <strong class="q-mr-sm">{{ message.user }}</strong>
                <q-badge v-if="message.user === currentChannel.admin" color="orange" label="Admin" size="sm" />
                <q-icon :name="getStatusIcon(channelsStore.getUserStatus(message.user))" :color="getStatusColor(channelsStore.getUserStatus(message.user))" size="xs" class="q-ml-sm" />
                <span class="text-caption text-grey q-ml-sm">{{ message.time }}</span>
              </div>
              <!-- Mentions се оцветяват в жълто -->
              <div class="message-content" v-html="formatMessage(message.text)"></div>
            </div>
          </div>
        </div>

        <!-- No messages -->
        <div v-if="currentChannel.messages.length === 0" class="text-center text-grey q-mt-xl">
          <q-icon name="chat" size="xl" />
          <div>No messages yet. Start the conversation!</div>
        </div>

        <!-- Typing indicator with REAL-TIME PREVIEW -->
        <div v-if="visibleTypingUsers.length > 0" class="text-italic text-grey q-mt-md">
          <q-spinner size="xs" color="primary" />
          <span v-for="(user, index) in visibleTypingUsers" :key="user">
            <span 
              class="user-name clickable" 
              @click="showTypingPreview(user)"
              :class="{ 'preview-active': previewUser === user }"
            >
              {{ user }}
            </span>
            <span v-if="index < visibleTypingUsers.length - 1">, </span>
          </span>
          {{ visibleTypingUsers.length === 1 ? 'is' : 'are' }} typing...
          
          <!-- Real-time typing preview - ПОКАЗВА РЕАЛНОТО СЪДЪРЖАНИЕ -->
          <div v-if="previewUser && realTimeTypingContent[previewUser]" class="typing-preview q-mt-sm q-pa-sm bg-blue-1 rounded-borders">
            <div class="row items-center">
              <q-avatar :color="getStatusColor(channelsStore.getUserStatus(previewUser))" text-color="white" size="sm" class="q-mr-sm">
                {{ previewUser.charAt(0) }}
              </q-avatar>
              <div class="col">
                <div class="text-caption text-weight-medium">{{ previewUser }} is typing:</div>
                <div class="typing-text">{{ realTimeTypingContent[previewUser] }}</div>
              </div>
              <q-btn flat round icon="close" size="sm" @click="closeTypingPreview" class="q-ml-auto" />
            </div>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div v-if="currentChannel" class="q-pa-md bg-grey-1" style="position: relative;">
        <q-input
          ref="messageInput"
          v-model="newMessage"
          filled
          placeholder="Type a message or command (/join, /invite, /kick, /cancel, /list)... Use @ to mention users"
          @keyup.enter="sendMessage"
          @keydown="handleKeydown"
          @input="handleInputChange"
          @focus="handleInputFocus"
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

        <!-- Mentions Menu - САМО КОГАТО ИМА @ -->
        <q-menu
          v-model="showMentions"
          no-refocus
          no-route-dismiss
          persistent
          :offset="[0, 10]"
        >
          <q-list dense style="min-width: 200px; max-height: 300px;" class="scroll">
            <q-item-label header>Mention user:</q-item-label>
            <q-item 
              v-for="user in filteredMentionUsers" 
              :key="user"
              clickable
              @click="insertMention(user)"
            >
              <q-item-section avatar>
                <q-icon :name="getStatusIcon(channelsStore.getUserStatus(user))" :color="getStatusColor(channelsStore.getUserStatus(user))" size="sm" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ user }}</q-item-label>
                <q-item-label caption>{{ channelsStore.getUserStatus(user) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="filteredMentionUsers.length === 0">
              <q-item-section>
                <q-item-label class="text-grey">No users found</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        
        <!-- Command help -->
        <div class="text-caption text-grey q-mt-sm">
          <strong>Commands:</strong> /join [name] [private], /invite [user], /kick [user], /cancel, /list
          <span class="q-ml-md"><strong>Mentions:</strong> Type @ to mention users</span>
          <span class="q-ml-md"><strong>Typing Preview:</strong> Click on typing users to see their message</span>
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
import { ref, computed, watch, nextTick } from 'vue'
import { useChannelsStore } from 'src/stores/channelsStore'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

const channelsStore = useChannelsStore()
const router = useRouter()

// Използваме storeToRefs за реактивност
const { typingUsers } = storeToRefs(channelsStore)

const currentChannelId = ref(channelsStore.getUserChannels[0]?.id || null)
const newMessage = ref('')
const loading = ref(false)
const userStatus = ref('online')
const showMentions = ref(false)
const messageInput = ref(null)
const typingTimer = ref(null)
const visibleTypingUsers = ref([])
const isTyping = ref(false)

// REAL-TIME TYPING PREVIEW VARIABLES
const previewUser = ref(null)
const realTimeTypingContent = ref({}) // Тук ще пазим реалното съдържание което всеки потребител пише

// Status options
const statusOptions = [
  { label: 'online', value: 'online', icon: 'circle', color: 'green' },
  { label: 'do not disturb', value: 'dnd', icon: 'do_not_disturb', color: 'orange' },
  { label: 'offline', value: 'offline', icon: 'offline_bolt', color: 'grey' }
]

// Users available for mentions (всички освен текущия потребител)
const mentionableUsers = computed(() => {
  return channelsStore.getAllUserNicknames.filter(nick => nick !== channelsStore.currentUser)
})

// Филтрирани потребители за mentions - САМО КОГАТО ИМА @
const filteredMentionUsers = computed(() => {
  // Показваме менюто САМО ако има @ в текста
  if (!newMessage.value.includes('@')) {
    return []
  }
  
  const currentText = newMessage.value
  const lastAtPos = currentText.lastIndexOf('@')
  
  if (lastAtPos === -1) return []
  
  const searchText = currentText.slice(lastAtPos + 1).toLowerCase()
  
  if (!searchText) return mentionableUsers.value
  
  return mentionableUsers.value.filter(user => 
    user.toLowerCase().includes(searchText)
  )
})

const currentChannel = computed(() => channelsStore.getChannelById(currentChannelId.value))
const onlineUsers = computed(() => channelsStore.getOnlineUsers.filter(u => currentChannel.value?.members.includes(u)))

// Watch за промени в store typingUsers
watch([() => currentChannelId.value, typingUsers], ([channelId, typingUsersObj]) => {
  if (!channelId) {
    visibleTypingUsers.value = []
    return
  }
  
  const users = typingUsersObj[channelId] || []
  console.log('👀 Store typing users for channel', channelId, ':', users)
  visibleTypingUsers.value = users
  
  // Автоматично затваряне на preview ако потребителят спре да пише
  if (previewUser.value && !users.includes(previewUser.value)) {
    closeTypingPreview()
  }
}, { immediate: true, deep: true })

// Watch за промяна на съобщението - КОНТРОЛИРА МЕНЮТО ЗА @MENTIONS
watch(newMessage, (text) => {
  // Показваме mentions менюто САМО когато има @ в текста
  if (text.includes('@')) {
    const lastAtPos = text.lastIndexOf('@')
    const textAfterAt = text.slice(lastAtPos + 1)
    
    // Показваме менюто само ако няма space след @
    if (!textAfterAt.includes(' ')) {
      showMentions.value = true
      return
    }
  }
  
  // Във всички останали случаи скриваме менюто
  showMentions.value = false
})

// Status functions
function getStatusIcon(status) {
  const statusMap = {
    online: 'circle',
    dnd: 'do_not_disturb',
    offline: 'offline_bolt'
  }
  return statusMap[status] || 'offline_bolt'
}

function getStatusColor(status) {
  const colorMap = {
    online: 'green',
    dnd: 'orange',
    offline: 'grey'
  }
  return colorMap[status] || 'grey'
}

// Format message with mentions highlighting - ЖЛЪТО ОЦВЕТЯВАНЕ
function formatMessage(text) {
  if (!text) return ''
  // Заменяме @username със span с жълт фон
  return text.replace(/@(\w+)/g, '<span class="mention-highlight">@$1</span>')
}

// Handle input focus
function handleInputFocus() {
  console.log('🎯 Input focused')
  // При фокус върху input полето, веднага стартираме typing
  if (currentChannelId.value) {
    startTyping()
  }
}

// Handle input change - запазваме какво пише потребителят
function handleInputChange() {
  // Mentions менюто се контролира от watch-а на newMessage
  
  // Запазваме съобщението за real-time preview
  if (currentChannelId.value && newMessage.value.trim() && !isTyping.value) {
    startTyping()
  } else if (!newMessage.value.trim()) {
    // Ако няма текст, спираме typing
    stopTyping()
  }
}

// Handle keydown - СТАРТИРА TYPING ВЕДНАГА
function handleKeydown(event) {
  // Игнорираме специални клавиши
  if (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Tab') {
    return
  }
  
  console.log('⌨️ Key pressed:', event.key)
  
  // ВЕДНАГА стартираме typing при натискане на клавиш
  if (currentChannelId.value) {
    startTyping()
  }
}

// Show typing preview - СЕГА ПОКАЗВА РЕАЛНОТО СЪДЪРЖАНИЕ
function showTypingPreview(user) {
  previewUser.value = user
  
  // В реално приложение това ще се синхронизира между клиентите
  // За сега ще използваме текущото съдържание като пример
  if (!realTimeTypingContent.value[user]) {
    realTimeTypingContent.value[user] = '...'
  }
  
  // Симулираме получаване на реално съдържание (в реално приложение това ще идва от сървъра)
  // За демонстрация, ще използваме текущото съдържание на полето
  if (user === channelsStore.currentUser) {
    realTimeTypingContent.value[user] = newMessage.value || '...'
  }
}

// Close typing preview
function closeTypingPreview() {
  previewUser.value = null
}

// Insert mention
function insertMention(user) {
  const currentText = newMessage.value
  const lastAtPos = currentText.lastIndexOf('@')
  
  if (lastAtPos !== -1) {
    // Заместваме всичко след последния @ с избрания потребител
    newMessage.value = currentText.slice(0, lastAtPos) + `@${user} `
    showMentions.value = false
    
    // Фокусирай обратно в input полето
    nextTick(() => {
      if (messageInput.value) {
        messageInput.value.focus()
      }
    })
  }
}

// Start typing - ПРОСТА ВЕРСИЯ
function startTyping() {
  if (!currentChannelId.value) return
  
  // Изчистваме предния таймер
  if (typingTimer.value) {
    clearTimeout(typingTimer.value)
  }
  
  // Маркираме, че потребителят пише
  isTyping.value = true
  
  // СТАРТИРАМЕ TYPING ДИРЕКТНО В STORE
  channelsStore.startTyping(currentChannelId.value)
  console.log('🖊️ STARTED typing - should show immediately!')
  
  // Автоматично спиране след 3 секунди без активност
  typingTimer.value = setTimeout(() => {
    console.log('⏰ Typing timeout - stopping')
    stopTyping()
  }, 3000)
}

// Stop typing - ПРОСТА ВЕРСИЯ
function stopTyping() {
  if (!currentChannelId.value) return
  
  // Изчистваме таймера
  if (typingTimer.value) {
    clearTimeout(typingTimer.value)
    typingTimer.value = null
  }
  
  // Маркираме, че потребителят е спрял да пише
  isTyping.value = false
  
  // СПИРАМЕ TYPING ДИРЕКТНО В STORE
  channelsStore.stopTyping(currentChannelId.value)
  console.log('🛑 STOPPED typing')
}

// Watch status changes
watch(userStatus, (newStatus) => {
  channelsStore.setUserStatus(newStatus)
})

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
  // Спираме typing при смяна на канал
  stopTyping()
  // Затваряме preview
  closeTypingPreview()
}

function sendMessage() {
  if (!newMessage.value.trim() || !currentChannel.value) return
  
  if (newMessage.value.startsWith('/')) {
    handleCommand(newMessage.value)
  } else {
    channelsStore.sendMessage(currentChannelId.value, newMessage.value.trim())
  }
  
  newMessage.value = ''
  showMentions.value = false
  stopTyping()
}

function loadMore() {
  loading.value = true
  channelsStore.loadMoreMessages(currentChannelId.value)
  setTimeout(() => loading.value = false, 500)
}

// Автоматично спиране на typing при напускане на страницата
watch(currentChannelId, (newId, oldId) => {
  if (oldId) {
    channelsStore.stopTyping(oldId)
  }
  closeTypingPreview()
})
</script>

<style scoped>
.scroll {
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

/* ЖЛЪТО ОЦВЕТЯВАНЕ ЗА MENTIONS */
.message-content :deep(.mention-highlight) {
  background-color: #ffeb3b;
  color: #333;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  display: inline;
  margin: 0 2px;
}

/* Стилове за real-time typing preview */
.user-name.clickable {
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-name.clickable:hover {
  color: #1565c0;
  background-color: rgba(25, 118, 210, 0.1);
  border-radius: 4px;
  padding: 2px 4px;
}

.user-name.preview-active {
  color: #ff9800;
  font-weight: bold;
  background-color: rgba(255, 152, 0, 0.1);
  border-radius: 4px;
  padding: 2px 4px;
}

.typing-preview {
  border-left: 4px solid #ff9800;
  animation: pulse 2s infinite;
}

.typing-text {
  font-style: italic;
  color: #666;
  margin-top: 4px;
  background: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { opacity: 1; }
}
</style>