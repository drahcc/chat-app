<template>
  <q-page class="channels-page">
    <!-- Animated Background -->
    <div class="background-animation">
      <div class="bubble bubble-1"></div>
      <div class="bubble bubble-2"></div>
      <div class="bubble bubble-3"></div>
      <div class="bubble bubble-4"></div>
    </div>

    <div class="channels-container">
      <!-- User Info Card -->
      <div class="user-card">
        <div class="user-avatar">
          <q-icon name="person" size="32px" />
          <div class="status-dot" :class="currentUserStatus"></div>
        </div>
        <div class="user-info">
          <div class="user-name">{{ store.currentUser?.username || store.currentUser?.nickname || 'User' }}</div>
          <div class="user-email">{{ store.currentUser?.email || '' }}</div>
        </div>
        <div class="user-stats">
          <q-chip size="sm" color="cyan" text-color="white" icon="forum">
            {{ store.getUserChannels.length }} channels
          </q-chip>
        </div>
      </div>

      <!-- Your Channels Section -->
      <div class="section-header">
        <q-icon name="chat_bubble" class="section-icon" />
        <span class="gradient-text">Your Channels</span>
        <q-badge color="cyan" class="q-ml-sm">{{ store.getUserChannels.length }}</q-badge>
      </div>

      <div class="channels-list">
        <TransitionGroup name="channel">
          <div
            v-for="channel in store.getUserChannels"
            :key="channel.id"
            class="channel-item"
            @click="goToChannel(channel.id)"
          >
            <div class="channel-icon" :class="{ 'inactive': daysSinceLastMessage(channel) >= 31 }">
              <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" />
            </div>
            <div class="channel-info">
              <div class="channel-name"># {{ channel.name }}</div>
              <div v-if="daysSinceLastMessage(channel) >= 31" class="channel-inactive">
                <q-icon name="warning" size="12px" />
                Inactive {{ daysSinceLastMessage(channel) }}+ days
              </div>
            </div>
            <div class="channel-actions">
              <q-btn
                flat
                round
                size="sm"
                icon="logout"
                class="leave-btn"
                @click.stop="leave(channel.id)"
              >
                <q-tooltip>Leave channel</q-tooltip>
              </q-btn>
              <q-icon name="chevron_right" class="arrow-icon" />
            </div>
          </div>
        </TransitionGroup>

        <div v-if="store.getUserChannels.length === 0" class="empty-state">
          <q-icon name="inbox" size="60px" />
          <div>No channels yet</div>
          <div class="empty-hint">Create or join a channel to get started!</div>
        </div>
      </div>

      <!-- Public Channels Section -->
      <div class="section-header q-mt-xl">
        <q-icon name="public" class="section-icon public" />
        <span class="gradient-text-alt">Public Channels</span>
        <q-badge color="green" class="q-ml-sm">{{ availablePublicChannels.length }}</q-badge>
      </div>

      <div class="channels-list public">
        <div
          v-for="channel in availablePublicChannels"
          :key="channel.id"
          class="channel-item public"
        >
          <div class="channel-icon public">
            <q-icon name="public" />
          </div>
          <div class="channel-info">
            <div class="channel-name"># {{ channel.name }}</div>
            <div v-if="channel.description" class="channel-desc">{{ channel.description }}</div>
            <div v-if="daysSinceLastMessage(channel) >= 31" class="channel-inactive">
              <q-icon name="warning" size="12px" />
              Inactive {{ daysSinceLastMessage(channel) }}+ days
            </div>
          </div>
          <q-btn
            unelevated
            size="sm"
            label="Join"
            class="join-btn"
            @click.stop="joinPublicChannel(channel.id)"
          />
        </div>

        <div v-if="availablePublicChannels.length === 0" class="empty-state small">
          <q-icon name="explore_off" size="40px" />
          <div>No public channels available</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <q-btn
          class="action-btn create"
          icon="add_circle"
          label="New Public"
          @click="createPublicChannel"
        />
        <q-btn
          class="action-btn private"
          icon="lock"
          label="New Private"
          @click="createPrivateChannel"
        />
        <q-btn
          class="action-btn invite"
          icon="person_add"
          label="Invite"
          @click="testInvite"
        />
      </div>

      <!-- Admin Tools (collapsible) -->
      <q-expansion-item
        class="admin-tools"
        icon="admin_panel_settings"
        label="Admin Tools"
        header-class="admin-header"
      >
        <div class="admin-buttons">
          <q-btn flat size="sm" icon="schedule" label="Create Old Channels" class="admin-btn" @click="createOld" />
          <q-btn flat size="sm" icon="delete_sweep" label="Run Cleanup" class="admin-btn danger" @click="cleanup" />
          <q-btn flat size="sm" icon="analytics" label="Check Activity" class="admin-btn" @click="checkActivity" />
        </div>
      </q-expansion-item>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useChannelsStore } from 'src/stores/channelsStore'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const store = useChannelsStore()
const router = useRouter()
const $q = useQuasar()

const allChannels = ref([])

const currentUserStatus = computed(() => {
  const id = store.currentUser?.id
  return id ? store.getUserStatus(id) : 'offline'
})

const availablePublicChannels = computed(() => {
  const userChannelIds = store.getUserChannels.map(c => c.id)
  return allChannels.value.filter(c => 
    c.type === 'public' && !userChannelIds.includes(c.id)
  )
})

function daysSinceLastMessage(channel) {
  if (!channel.last_message_at) return null
  const lastMsg = new Date(channel.last_message_at)
  const now = new Date()
  const diffMs = now - lastMsg
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays
}

onMounted(async () => {
  await store.loadChannels()
  await loadAllChannels()
})

async function loadAllChannels() {
  try {
    const res = await api.get('/channels')
    allChannels.value = res.data || []
  } catch (err) {
    console.error('Failed to load all channels:', err)
  }
}

async function joinPublicChannel(channelId) {
  try {
    await api.post(`/channels/${channelId}/join`)
    $q.notify({ type: 'positive', message: 'Joined channel successfully!' })
    await store.loadChannels()
    await loadAllChannels()
    goToChannel(channelId)
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to join channel' })
  }
}

async function goToChannel(id) {
  try {
    await api.post(`/channels/${id}/join`)
  } catch (err) {
    const msg = err?.response?.data?.error || err.message
    console.warn('Could not auto-join channel:', msg)
    if (err?.response?.status === 403 || /private|invite required/i.test(String(msg))) {
      $q.notify?.({ type: 'warning', message: msg || 'Invite required for this channel' })
      return
    }
  }
  store.setActiveChannel(id)
  router.push(`/chat/${id}`)
}

async function createPublicChannel() {
  $q.dialog({
    title: 'Create Public Channel',
    message: 'Enter channel name:',
    prompt: { model: '', type: 'text' },
    cancel: true,
    persistent: true
  }).onOk(async (name) => {
    if (!name || !name.trim()) return
    const res = await store.createChannel(name.trim(), 'public')
    if (res && res.error) {
      $q.notify({ type: 'negative', message: res.error || 'Create failed' })
      return
    }
    if (res.channel && res.channel.id) {
      await loadAllChannels()
      goToChannel(res.channel.id)
    }
  })
}

async function createPrivateChannel() {
  $q.dialog({
    title: 'Create Private Channel',
    message: 'Enter channel name:',
    prompt: { model: '', type: 'text' },
    cancel: true,
    persistent: true
  }).onOk(async (name) => {
    if (!name || !name.trim()) return
    const res = await store.createChannel(name.trim(), 'private')
    if (res && res.error) {
      $q.notify({ type: 'negative', message: res.error || 'Create failed' })
      return
    }
    if (res.channel && res.channel.id) {
      goToChannel(res.channel.id)
    }
  })
}

function leave(id) {
  $q.dialog({
    title: 'Leave Channel',
    message: 'Are you sure you want to leave this channel?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    store.leaveChannel(id).then(res => {
      if (res.success) {
        $q.notify({ type: 'positive', message: 'Left channel' })
      } else {
        $q.notify({ type: 'negative', message: res.error || 'Leave failed' })
      }
    })
  })
}

function testInvite() {
  const current = store.activeChannelId || store.getUserChannels[0]?.id
  if (!current) return $q.notify({ type: 'warning', message: 'No channel selected' })

  $q.dialog({
    title: 'Invite user',
    message: 'Enter username to invite:',
    prompt: { model: '', type: 'text' },
    cancel: true,
    persistent: true
  }).onOk(async (username) => {
    if (!username || !username.trim()) return
    try {
      await api.post(`/channels/${current}/messages`, { content: `/invite ${username.trim()}` })
      $q.notify({ type: 'positive', message: `Invite sent to ${username}` })
    } catch (err) {
      $q.notify({ type: 'negative', message: err?.response?.data?.error || 'Invite failed' })
    }
  })
}

function createOld() {
  $q.notify({ type: 'info', message: 'Creating old/demo channels...' })
  store.createTestInactiveChannels().then(async () => {
    await store.loadChannels()
    await loadAllChannels()
    $q.notify({ type: 'positive', message: 'Demo old channels created' })
  }).catch(() => {
    $q.notify({ type: 'negative', message: 'Failed to create demo channels' })
  })
}

function cleanup() {
  $q.dialog({
    title: 'Run Cleanup',
    message: 'This will delete all channels inactive for 30+ days. Continue?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    store.manualCleanup().then(async (result) => {
      await store.loadChannels()
      await loadAllChannels()
      const count = result.deletedChannels || result.deleted || 0
      const leftCount = result.leftChannels || 0
      $q.notify({ type: 'positive', message: `Cleanup complete: ${count} channels deleted, ${leftCount} left` })
    }).catch(() => {
      $q.notify({ type: 'negative', message: 'Cleanup failed' })
    })
  })
}

function checkActivity() {
  store.fetchActivitySnapshot(1).then((rows) => {
    const summary = rows
      .map(r => `#${r.name}: ${r.lastMessageAt ? new Date(r.lastMessageAt).toLocaleString() : 'no messages'}`)
      .join('\n') || 'No channels'
    $q.dialog({ title: 'Channel activity', message: summary.replace(/\n/g, '<br>'), html: true })
  }).catch(() => {
    $q.notify({ type: 'negative', message: 'Activity check failed' })
  })
}
</script>

<style scoped>
.channels-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  position: relative;
  overflow-x: hidden;
}

.background-animation {
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.15), rgba(103, 58, 183, 0.15));
  animation: float 20s infinite ease-in-out;
}

.bubble-1 { width: 150px; height: 150px; left: -5%; top: 10%; animation-delay: 0s; }
.bubble-2 { width: 200px; height: 200px; right: -8%; top: 40%; animation-delay: 5s; }
.bubble-3 { width: 100px; height: 100px; left: 20%; bottom: 10%; animation-delay: 10s; }
.bubble-4 { width: 120px; height: 120px; right: 15%; bottom: 20%; animation-delay: 15s; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-30px) rotate(180deg); opacity: 0.6; }
}

.channels-container {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 30px;
}

.user-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #00bcd4, #7c4dff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #1a1a2e;
}

.status-dot.online { background: #4caf50; }
.status-dot.away { background: #ff9800; }
.status-dot.busy { background: #f44336; }
.status-dot.offline { background: #9e9e9e; }

.user-info { flex: 1; }
.user-name { color: white; font-weight: 600; font-size: 1.1rem; }
.user-email { color: rgba(255, 255, 255, 0.5); font-size: 0.85rem; }

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 1.3rem;
  font-weight: 700;
}

.section-icon { font-size: 1.5rem; color: #00bcd4; }
.section-icon.public { color: #4caf50; }

.gradient-text {
  background: linear-gradient(90deg, #00bcd4, #7c4dff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-alt {
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.channels-list {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.channel-item:last-child { border-bottom: none; }
.channel-item:hover { background: rgba(0, 188, 212, 0.1); }
.channel-item.public:hover { background: rgba(76, 175, 80, 0.1); }

.channel-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00bcd4, #7c4dff);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.channel-icon.public { background: linear-gradient(135deg, #4caf50, #8bc34a); }
.channel-icon.inactive { background: linear-gradient(135deg, #ff9800, #f44336); }

.channel-info { flex: 1; min-width: 0; }
.channel-name { color: white; font-weight: 600; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.channel-desc { color: rgba(255, 255, 255, 0.5); font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.channel-inactive {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff9800;
  font-size: 0.75rem;
  margin-top: 2px;
}

.channel-actions { display: flex; align-items: center; gap: 8px; }

.leave-btn {
  color: rgba(255, 255, 255, 0.4) !important;
  opacity: 0;
  transition: all 0.2s ease;
}

.channel-item:hover .leave-btn { opacity: 1; }
.leave-btn:hover { color: #f44336 !important; }

.arrow-icon { color: rgba(255, 255, 255, 0.3); transition: transform 0.2s ease; }
.channel-item:hover .arrow-icon { transform: translateX(4px); color: rgba(255, 255, 255, 0.6); }

.join-btn {
  background: linear-gradient(135deg, #4caf50, #8bc34a) !important;
  color: white !important;
  border-radius: 8px !important;
  text-transform: none;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}

.empty-state.small { padding: 25px 20px; }
.empty-state .q-icon { margin-bottom: 10px; opacity: 0.5; }
.empty-hint { font-size: 0.85rem; margin-top: 5px; color: rgba(255, 255, 255, 0.3); }

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  flex: 1;
  min-width: 140px;
  max-width: 200px;
  padding: 14px 20px !important;
  border-radius: 14px !important;
  text-transform: none;
  font-weight: 600;
  color: white !important;
  transition: all 0.3s ease;
}

.action-btn.create { background: linear-gradient(135deg, #00bcd4, #7c4dff) !important; }
.action-btn.private { background: linear-gradient(135deg, #ff9800, #f57c00) !important; }
.action-btn.invite { background: linear-gradient(135deg, #4caf50, #8bc34a) !important; }

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.admin-tools {
  margin-top: 30px;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px !important;
}

.admin-tools :deep(.q-item) { color: rgba(255, 255, 255, 0.6); }
.admin-tools :deep(.q-expansion-item__content) { padding: 0; }

.admin-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
}

.admin-btn {
  color: rgba(255, 255, 255, 0.6) !important;
  text-transform: none;
  font-size: 0.85rem;
}

.admin-btn:hover { color: white !important; background: rgba(255, 255, 255, 0.1) !important; }
.admin-btn.danger:hover { color: #f44336 !important; background: rgba(244, 67, 54, 0.1) !important; }

.channel-enter-active, .channel-leave-active { transition: all 0.3s ease; }
.channel-enter-from { opacity: 0; transform: translateX(-20px); }
.channel-leave-to { opacity: 0; transform: translateX(20px); }

@media (max-width: 600px) {
  .user-card { flex-wrap: wrap; }
  .user-stats { width: 100%; margin-top: 10px; }
  .action-buttons { flex-direction: column; }
  .action-btn { max-width: 100%; }
  .section-header { font-size: 1.1rem; }
}
</style>
