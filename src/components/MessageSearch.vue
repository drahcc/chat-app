<template>
  <q-card flat class="q-mb-md">
    <q-card-section class="q-pa-md bg-grey-9">
      <div class="row items-center q-gutter-sm">
        <q-input
          v-model="searchQuery"
          placeholder="Search messages..."
          filled
          dense
          @keyup.enter="performSearch"
          class="col"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          color="primary"
          icon="search"
          @click="performSearch"
          :loading="isSearching"
        />
        <q-btn
          flat
          round
          icon="close"
          @click="closeSearch"
          color="grey-6"
        />
      </div>

      <!-- Search Results -->
      <div v-if="results.length" class="q-mt-md">
        <div class="text-h6 q-mb-md">
          Found {{ results.length }} result(s)
        </div>
        <div class="column q-gutter-md">
          <div
            v-for="msg in results"
            :key="msg.id"
            class="q-pa-md bg-grey-8 rounded-borders cursor-pointer hover-highlight"
            @click="jumpToMessage(msg.id)"
          >
            <div class="row items-center justify-between q-mb-sm">
              <span class="text-bold">
                {{ msg.user?.username || `User #${msg.user_id}` }}
              </span>
              <span class="text-caption text-grey-6">
                {{ formatTime(msg.created_at) }}
              </span>
            </div>
            <div class="text-white" v-html="highlight(msg.content)"></div>
          </div>
        </div>
      </div>
      <div v-else-if="hasSearched" class="text-center text-grey-5 q-mt-md">
        No results found
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useChatStore } from '../stores/chatStore'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'MessageSearch',
  props: {
    channelId: {
      type: Number,
      required: true
    }
  },
  emits: ['close', 'jump-to-message'],
  setup(props, { emit }) {
    const chatStore = useChatStore()
    const $q = useQuasar()
    
    const searchQuery = ref('')
    const results = ref([])
    const isSearching = ref(false)
    const hasSearched = ref(false)
    
    const performSearch = async () => {
      if (!searchQuery.value.trim()) {
        $q.notify({
          type: 'warning',
          message: 'Enter search query'
        })
        return
      }

      isSearching.value = true
      const result = await chatStore.searchMessages(props.channelId, searchQuery.value)
      isSearching.value = false
      hasSearched.value = true

      if (result.success) {
        results.value = result.results
      } else {
        $q.notify({
          type: 'negative',
          message: result.error || 'Search failed'
        })
      }
    }

    const highlight = (text) => {
      if (!text) return ''
      if (!searchQuery.value.trim()) return text.substring(0, 200) + (text.length > 200 ? '...' : '')
      const escaped = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escaped})`, 'gi')
      const clipped = text.substring(0, 200) + (text.length > 200 ? '...' : '')
      return clipped.replace(regex, '<mark class="highlight">$1</mark>')
    }
    
    const closeSearch = () => {
      emit('close')
    }
    
    const jumpToMessage = (messageId) => {
      emit('jump-to-message', messageId)
      closeSearch()
    }
    
    const formatTime = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    return {
      chatStore,
      $q,
      searchQuery,
      results,
      isSearching,
      hasSearched,
      performSearch,
      closeSearch,
      jumpToMessage,
      formatTime,
      highlight
    }
  }
})
</script>

<style scoped>
.hover-highlight:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
  transform: translateX(4px);
  transition: all 0.2s;
}
.highlight {
  background: #ffeb3b;
  color: #000;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
