import 'regenerator-runtime/runtime'
import { boot } from 'quasar/wrappers'
import mitt from 'mitt'
import io from 'socket.io-client'
import { useAuthStore } from 'src/stores/authStore'

export const wsEvents = mitt()

let socket = null
let channelMap = {}

// INIT WEBSOCKET -------------------------------------------------------
export default boot(() => {
  const authStore = useAuthStore()

  const buildSocket = () => io('http://127.0.0.1:3334', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    auth: {
      token: authStore.token || null
    },
    autoConnect: !!authStore.token
  })

  socket = buildSocket()

  socket.on('connect', () => {
    console.log('%c[WS] Connected to Socket.IO', 'color: lightgreen')
    // Ensure we mark ourselves online immediately
    if (authStore.token) {
      socket.emit('status:change', { status: 'online' })
    }
  })

  socket.on('disconnect', () => {
    console.warn('[WS] Disconnected from Socket.IO')
  })

  socket.on('error', (error) => {
    console.error('[WS] Socket error:', error)
  })

  socket.on('connect_error', (err) => {
    console.error('[WS] Connect error:', err.message)
  })

  // Reconnect with fresh token when authStore.token changes
  authStore.$subscribe((_, state) => {
    if (!socket) return
    socket.auth = { token: state.token || null }
    if (!socket.connected && state.token) {
      socket.connect()
    }
  })

  // Listen to ALL events and route them appropriately
  socket.onAny((eventName, data) => {
    // Handle chat:N:message
    if (eventName.match(/^chat:\d+:message$/)) {
      console.log(`📨 [WS] Message received:`, data)
      wsEvents.emit('message', data)
    }
    // Handle chat:N:typing
    else if (eventName.match(/^chat:\d+:typing$/)) {
      console.log(`⌨️  [WS] Typing received:`, data)
      wsEvents.emit('typing', data)
    }
    // Handle chat:N:join
    else if (eventName.match(/^chat:\d+:join$/)) {
      console.log(`👥 [WS] User joined:`, data)
      wsEvents.emit('join', data)
    }
    // Handle chat:N:leave
    else if (eventName.match(/^chat:\d+:leave$/)) {
      console.log(`👋 [WS] User left:`, data)
      wsEvents.emit('leave', data)
    }
  })
})

// JOIN A CHANNEL -------------------------------------------------------
export function joinChannel(channelId) {
  if (!socket) {
    console.warn('[WS] joinChannel called but socket not initialized yet')
    return null
  }

  const topicName = `chat:${channelId}`

  if (channelMap[topicName]) {
    console.log(`✅ [WS] Already registered for ${topicName}`)
    return true
  }

  console.log(`🔌 [WS] Registered for ${topicName}`)
  channelMap[topicName] = true
  return true
}

// SEND EVENT TO CHANNEL ------------------------------------------------
export function wsSend(event, data) {
  if (!data.channel_id) {
    console.error("wsSend: Missing channel_id")
    return
  }

  const topicName = `chat:${data.channel_id}`

  if (!channelMap[topicName]) {
    console.warn("wsSend: Not registered for channel:", topicName)
    return
  }

  console.log(`🔌 [WS] Emitting "${topicName}:${event}":`, data)
  socket.emit(`${topicName}:${event}`, data)
}
