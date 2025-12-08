import { defineStore } from 'pinia'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null
  }),
  actions: {
    setSocket(socket) {
      this.socket = socket
    }
  }
})
