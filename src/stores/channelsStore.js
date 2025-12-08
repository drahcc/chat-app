// src/stores/channelsStore.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { joinChannel } from 'src/boot/ws'
import { useAuthStore } from './authStore'

export const useChannelsStore = defineStore('channels', {
  state: () => ({
    currentUser: null,
    channels: [],
    activeChannelId: null
  }),

  getters: {
    getUserChannels(state) {
      return state.channels
    },
    getChannelById: (state) => (id) => state.channels.find(c => c.id === id)
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
    }
  }
})
