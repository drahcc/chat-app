<template>
  <q-page class="q-pa-md">

    <!-- DEBUG INFO -->
    <div class="bg-yellow-2 q-pa-sm q-mb-md">
      <div class="text-grey-8 text-caption">
        <strong>DEBUG:</strong><br>
        User: {{ store.currentUser }}<br>
        Channels: {{ store.getUserChannels.length }}
      </div>
    </div>

    <!-- TITLE -->
    <div class="text-h6 text-primary q-mb-sm">
      💬 Your Channels
    </div>

    <!-- CHANNEL LIST -->
    <q-list bordered separator>

      <!-- Channels Loop -->
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

      <!-- NO CHANNELS -->
      <q-item v-if="store.getUserChannels.length === 0">
        <q-item-section class="text-center text-grey q-pa-xl">
          <q-icon name="tag" size="xl" class="q-mb-md" />
          <div>Нямаш налични канали.</div>
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
        label="🚀 Direct"
        color="purple"
        icon="rocket_launch"
        @click="goDirect"
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
import { useChannelsStore } from 'src/stores/channelsStore'
import { useRouter } from 'vue-router'

const store = useChannelsStore()
const router = useRouter()

function goToChannel(id) {
  router.push(`/chat/${id}`)
}

function createPublicChannel() {
  const name = prompt("Enter channel name:")
  if (!name) return
  const channel = store.createChannel(name, "public")
  goToChannel(channel.id)
}

function createPrivateChannel() {
  const name = prompt("Enter channel name:")
  if (!name) return
  const channel = store.createChannel(name, "private")
  goToChannel(channel.id)
}

function leave(id) {
  store.leaveChannel(id)
}

function testInvite() {
  alert("Invite test triggered")
}

function createOld() {
  store.createTestInactiveChannels()
}

function cleanup() {
  store.manualCleanup()
}

function checkActivity() {
  alert("Checked channel activity")
}

function goDirect() {
  const first = store.getUserChannels[0]
  if (first) goToChannel(first.id)
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
