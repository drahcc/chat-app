import { boot } from 'quasar/wrappers'
import { io } from 'socket.io-client'
import { useSocketStore } from 'src/stores/socket'
import { useAuthStore } from 'src/stores/authStore'
import { wsEvents } from 'src/boot/ws'

export default boot(() => {
  const socketStore = useSocketStore()
  const authStore = useAuthStore()

  const socket = io('http://127.0.0.1:3334', {
    transports: ['websocket'],
    auth: {
      token: authStore.token
    }
  })

  socketStore.setSocket(socket)

  socket.on('connect', () => {
    if (authStore.user?.id) {
      wsEvents.emit('user:status', { userId: authStore.user.id, status: 'online' })
    }
  })

  // Listen to global user:status events
  socket.on('user:status', (data) => {
    console.log('📡 Global user:status received:', data)
    wsEvents.emit('user:status', data)
  })
})
