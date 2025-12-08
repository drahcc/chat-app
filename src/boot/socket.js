import { boot } from 'quasar/wrappers'
import { io } from 'socket.io-client'
import { useSocketStore } from 'src/stores/socket'
import { useAuthStore } from 'src/stores/authStore'

export default boot(() => {
  const socketStore = useSocketStore()
  const authStore = useAuthStore()

  const socket = io('http://localhost:3334', {
    transports: ['websocket'],
    auth: {
      token: authStore.token
    }
  })

  socketStore.setSocket(socket)
})
