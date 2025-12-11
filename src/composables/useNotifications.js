import { AppVisibility, Notify } from 'quasar'

export function useNotifications() {
  // Проверка дали приложението е видимо (ползваме AppVisibility ако е налично)
  function isAppVisible() {
    if (AppVisibility && typeof AppVisibility.isActive === 'function') {
      return AppVisibility.isActive
    }
    return !document.hidden
  }
  
  // Показване на нотификация
  function showNotification(title, message, actions = []) {
    if (isAppVisible()) {
      // Ако приложението е видимо, не показваме нотификация
      console.log('📱 App is visible, skipping notification')
      return
    }
    
    // Проверка дали браузърът поддържа нотификации
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications')
      Notify?.create({ type: 'negative', message: 'Browser does not support notifications' })
      return
    }

    const permission = Notification.permission
    if (permission === 'granted') {
      createNotification(title, message, actions)
      return
    }

    if (permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          createNotification(title, message, actions)
        } else {
          Notify?.create({ type: 'warning', message: 'Notifications blocked by user' })
        }
      })
      return
    }

    console.log('🔇 Notification permission denied')
  }
  
  // Създаване на нотификация
  function createNotification(title, message, actions) {
    // Browser Notification actions require ServiceWorker; omit them to avoid errors.
    const notificationOptions = {
      body: message,
      icon: '/icons/icon-128x128.png',
      badge: '/icons/icon-128x128.png',
      tag: 'chatzone-message',
      requireInteraction: false
    }

    // Only add actions if ServiceWorker registration exists and browser supports actions
    const hasServiceWorker = typeof navigator !== 'undefined' && navigator.serviceWorker && navigator.serviceWorker.controller
    const supportsActions = typeof Notification !== 'undefined' && Notification.maxActions && Notification.maxActions > 0
    if (hasServiceWorker && supportsActions && Array.isArray(actions) && actions.length) {
      notificationOptions.actions = actions
    }

    const notification = new Notification(title, notificationOptions)
    
    // Клик върху нотификацията отваря приложението
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    
    // Автоматично затваряне след 5 секунди
    setTimeout(() => {
      notification.close()
    }, 5000)
    
    return notification
  }
  
  // Нотификация за ново съобщение
  function notifyNewMessage(sender, message, channelName) {
    const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message
    showNotification(
      `💬 ${sender} in #${channelName}`,
      truncatedMessage,
      [
        {
          action: 'open',
          title: 'Open Chat'
        }
      ]
    )
  }
  
  // Нотификация за mention
  function notifyMention(sender, message, channelName) {
    const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message
    showNotification(
      `🔔 ${sender} mentioned you in #${channelName}`,
      truncatedMessage,
      [
        {
          action: 'open',
          title: 'View Message'
        }
      ]
    )
  }
  
  // Нотификация за покана в канал
  function notifyChannelInvite(inviter, channelName) {
    showNotification(
      '📨 Channel Invite',
      `${inviter} invited you to join #${channelName}`,
      [
        {
          action: 'join',
          title: 'Join Channel'
        }
      ]
    )
  }
  
  // Тестова нотификация
  function testNotification() {
    showNotification(
      '🧪 ChatZone Test',
      'This is a test notification! Notifications are working correctly.',
      [
        {
          action: 'test',
          title: 'OK'
        }
      ]
    )
  }
  
  return {
    showNotification,
    notifyNewMessage,
    notifyMention,
    notifyChannelInvite,
    testNotification,
    isAppVisible
  }
}