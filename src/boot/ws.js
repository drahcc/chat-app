// src/boot/ws.js
import { boot } from 'quasar/wrappers'
import mitt from 'mitt'

export const wsEvents = mitt()

let ws = null
let connected = false

export default boot(async () => {
  ws = new WebSocket('ws://127.0.0.1:3333/adonis-ws')

  ws.onopen = () => {
    connected = true
    console.log('%c[WS] Connected', 'color: lightgreen')
  }

  ws.onclose = () => {
    connected = false
    console.warn('[WS] Disconnected')
  }

  ws.onerror = (err) => {
    console.error('[WS] Error:', err)
  }

  ws.onmessage = (event) => {
    let packet
    try {
      packet = JSON.parse(event.data)
    } catch {
      return
    }

    // Adonis protocol → t(ype), d(ata)
    if (packet.t === 7 && packet.d?.event) {
      wsEvents.emit(packet.d.event, packet.d.data)
      return
    }

    // fallback simple event
    if (packet.event) {
      wsEvents.emit(packet.event, packet.data)
    }
  }
})


// SEND TO ADONIS CHANNEL -----------------------------------------------
export function wsSend(event, data = {}) {
  if (!connected) {
    console.warn('WS not ready')
    return
  }

  if (!data.channel_id) {
    console.error("wsSend requires data.channel_id")
    return
  }

  const topic = `chat:${data.channel_id}`

  const packet = {
    t: 7,
    d: {
      topic,
      event,
      data
    }
  }

  ws.send(JSON.stringify(packet))
}
