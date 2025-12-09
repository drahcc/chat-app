// src/stores/channelsStore.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { joinChannel } from 'src/boot/ws'
import { useAuthStore } from './authStore'

export const useChannelsStore = defineStore('channels', {
  state: () => ({
    currentUser: null,
    channels: [],
    activeChannelId: null,
    userStatuses: {} // userId -> status mapping
  }),

  getters: {
    getUserChannels(state) {
      return state.channels
    },
    getChannelById: (state) => (id) => state.channels.find(c => c.id === id),
    getUserStatus: (state) => (userId) => {
      return state.userStatuses[userId] || 'offline'
    }
  },

  actions: {
    // load channels and set current user from auth store
    async loadChannels() {
      try {
        const res = await api.get('/channels')
        // API may return array in res.data
        this.channels = Array.isArray(res.data) ? res.data : (res.data?.data || [])

        // set current user from auth store
        const auth = useAuthStore()
        this.currentUser = auth.user || null

        // Load all user statuses
        await this.loadAllUserStatuses()

        // auto-join ws topics (safe: joinChannel checks ws)
        this.channels.forEach(c => {
          if (c && c.id) joinChannel(c.id)
        })

        // pick first as active
        if (this.channels.length && !this.activeChannelId) {
          this.activeChannelId = this.channels[0].id
        }

        return this.channels
      } catch (err) {
        console.error('loadChannels error', err)
        return []
      }
    },

    setActiveChannel(id) {
      this.activeChannelId = id
      if (id) joinChannel(id)
    },

    // create new channel
    async createChannel(name, type = 'public') {
      try {
        console.log('🚀 Creating channel:', name, type)
        const res = await api.post('/channels', { name, type })
        console.log('📦 Response:', res.data)
        
        // backend might return channel directly or wrapped -> normalise
        const chan = res.data?.channel || res.data || null

        console.log('🔍 Parsed channel:', chan)

        if (!chan) {
          // if API returned something unexpected, try res.data.data
          const alt = res.data?.data
          if (alt) {
            this.channels.push(alt)
            joinChannel(alt.id)
            return { created: true, channel: alt }
          }
          throw new Error('Invalid response from server')
        }

        if (!chan.members) chan.members = []
        this.channels.push(chan)

        // join websocket topic
        if (chan.id) joinChannel(chan.id)

        console.log('✅ Channel created successfully:', chan)
        return { created: true, channel: chan }
      } catch (err) {
        console.error('❌ createChannel error', err)
        console.error('Error response:', err?.response?.data)
        // return backend message when available
        const message = err?.response?.data || err.message
        return { created: false, error: message }
      }
    },

    // refresh single channel from backend
    async refreshChannel(id) {
      try {
        const res = await api.get(`/channels/${id}`)
        const newChan = res.data || res.data?.channel
        const idx = this.channels.findIndex(c => c.id === id)
        if (idx === -1) {
          this.channels.push(newChan)
        } else {
          this.channels[idx] = newChan
        }
        joinChannel(id)
        return newChan
      } catch (err) {
        console.error('refreshChannel', err)
        return null
      }
    },

    removeChannelFromList(id) {
      this.channels = this.channels.filter(c => c.id !== id)
      if (this.activeChannelId === id) this.activeChannelId = this.channels[0]?.id || null
    },

    async setUserStatus(status) {
      try {
        const auth = useAuthStore()
        await api.post('/users/status', { status })
        
        // Update local status
        if (auth.user?.id) {
          this.userStatuses[auth.user.id] = status
        }
        
        return true
      } catch (err) {
        console.error('setUserStatus error:', err)
        return false
      }
    },

    updateUserStatus(userId, status) {
      this.userStatuses[userId] = status
    },

    async loadAllUserStatuses() {
      try {
        const res = await api.get('/users/statuses')
        this.userStatuses = res.data || {}
        console.log('✅ Loaded user statuses:', this.userStatuses)
      } catch (err) {
        console.error('Failed to load user statuses:', err)
      }
    },

    async leaveChannel(id) {
      try {
        await api.post(`/channels/${id}/leave`)
        this.removeChannelFromList(id)
        return { success: true }
      } catch (err) {
        console.error('leaveChannel error', err?.response?.data || err)
        return { success: false, error: err?.response?.data || err.message }
      }
    },

    async createTestInactiveChannels() {
      const names = ['old-archive-1', 'old-archive-2', 'old-archive-3']
      const results = []
      // Set last_message_at to 32 days ago
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 32)
      
      for (const name of names) {
        const res = await this.createChannel(name, 'public')
        if (res.channel && res.channel.id) {
          try {
            // Update last_message_at to old date
            await api.patch(`/channels/${res.channel.id}`, {
              last_message_at: oldDate.toISOString()
            })
          } catch (err) {
            console.error('Failed to set old date:', err)
          }
        }
        results.push(res)
      }
      return results
    },

    async manualCleanup() {
      try {
        const res = await api.post('/channels/cleanup')
        return res.data
      } catch (err) {
        console.error('manualCleanup error', err?.response?.data || err)
        throw err
      }
    },

    async fetchActivitySnapshot(limitPerChannel = 1) {
      const snapshots = []
      for (const chan of this.channels) {
        try {
          const res = await api.get(`/channels/${chan.id}/messages`, { params: { page: 1, perPage: limitPerChannel } })
          const list = res.data?.data || res.data || []
          const latest = Array.isArray(list) && list.length ? list[0] : null
          snapshots.push({
            id: chan.id,
            name: chan.name,
            lastMessageAt: latest?.created_at || null,
            lastMessageBy: latest?.user?.nickname || latest?.user?.email || null
          })
        } catch (err) {
          console.error('fetchActivitySnapshot error', chan.id, err?.response?.data || err)
          snapshots.push({ id: chan.id, name: chan.name, lastMessageAt: null, lastMessageBy: null, error: err?.message })
        }
      }
      return snapshots
    }
  }
})
