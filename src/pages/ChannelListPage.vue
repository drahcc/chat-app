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

// Компютъд за обикновени каналии
const regularChannels = computed(() => {
  return store.getUserChannels.filter(channel => 
    !store.userInvites.has(channel.id) && !channel.isNewInvite
  )
})

// 🆕 Компютъд за неактивни канали
const inactiveChannelsCount = computed(() => {
  return store.getChannelsForDeletion.length
})

// Функция за премахване на highlight
function dismissInvite(channelId) {
  store.dismissNewInvite(channelId)
}

// 🆕 КОРИГИРАНА ФУНКЦИЯ ЗА НАВИГАЦИЯ
function goToChannel(channelId) {
  console.log('🔗 Attempting to navigate to channel:', channelId)
  
  // Проверка дали каналът съществува
  if (!store.doesChannelExist(channelId)) {
    console.error('❌ Channel does not exist:', channelId)
    alert(`Error: Channel with ID ${channelId} does not exist`)
    return
  }
  
  const channel = store.getChannelById(channelId)
  console.log('📋 Channel details:', channel)
  
  if (!channel) {
    console.error('❌ Channel not found in store')
    alert(`Error: Channel data not found`)
    return
  }
  
  // Проверка дали потребителят е член на канала
  if (!channel.members.includes(store.currentUser)) {
    console.error('❌ User not member of channel:', store.currentUser, channel.members)
    alert(`Error: You are not a member of #${channel.name}`)
    return
  }
  
  // Проверка дали потребителят е баннат
  if (store.isUserBanned(channelId, store.currentUser)) {
    console.error('❌ User banned from channel:', store.currentUser, channelId)
    alert(`Error: You are banned from #${channel.name}`)
    return
  }
  
  // Навигиране
  console.log('✅ All checks passed. Navigating to channel:', channel.name, 'with ID:', channelId)
  
  // Опитай с router.push
  try {
    router.push(`/chat/${channelId}`)
      .then(() => {
        console.log('✅ Navigation successful')
      })
      .catch(err => {
        console.error('❌ Router navigation failed:', err)
        // Fallback: hard navigation
        window.location.href = `/#/chat/${channelId}`
      })
  } catch (err) {
    console.error('❌ Navigation error:', err)
    // Fallback
    window.location.href = `/#/chat/${channelId}`
  }
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

// 🆕 Инициализация на auto-cleanup системата при зареждане
onMounted(() => {
  store.initializeAutoCleanup()
  console.log('Channels page mounted - available channels:', store.getUserChannels)
  
  // TEST: Проверка дали General каналът е достъпен
  setTimeout(() => {
    const generalChannel = store.getChannelById(1)
    console.log('🔍 General channel check:', generalChannel)
    if (generalChannel) {
      console.log('✅ General channel exists and user is member:', generalChannel.members.includes(store.currentUser))
    }
  }, 1000)
})
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md text-primary">Your Channels</div>

    <!-- 🆕 Auto-cleanup информация -->
    <div v-if="inactiveChannelsCount > 0" class="bg-orange-1 q-pa-sm q-mb-md rounded-borders">
      <div class="row items-center">
        <q-icon name="warning" color="orange" class="q-mr-sm" />
        <div class="col">
          <strong>{{ inactiveChannelsCount }} channel(s)</strong> inactive for 30+ days
        </div>
        <div class="col-auto">
          <q-btn 
            label="Clean Up" 
            color="orange" 
            size="sm" 
            @click="manualCleanup"
          />
        </div>
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

    <!-- 🆕 Тестови бутони за auto-cleanup системата -->
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
      
      <!-- 🆕 TEST Navigation бутон -->

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

<style scoped>
.new-invite-item {
  border-left: 4px solid green;
  background-color: rgba(76, 175, 80, 0.05);
}
</style>