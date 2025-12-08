import 'regenerator-runtime/runtime'
import { boot } from 'quasar/wrappers'
import mitt from 'mitt'
import Ws from '@adonisjs/websocket-client'

export const wsEvents = mitt()

let ws = null
let channelMap = {}

// INIT WEBSOCKET -------------------------------------------------------
export default boot(() => {
  ws = Ws('ws://127.0.0.1:3333')
  ws.connect()

  ws.on('open', () => {
    console.log('%c[WS] Connected', 'color: lightgreen')
  })

  ws.on('close', () => {
    console.warn('[WS] Disconnected')
  })
})

// JOIN A CHANNEL -------------------------------------------------------
export function joinChannel(channelId) {
  if (!ws) {
    console.warn('[WS] joinChannel called but ws not initialized yet')
    return null
  }

  const topicName = `chat:${channelId}`

  if (channelMap[topicName]) {
    console.log(`✅ [WS] Already subscribed to ${topicName}`)
    return channelMap[topicName]
  }

  console.log(`🔌 [WS] Subscribing to ${topicName}...`)
  const topic = ws.subscribe(topicName)

  topic.on('message', data => {
    console.log(`📨 [WS] Received on ${topicName}:`, data)
    wsEvents.emit('message', data)
  })
  topic.on('typing', data => wsEvents.emit('typing', data))
  topic.on('join', data => wsEvents.emit('join', data))
  topic.on('leave', data => wsEvents.emit('leave', data))

  channelMap[topicName] = topic
  console.log(`✅ [WS] Subscribed to ${topicName}`)
  return topic
}

// SEND EVENT TO CHANNEL ------------------------------------------------
export function wsSend(event, data) {
  if (!data.channel_id) {
    console.error("wsSend: Missing channel_id")
    return
  }

  const topicName = `chat:${data.channel_id}`
  const topic = channelMap[topicName]

  if (!topic) {
    console.warn("wsSend: Topic not joined:", topicName)
    console.warn("Available topics:", Object.keys(channelMap))
    return
  }

  console.log(`🔌 [WS] Sending "${event}" to ${topicName}:`, data)
  topic.emit(event, data)
}
