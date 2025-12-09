<template>
  <div 
    class="message-item q-pa-md q-mb-md rounded-borders" 
    :class="isMentioned ? 'bg-yellow-1 border-l-4 border-yellow' : 'bg-grey-8'"
    @mouseenter="showMessageActions = true"
    @mouseleave="showMessageActions = false"
  >
    <!-- Header: Username & Time -->
    <div class="row items-center justify-between q-mb-sm">
      <div class="row items-center q-gutter-sm">
        <q-avatar 
          v-if="message.user?.avatar_url" 
          :src="message.user.avatar_url" 
          size="32px"
        />
        <div>
          <div class="text-bold text-white">
            <span>{{ message.user?.display_name || message.user?.username || `User #${message.user_id}` }}</span>
            <q-icon
              name="circle"
              size="10px"
              class="q-ml-xs"
              :color="statusColor(statusFor(message.user_id))"
            />
          </div>
          <div class="text-caption text-grey-6">
            {{ formatTime(message.created_at) }}
            <span v-if="message.is_edited" class="q-ml-sm text-italic">(edited)</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons (Edit, Delete, Pin) -->
      <div v-if="showMessageActions && isOwnMessage" class="row q-gutter-xs">
        <q-btn
          flat
          dense
          round
          icon="edit"
          size="sm"
          color="primary"
          @click="startEdit"
          title="Edit message"
        />
        <q-btn
          flat
          dense
          round
          icon="delete"
          size="sm"
          color="negative"
          @click="deleteMsg"
          title="Delete message"
        />
        <q-btn
          v-if="canPin"
          flat
          dense
          round
          icon="push_pin"
          size="sm"
          color="warning"
          @click="pinMsg"
          title="Pin message"
        />
      </div>
    </div>

    <!-- Message Content -->
    <div v-if="!isEditingThis" class="text-white q-mb-md">
      <div v-if="message.is_deleted" class="text-grey-5 text-italic">
        [Message deleted]
      </div>
      <div v-else v-html="formatMessageWithMentions(message.content)"></div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="q-mb-md">
      <q-input
        v-model="editedContent"
        type="textarea"
        filled
        dense
        autofocus
        label="Edit message"
        class="q-mb-sm"
      />
      <div class="row q-gutter-xs">
        <q-btn
          label="Save"
          color="primary"
          size="sm"
          @click="saveEdit"
        />
        <q-btn
          label="Cancel"
          color="grey-6"
          size="sm"
          @click="isEditingThis = false"
        />
      </div>
    </div>

    <!-- Read Receipts -->
    <div v-if="readBy.length" class="row items-center q-gutter-xs text-caption text-grey-5">
      <q-icon name="done_all" size="xs" />
      <span>{{ readBy.map(r => r.username).join(', ') }} read this</span>
    </div>

    <!-- Attachments -->
    <div v-if="message.attachments && message.attachments.length" class="q-mt-md">
      <div class="text-caption text-grey-6 q-mb-sm">Attachments:</div>
      <div class="row q-gutter-sm flex-wrap">
        <q-card
          v-for="attachment in message.attachments"
          :key="attachment.id"
          class="q-pa-sm"
          style="cursor: pointer; max-width: 200px"
        >
          <q-img
            v-if="isImageFile(attachment.mime_type)"
            :src="attachmentSrc(attachment.file_path)"
            style="max-height: 150px"
          />
          <a v-else :href="attachmentSrc(attachment.file_path)" target="_blank" class="text-center q-pa-md bg-grey-8 flex flex-center column" style="color: inherit; text-decoration: none;">
            <q-icon name="attachment" size="lg" />
          </a>
          <div class="text-caption text-center q-mt-xs">
            {{ attachment.original_name }}
          </div>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useChannelsStore } from '../stores/channelsStore'

export default defineComponent({
  name: 'MessageItem',
  props: {
    message: {
      type: Object,
      required: true
    },
    channelId: {
      type: Number,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    const channelsStore = useChannelsStore()

    // Local UI state (use refs so Quasar menus and edits stay reactive)
    const showMessageActions = ref(false)
    const isEditingThis = ref(false)
    const editedContent = ref('')

    return {
      authStore,
      chatStore,
      showMessageActions,
      isEditingThis,
      editedContent,
      isMentioned: props.message.mentioned_user_id === authStore.user?.id,
      isOwnMessage: props.message.user_id === authStore.user?.id,
      canPin: props.isAdmin || props.message.user_id === authStore.user?.id,
      isDeleted: props.message.is_deleted,
      statusFor: (userId) => channelsStore.getUserStatus(userId)
    }
  },
  computed: {
    readBy() {
      return this.chatStore.readReceipts[this.message.id] || []
    }
  },
  methods: {
    formatTime(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    },
    formatMessageWithMentions(content) {
      if (!content) return ''
      return content.replace(/@(\w+)/g, '<span style="color: #64b5f6; font-weight: bold;">@$1</span>')
    },
    isImageFile(mimeType) {
      return mimeType?.startsWith('image/')
    },
    statusColor(status) {
      switch (status) {
        case 'online': return 'green'
        case 'away': return 'orange'
        case 'busy': return 'red'
        default: return 'grey-6'
      }
    },
    attachmentSrc(path) {
      if (!path) return ''
      if (path.startsWith('http')) return path
      const base = api?.defaults?.baseURL || ''
      return `${base}${path}`
    },
    startEdit() {
      this.editedContent = this.message.content
      this.isEditingThis = true
    },
    async saveEdit() {
      if (!this.editedContent.trim()) {
        this.$q.notify({
          type: 'warning',
          message: 'Message cannot be empty'
        })
        return
      }

      const result = await this.chatStore.editMessage(this.message.id, this.editedContent)
      if (result.success) {
        if (result.message) {
          Object.assign(this.message, result.message)
        } else {
          this.message.content = this.editedContent
          this.message.is_edited = true
        }
        this.$q.notify({
          type: 'positive',
          message: 'Message edited successfully'
        })
        this.isEditingThis = false
      } else {
        this.$q.notify({
          type: 'negative',
          message: result.error || 'Failed to edit message'
        })
      }
    },
    async deleteMsg() {
      this.$q.dialog({
        title: 'Delete Message',
        message: 'Are you sure you want to delete this message?',
        cancel: true,
        persistent: true
      }).onOk(async () => {
        const result = await this.chatStore.deleteMessage(this.message.id)
        if (result.success) {
          if (result.message) {
            Object.assign(this.message, result.message)
          } else {
            this.message.is_deleted = true
            this.message.content = '[Message deleted]'
          }
          this.$q.notify({
            type: 'positive',
            message: 'Message deleted successfully'
          })
        } else {
          this.$q.notify({
            type: 'negative',
            message: result.error || 'Failed to delete message'
          })
        }
      })
    },
    async pinMsg() {
      const result = await this.chatStore.pinMessage(this.message.id)
      if (result.success) {
        this.$q.notify({
          type: 'positive',
          message: 'Message pinned successfully'
        })
      } else {
        this.$q.notify({
          type: 'negative',
          message: result.error || 'Failed to pin message'
        })
      }
    }
  }
})
</script>

<style scoped>
.message-item {
  border-left: 4px solid transparent;
  transition: background-color 0.2s;
}

.message-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.reaction-chip {
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s;
  font-size: 14px;
}

.reaction-chip:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.border-l-4 {
  border-left-width: 4px !important;
}

.border-yellow {
  border-left-color: #ffc107 !important;
}
</style>
