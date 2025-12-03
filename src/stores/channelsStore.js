import { defineStore } from 'pinia'

export const useChannelsStore = defineStore('channels', {
  state: () => ({
    currentUser: "Guest",
    channels: []
  }),

  getters: {
    getUserChannels(state) {
      return state.channels
    }
  },

  actions: {

    createChannel(name, type = "public") {
      const channel = {
        id: Date.now(),
        name,
        type,
        created_at: new Date(),
        members: []
      }

      this.channels.push(channel)
      return channel
    },

    leaveChannel(id) {
      this.channels = this.channels.filter(ch => ch.id !== id)
    },

    createTestInactiveChannels() {
      this.channels.push(
        { id: Date.now() + 1, name: "old-1", type: "public" },
        { id: Date.now() + 2, name: "old-2", type: "public" },
      )
    },

    manualCleanup() {
      this.channels = []
    }
  }
})
