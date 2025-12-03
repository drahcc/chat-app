<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md text-primary">Your Channels</div>

    <!-- 👇 DEBUG ИНФОРМАЦИЯ -->
    <div class="bg-yellow-1 q-pa-sm q-mb-md rounded-borders">
      <div class="text-caption text-grey">
        <strong>Debug Info:</strong><br>
        Current User: {{ store.currentUser }}<br>
        Channels Count: {{ store.getUserChannels.length }}<br>
        Channels: {{ store.getUserChannels.map(c => ({ id: c.id, name: c.name })) }}
      </div>
    </div>

    <!-- Нови покани секция -->
    <div v-if="newInviteChannels.length > 0" class="q-mb-md">
      <div class="text-h6 text-green q-mb-sm">🎯 New Invites</div>
      <q-list bordered separator class="q-mb-md">
        <q-item 
          v-for="channel in newInviteChannels" 
          :key="channel.id"
          clickable 
          v-ripple 
          @click="goToChannel(channel.id)"
          class="new-invite-item"
        >
          <q-item-section avatar>
            <q-icon name="mark_email_unread" color="green" size="md" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold text-green"># {{ channel.name }}</q-item-label>
            <q-item-label caption class="text-green">
              🆕 New invitation • {{ channel.members.length }} members • 
              Admin: {{ channel.admin }}
              <span v-if="channel.type === 'private'" class="text-orange"> • Private</span>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center">
              <q-btn 
                flat 
                round 
                icon="close" 
                color="green" 
                size="sm"
                @click.stop="dismissInvite(channel.id)"
              >
                <q-tooltip>Dismiss notification</q-tooltip>
              </q-btn>
              <q-btn 
                flat 
                round 
                icon="logout" 
                color="grey" 
                size="sm"
                @click.stop="handleChannelAction(channel)"
              >
                <q-tooltip>Leave channel</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Обикновени канали -->
    <div class="q-mb-md">
      <div class="text-h6 text-primary q-mb-sm">💬 Your Channels</div>
      <q-list bordered separator class="q-mb-md">
        <q-item 
          v-for="channel in regularChannels" 
          :key="channel.id"
          clickable 
          v-ripple 
          @click="goToChannel(channel.id)"
        >
          <q-item-section avatar>
            <q-icon name="tag" :color="channel.type === 'private' ? 'orange' : 'primary'" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold"># {{ channel.name }}</q-item-label>
            <q-item-label caption>
              {{ channel.members.length }} members • 
              Admin: {{ channel.admin }}
              <span v-if="channel.type === 'private'" class="text-orange"> • Private</span>
              <span v-if="store.isChannelInactive(channel.id)" class="text-red"> • Inactive</span>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn 
              flat 
              round 
              icon="logout" 
              color="grey" 
              @click.stop="handleChannelAction(channel)"
            >
              <q-tooltip>
                {{ channel.admin === store.currentUser ? 'Delete channel' : 'Leave channel' }}
              </q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>

        <!-- Съобщение ако няма канали -->
        <q-item v-if="store.getUserChannels.length === 0">
          <q-item-section class="text-center text-grey">
            <q-icon name="tag" size="xl" class="q-mb-sm" />
            <div>No channels yet. Create your first channel!</div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- 🆕 ВСИЧКИ ОРИГИНАЛНИ БУТОНИ -->
    <div class="row q-gutter-sm justify-center q-mt-lg">
      <q-btn 
        label="Create Public Channel" 
        color="primary" 
        icon="public"
        @click="createPublicChannel"
      />
      <q-btn 
        label="Create Private Channel" 
        color="orange" 
        icon="lock"
        @click="createPrivateChannel"
      />
      <q-btn 
        label="Test Invite" 
        color="green" 
        icon="mail"
        @click="simulateInvite"
      />
      
      <!-- 🆕 Auto-cleanup тестови бутони -->
      <q-btn 
        label="Create Old Channels" 
        color="grey" 
        icon="schedule"
        @click="createTestInactiveChannels"
      />
      <q-btn 
        label="Run Cleanup" 
        color="red" 
        icon="delete"
        @click="manualCleanup"
      />
      <q-btn 
        label="Check Activity" 
        color="blue" 
        icon="info"
        @click="checkAllChannelsActivity"
      />
      
      <!-- 👇 ДИРЕКТЕН ДОСТЪП ДО КАНАЛА -->
      <q-btn 
        label="🚀 DIRECT TO CHANNEL" 
        color="green" 
        icon="rocket_launch"
        @click="directToChannel"
      />
      
      <q-btn 
        label="🧪 TEST NAVIGATION" 
        color="red" 
        icon="bug_report"
        @click="testNavigation"
      />
    </div>

    <!-- Информация -->
    <div class="text-caption text-grey text-center q-mt-lg">
      {{ store.getUserChannels.length }} channel(s)
      <span v-if="newInviteChannels.length > 0" class="text-green">
        • {{ newInviteChannels.length }} new invite(s)
      </span>
      <span v-if="inactiveChannelsCount > 0" class="text-orange">
        • {{ inactiveChannelsCount }} inactive
      </span>
      <span class="text-blue"> • Total: {{ store.getTotalChannelsCount }} channels</span>
    </div>
  </q-page>
</template>

<script setup>
import { useChannelsStore } from 'src/stores/channelsStore'
import { useRouter } from 'vue-router'
import { computed, onMounted } from 'vue'

const store = useChannelsStore()
const router = useRouter()

// Компютъд за нови покани
const newInviteChannels = computed(() => {
  return store.getUserChannels.filter(channel => 
    store.userInvites.has(channel.id) || channel.isNewInvite
  )
})

// Компютъд за обикновени канали
const regularChannels = computed(() => {
  return store.getUserChannels.filter(channel => 
    !store.userInvites.has(channel.id) && !channel.isNewInvite
  )
})

// 🆕 Компютъд за неактивни канали
const inactiveChannelsCount = computed(() => {
  return store.getChannelsForDeletion.length
})

// 👇 ОПРАВЕНА ФУНКЦИЯ ЗА НАВИГАЦИЯ
function goToChannel(channelId) {
  console.log('🔗 === NAVIGATION DEBUG START ===')
  console.log('🎯 Channel ID:', channelId, 'Type:', typeof channelId)
  console.log('👤 Current user:', store.currentUser)
  
  const channel = store.getChannelById(channelId)
  console.log('🎯 Channel details:', channel)
  
  if (!channel) {
    console.error('❌ Channel not found with ID:', channelId)
    alert(`Error: Channel not found`)
    return
  }
  
  console.log('✅ Channel found:', channel.name)
  console.log('👥 Channel members:', channel.members)
  
  if (!channel.members.includes(store.currentUser)) {
    console.error('❌ User not member of channel')
    alert(`Error: You are not a member of #${channel.name}`)
    return
  }
  
  console.log('✅ User is member of channel')
  
  // 👇 ПРОБВАМЕ РАЗЛИЧНИ НАЧИНИ ЗА НАВИГАЦИЯ
  console.log('🔄 Attempting navigation...')
  
  // Начин 1: Обикновен router.push
  try {
    console.log('📍 Trying router.push with:', `/chat/${channelId}`)
    router.push(`/chat/${channelId}`)
      .then(() => {
        console.log('✅ Router navigation successful')
      })
      .catch((error) => {
        console.error('❌ Router.push failed:', error)
        // Начин 2: Router push с обект
        console.log('📍 Trying router.push with object')
        router.push({ path: `/chat/${channelId}` })
          .then(() => {
            console.log('✅ Router navigation with object successful')
          })
          .catch((error2) => {
            console.error('❌ Router.push with object failed:', error2)
            // Начин 3: Hard navigation
            console.log('📍 Trying hard navigation')
            window.location.href = `/chat/${channelId}`
          })
      })
  } catch (error) {
    console.error('❌ Navigation error:', error)
    // Начин 4: Hash-based navigation
    console.log('📍 Trying hash navigation')
    window.location.hash = `#/chat/${channelId}`
  }
  
  console.log('🔗 === NAVIGATION DEBUG END ===')
}

// 👇 ДИРЕКТНА НАВИГАЦИЯ
function directToChannel() {
  const channel = store.getUserChannels[0]
  if (channel) {
    console.log('🚀 Direct navigation to:', channel.name, 'ID:', channel.id)
    
    // Пробваме директно в браузъра
    const newUrl = `${window.location.origin}${window.location.pathname}#/chat/${channel.id}`
    console.log('📍 Direct URL:', newUrl)
    window.location.href = newUrl
  } else {
    alert('No channels available')
  }
}

// 👇 ТЕСТОВА ФУНКЦИЯ ЗА НАВИГАЦИЯ
function testNavigation() {
  const firstChannel = store.getUserChannels[0]
  if (firstChannel) {
    console.log('🧪 Testing navigation to first channel:', firstChannel)
    goToChannel(firstChannel.id)
  } else {
    alert('No channels available for testing')
  }
}

// Функция за премахване на highlight
function dismissInvite(channelId) {
  store.dismissNewInvite(channelId)
}

// Обработка на действия с канали (leave/delete)
function handleChannelAction(channel) {
  const isAdmin = channel.admin === store.currentUser
  
  if (isAdmin) {
    const confirmDelete = confirm(`Are you sure you want to delete #${channel.name}? This action cannot be undone!`)
    if (confirmDelete) {
      const result = store.deleteChannel(channel.id)
      
      if (result.success) {
        alert(`Channel #${channel.name} has been deleted`)
      } else {
        alert(`Failed to delete channel: ${result.error}`)
      }
    }
  } else {
    const confirmLeave = confirm(`Are you sure you want to leave #${channel.name}?`)
    if (confirmLeave) {
      const result = store.leaveChannel(channel.id)
      
      if (result.success) {
        alert(result.message || `You have left #${channel.name}`)
      } else {
        alert(`Failed to leave channel: ${result.message}`)
      }
    }
  }
}

// Тестова функция за симулиране на покана
function simulateInvite() {
  const testChannelName = `test-${Date.now()}`
  const result = store.createChannel(testChannelName, 'public')
  
  if (result.success) {
    store.markChannelAsNewInvite(result.channelId)
    alert(`Test invite created for channel #${testChannelName}`)
  } else {
    alert(`Error: ${result.error}`)
  }
}

// 🆕 Създаване на тестови стари канали
function createTestInactiveChannels() {
  const created = store.createTestInactiveChannels()
  alert(`Created test inactive channels: ${created.join(', ')}`)
}

// 🆕 Ръчно почистване
function manualCleanup() {
  const result = store.manualCleanup()
  if (result.deleted.length > 0) {
    const deletedNames = result.deleted.map(d => d.channelName).join(', ')
    alert(`✅ Cleanup completed! Deleted: ${deletedNames}`)
  } else {
    alert('✅ No inactive channels found for deletion')
  }
}

// 🆕 Проверка на активността на всички канали
function checkAllChannelsActivity() {
  let report = 'Channel Activity Report:\n\n'
  
  store.getUserChannels.forEach(channel => {
    const activity = store.checkChannelActivity(channel.id)
    const status = activity.isInactive ? '🟡 INACTIVE' : '🟢 ACTIVE'
    report += `${status} #${channel.name} - ${activity.message}\n`
  })
  
  alert(report)
}

function createPublicChannel() {
  createChannel('public')
}

function createPrivateChannel() {
  createChannel('private')
}

function createChannel(type) {
  const channelName = prompt(`Enter name for ${type} channel:`)
  
  if (channelName && channelName.trim()) {
    const name = channelName.trim()
    const result = store.joinChannel(name, type)
    
    if (result.created) {
      alert(`Channel #${name} created successfully!`)
      setTimeout(() => {
        goToChannel(result.id)
      }, 500)
    } else if (result.error) {
      alert(`Error: ${result.error}`)
    } else {
      alert(`Joined existing channel #${name}`)
      setTimeout(() => {
        goToChannel(result.id)
      }, 500)
    }
  }
}

// Инициализация
onMounted(() => {
  console.log('Channels page mounted - available channels:', store.getUserChannels)
})
</script>

<style scoped>
.new-invite-item {
  border-left: 4px solid green;
  background-color: rgba(76, 175, 80, 0.05);
}
</style>