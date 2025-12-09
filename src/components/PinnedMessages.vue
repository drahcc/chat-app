<template>
  <q-card v-if="pinnedMessages.length" flat class="q-mb-md">
    <q-card-section class="q-pa-md bg-warning text-grey-10">
      <div class="row items-center justify-between">
        <div class="row items-center q-gutter-sm">
          <q-icon name="push_pin" size="lg" />
          <div>
            <div class="text-h6">Pinned Messages ({{ pinnedMessages.length }})</div>
            <div class="text-caption">Click to scroll to message</div>
          </div>
        </div>
        <q-btn
          flat
          round
          :icon="collapsed ? 'expand_more' : 'expand_less'"
          @click="collapsed = !collapsed"
          color="grey-10"
        />
      </div>

      <!-- Pinned Messages List -->
      <div v-if="!collapsed" class="q-mt-md column q-gutter-sm">
        <div
          v-for="pinned in pinnedMessages"
          :key="pinned.message_id"
          class="q-pa-md bg-white rounded-borders cursor-pointer hover-effect"
          @click="jumpToMessage(pinned.message_id)"
        >
          <div class="row items-center justify-between q-mb-xs">
            <span class="text-bold text-grey-10">
              {{ pinned.message?.user?.username || 'Unknown User' }}
            </span>
            <span class="text-caption text-grey-6">
              {{ formatTime(pinned.message?.created_at) }}
            </span>
          </div>
          <div class="text-grey-10 text-body2">
            {{ pinned.message?.content?.substring(0, 80) || '[Deleted message]' }}
            <span v-if="pinned.message?.content?.length > 80">...</span>
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            Pinned by {{ pinned.pinnedBy?.username || 'Admin' }}
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useChatStore } from '../stores/chatStore'

export default defineComponent({
  name: 'PinnedMessages',
  props: {
    channelId: {
      type: Number,
      required: true
    }
  },
  emits: ['jump-to-message'],
  setup() {
    const chatStore = useChatStore()
    const collapsed = ref(false)

    return {
      chatStore,
      collapsed
    }
  },
  computed: {
    pinnedMessages() {
      return this.chatStore.pinnedMessages
    }
  },
  methods: {
    async loadPinned() {
      await this.chatStore.loadPinnedMessages(this.channelId)
    },
    jumpToMessage(messageId) {
      this.$emit('jump-to-message', messageId)
    },
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  },
  mounted() {
    this.loadPinned()
  }
})
</script>

<style scoped>
.hover-effect:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}
</style>
