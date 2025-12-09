import { ref } from 'vue'

export function useDesktopNotifications() {
  const permission = ref(Notification.permission)
  const isSupported = 'Notification' in window

  async function requestPermission() {
    if (!isSupported) {
      console.warn('Desktop notifications not supported')
      return false
    }

    if (permission.value === 'granted') {
      return true
    }

    const result = await Notification.requestPermission()
    permission.value = result
    return result === 'granted'
  }

  function showNotification(title, options = {}) {
    if (!isSupported || permission.value !== 'granted') {
      return null
    }

    const notification = new Notification(title, {
      icon: '/icons/favicon-128x128.png',
      badge: '/icons/favicon-128x128.png',
      ...options
    })

    return notification
  }

  function showMessageNotification(message, channelName) {
    const username = message.user?.username || 'Someone'
    const body = message.content || ''
    
    const notification = showNotification(`${username} in #${channelName}`, {
      body: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
      tag: `message-${message.id}`,
      requireInteraction: false,
      silent: false
    })

    if (notification) {
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    }

    return notification
  }

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showMessageNotification
  }
}
