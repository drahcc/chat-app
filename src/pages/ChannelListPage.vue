<template>
  <q-page class="q-pa-md">

    <!-- DEBUG INFO -->
    <div class="bg-yellow-2 q-pa-sm q-mb-md">
      <div class="text-grey-8 text-caption row items-center q-gutter-sm">
        <strong class="q-mr-sm">DEBUG:</strong>
        <q-chip size="sm" color="primary" text-color="white" icon="person">
          {{ store.currentUser?.username || store.currentUser?.nickname || '—' }}
        </q-chip>
        <q-chip size="sm" color="grey-7" text-color="white" icon="mail">
          {{ store.currentUser?.email || '—' }}
        </q-chip>
        <q-chip
          size="sm"
          :color="statusColor"
          text-color="white"
          icon="fiber_manual_record"
        >
          {{ currentUserStatus }}
        </q-chip>
        <q-chip size="sm" color="secondary" text-color="white" icon="list">
          Channels: {{ store.getUserChannels.length }}
        </q-chip>
      </div>
    </div>

    <!-- TITLE -->
    <div class="text-h6 text-primary q-mb-sm">
      💬 Your Channels
    </div>

    <!-- CHANNEL LIST -->
    <q-list bordered separator>
      <q-item
        v-for="channel in store.getUserChannels"
        :key="channel.id"
        clickable
        v-ripple
        @click="goToChannel(channel.id)"
      >
        <q-item-section avatar>
          <q-icon name="tag" color="primary" />
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-bold">
            # {{ channel.name }}
          </q-item-label>
          <q-item-label caption v-if="daysSinceLastMessage(channel) >= 31" class="text-orange">
            ⚠️ Inactive {{ daysSinceLastMessage(channel) }}+ days
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn
            flat
            round
            icon="logout"
            color="grey"
            @click.stop="leave(channel.id)"
          >
            <q-tooltip>Leave channel</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>

      <q-item v-if="store.getUserChannels.length === 0">
        <q-item-section class="text-center text-grey q-pa-xl">
          <q-icon name="tag" size="xl" class="q-mb-md" />
          <div>Нямаш налични канали.</div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- PUBLIC CHANNELS -->
    <div class="text-h6 text-secondary q-mb-sm q-mt-xl">
      🌐 Public Channels
    </div>

    <q-list bordered separator>
      <q-item
        v-for="channel in availablePublicChannels"
        :key="channel.id"
        clickable
        v-ripple
      >
        <q-item-section avatar>
          <q-icon name="public" color="secondary" />
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-weight-bold">
            # {{ channel.name }}
          </q-item-label>
          <q-item-label caption v-if="channel.description">
            {{ channel.description }}
          </q-item-label>
          <q-item-label caption v-if="daysSinceLastMessage(channel) >= 31" class="text-orange">
            ⚠️ Inactive {{ daysSinceLastMessage(channel) }}+ days
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn
            flat
            color="positive"
            label="Join"
            @click.stop="joinPublicChannel(channel.id)"
          >
            <q-tooltip>Join this channel</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>

      <q-item v-if="availablePublicChannels.length === 0">
        <q-item-section class="text-center text-grey q-pa-md">
          <div>No public channels available</div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- BUTTONS -->
    <div class="row q-gutter-sm justify-center q-mt-xl">

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
        @click="testInvite"
      />

      <q-btn
        label="Create Old Channels"
        color="grey"
        icon="schedule"
        @click="createOld"
      />

      <q-btn
        label="Run Cleanup"
        color="red"
        icon="delete"
        @click="cleanup"
      />

      <q-btn
        label="Check Activity"
        color="blue"
        icon="info"
        @click="checkActivity"
      />

      <q-btn
        label="🧪 Test Nav"
        color="red"
        icon="bug_report"
        @click="testNav"
      />
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

const statusColor = computed(() => {
  switch (currentUserStatus.value) {
    case 'online': return 'green'
    case 'dnd': return 'orange'
    default: return 'grey'
  }
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
    // Try to join first (no-op if already member)
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
    prompt: {
      model: '',
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk(async (name) => {
    if (!name || !name.trim()) {
      return
    }

    const res = await store.createChannel(name.trim(), 'public')

    if (res && res.error) {
      $q.notify({ type: 'negative', message: res.error || 'Create failed' })
      return
    }

    if (res.channel && res.channel.id) {
      goToChannel(res.channel.id)
    }
  })
}

async function createPrivateChannel() {
  $q.dialog({
    title: 'Create Private Channel',
    message: 'Enter channel name:',
    prompt: {
      model: '',
      type: 'text'
    },
    cancel: true,
    persistent: true
  }).onOk(async (name) => {
    if (!name || !name.trim()) {
      return
    }

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
  store.leaveChannel(id).then(res => {
    if (res.success) {
      $q.notify({ type: 'positive', message: 'Left channel' })
    } else {
      $q.notify({ type: 'negative', message: res.error || 'Leave failed' })
    }
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
  store.manualCleanup().then(async (result) => {
    await store.loadChannels()
    await loadAllChannels()
    const count = result.deletedChannels || result.deleted || 0
    const leftCount = result.leftChannels || 0
    $q.notify({ 
      type: 'positive', 
      message: `Cleanup complete: ${count} channels deleted, ${leftCount} left` 
    })
  }).catch(() => {
    $q.notify({ type: 'negative', message: 'Cleanup failed' })
  })
}

function checkActivity() {
  store.fetchActivitySnapshot(1).then((rows) => {
    const summary = rows
      .map(r => `#${r.name}: ${r.lastMessageAt ? new Date(r.lastMessageAt).toLocaleString() : 'no messages'}`)
      .join('\n') || 'No channels'
    $q.dialog({
      title: 'Channel activity',
      message: summary.replace(/\n/g, '<br>'),
      html: true
    })
  }).catch(() => {
    $q.notify({ type: 'negative', message: 'Activity check failed' })
  })
}

function testNav() {
  const first = store.getUserChannels[0]
  if (first) goToChannel(first.id)
}
</script>

<style scoped>
.bg-yellow-2 {
  border-radius: 6px;
}
</style>
