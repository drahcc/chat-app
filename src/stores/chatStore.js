import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { useAuthStore } from './authStore'

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref([])
  const readReceipts = ref({}) // { messageId: [{ userId, username, readAt }] }
  const pinnedMessages = ref([])
  const searchResults = ref([])
  const channelMembers = ref([])
  
  const currentChannelId = ref(null)
  const isLoadingMessages = ref(false)
  const isSearching = ref(false)
  
  // Computed
  const sortedMessages = computed(() => {
    return [...messages.value].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    )
  })

  // ============================
  // MESSAGE OPERATIONS
  // ============================
  
  async function loadMessages(channelId, page = 1) {
    try {
      isLoadingMessages.value = true
      currentChannelId.value = channelId
      
      const response = await api.get(`/channels/${channelId}/messages`, {
        params: { page }
      })
      
      messages.value = response.data.data || []
      
      return { success: true, messages: messages.value }
    } catch (error) {
      console.error('Load messages error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to load messages' }
    } finally {
      isLoadingMessages.value = false
    }
  }

  async function sendMessage(channelId, content) {
    try {
      const response = await api.post(`/channels/${channelId}/messages`, { content })
      
      if (response.data.success) {
        messages.value.push(response.data.message)
        return { success: true, message: response.data.message }
      }
      
      return { success: false, error: 'Failed to send message' }
    } catch (error) {
      console.error('Send message error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to send message' }
    }
  }

  async function editMessage(messageId, content) {
    try {
      const response = await api.put(`/messages/${messageId}`, { content })

      const updated = response.data?.message || response.data
      if (updated) {
        const index = messages.value.findIndex(m => m.id === messageId)
        if (index !== -1) {
          Object.assign(messages.value[index], updated)
        }
        return { success: true, message: updated }
      }

      return { success: false, error: 'Failed to edit message' }
    } catch (error) {
      console.error('Edit message error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to edit message' }
    }
  }

  async function deleteMessage(messageId) {
    try {
      const response = await api.delete(`/messages/${messageId}`)

      const updated = response.data?.message || response.data
      if (updated) {
        const index = messages.value.findIndex(m => m.id === messageId)
        if (index !== -1) {
          Object.assign(messages.value[index], updated)
        }
        return { success: true, message: updated }
      }

      return { success: false, error: 'Failed to delete message' }
    } catch (error) {
      console.error('Delete message error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to delete message' }
    }
  }

  async function searchMessages(channelId, query, page = 1) {
    try {
      isSearching.value = true
      
      const response = await api.get(`/channels/${channelId}/messages/search`, {
        params: { q: query, page }
      })
      
      searchResults.value = response.data.messages?.data || []
      return { success: true, results: searchResults.value }
    } catch (error) {
      console.error('Search messages error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to search messages' }
    } finally {
      isSearching.value = false
    }
  }

  // ============================
  // READ RECEIPTS
  // ============================
  
  async function markAsRead(messageId) {
    try {
      await api.post('/messages/read', { message_id: messageId })
      return { success: true }
    } catch (error) {
      console.error('Mark as read error:', error)
      return { success: false }
    }
  }

  async function markMultipleAsRead(messageIds) {
    try {
      await api.post('/messages/read/multiple', { message_ids: messageIds })
      return { success: true }
    } catch (error) {
      console.error('Mark multiple as read error:', error)
      return { success: false }
    }
  }

  // ============================
  // PINNED MESSAGES
  // ============================
  
  async function pinMessage(messageId) {
    try {
      const response = await api.post(`/messages/${messageId}/pin`)
      
      if (response.data.pinnedMessage) {
        pinnedMessages.value.push(response.data.pinnedMessage)
        return { success: true }
      }
      
      return { success: false }
    } catch (error) {
      console.error('Pin message error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to pin message' }
    }
  }

  async function unpinMessage(messageId) {
    try {
      await api.delete(`/messages/${messageId}/pin`)
      
      pinnedMessages.value = pinnedMessages.value.filter(p => p.message_id !== messageId)
      return { success: true }
    } catch (error) {
      console.error('Unpin message error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to unpin message' }
    }
  }

  async function loadPinnedMessages(channelId) {
    try {
      const response = await api.get(`/channels/${channelId}/pinned`)
      
      pinnedMessages.value = response.data.pinnedMessages || []
      return { success: true, pinnedMessages: pinnedMessages.value }
    } catch (error) {
      console.error('Load pinned messages error:', error)
      return { success: false }
    }
  }

  // ============================
  // CHANNEL MEMBERS
  // ============================
  
  async function loadChannelMembers(channelId) {
    try {
      const response = await api.get(`/channels/${channelId}/members`)
      
      channelMembers.value = response.data.members || []
      return { success: true, members: channelMembers.value }
    } catch (error) {
      console.error('Load channel members error:', error)
      return { success: false }
    }
  }

  // ============================
  // REAL-TIME SOCKET HANDLERS
  // ============================
  
  function handleNewMessage(message) {
    const existing = message.id && messages.value.find(m => m.id === message.id)
    if (existing) {
      Object.assign(existing, message)
      return
    }
    messages.value.push(message)
  }

  function handleMessageEdit(data) {
    const index = messages.value.findIndex(m => m.id === data.messageId)
    if (index !== -1) {
      messages.value[index].content = data.content
      messages.value[index].is_edited = true
      messages.value[index].edited_at = data.editedAt
    }
  }

  function handleMessageDelete(data) {
    const index = messages.value.findIndex(m => m.id === data.messageId)
    if (index !== -1) {
      messages.value[index].is_deleted = true
      messages.value[index].deleted_at = data.deletedAt
      messages.value[index].content = '[Message deleted]'
    }
  }

  function handlePin(data) {
    if (data.action === 'pin') {
      const message = messages.value.find(m => m.id === data.messageId)
      if (message && !pinnedMessages.value.find(p => p.message_id === data.messageId)) {
        pinnedMessages.value.push({
          message_id: data.messageId,
          message: message,
          pinned_by: data.userId
        })
      }
    } else if (data.action === 'unpin') {
      pinnedMessages.value = pinnedMessages.value.filter(p => p.message_id !== data.messageId)
    }
  }

  function handleReadReceipt(data) {
    if (!readReceipts.value[data.messageId]) {
      readReceipts.value[data.messageId] = []
    }
    
    if (!readReceipts.value[data.messageId].find(r => r.userId === data.userId)) {
      readReceipts.value[data.messageId].push({
        userId: data.userId,
        username: data.username,
        readAt: data.readAt
      })
    }
  }

  return {
    // State
    messages,
    readReceipts,
    pinnedMessages,
    searchResults,
    channelMembers,
    currentChannelId,
    isLoadingMessages,
    isSearching,
    
    // Computed
    sortedMessages,
    
    // Messages
    loadMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    searchMessages,
    
    // Read Receipts
    markAsRead,
    markMultipleAsRead,
    
    // Pinned Messages
    pinMessage,
    unpinMessage,
    loadPinnedMessages,
    
    // Channel Members
    loadChannelMembers,
    
    // Socket Handlers
    handleNewMessage,
    handleMessageEdit,
    handleMessageDelete,
    handlePin,
    handleReadReceipt
  }
})
