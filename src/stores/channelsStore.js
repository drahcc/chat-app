import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useChannelsStore = defineStore('channels', {
  state: () => ({
    currentUser: "Guest",
    channels: []
  }),

  getters: {
    getUserChannels(state) {
      return state.channels
    },
    getChannelById: (state) => (id) => {
      return state.channels.find(c => c.id === id)
    },
    getAllUserNicknames(state) {
      // placeholder — backend should provide members; returning unique users from channels
      const set = new Set()
      state.channels.forEach(ch => (ch.members || []).forEach(m => set.add(m.username || m)))
      return Array.from(set)
    }
  },

  actions: {
    async loadChannels() {
      try {
        const res = await api.get('/channels')
        // expect array (if Adonis returns collection, res.data should be ok)
        this.channels = res.data || []
        return this.channels
      } catch (err) {
        console.error('loadChannels error', err)
        return []
      }
    },

    async createChannel(name, type = 'public') {
      try {
        const res = await api.post('/channels', { name, type })
        const chan = res.data
        // ensure members array exists
        if (!chan.members) chan.members = []
        this.channels.push(chan)
        return { created: true, channel: chan }
      } catch (err) {
        console.error('createChannel error', err)
        return { created: false, error: err.response?.data || err.message }
      }
    },

    async refreshChannel(id) {
      try {
        const res = await api.get(`/channels/${id}`)
        const idx = this.channels.findIndex(c => c.id === id)
        if (idx === -1) this.channels.push(res.data)
        else this.channels[idx] = res.data
        return res.data
      } catch (err) {
        console.error('refreshChannel', err)
        return null
      }
    },

    removeChannelFromList(id) {
      this.channels = this.channels.filter(c => c.id !== id)
    }
  }
})
