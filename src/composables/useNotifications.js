export function useNotifications() {
  // Проверка дали приложението е видимо
  function isAppVisible() {
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
      return
    }
    
    // Поискане на разрешение ако не е дадено
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          createNotification(title, message, actions)
        }
      })
    } else if (Notification.permission === 'granted') {
      createNotification(title, message, actions)
    } else {
      console.log('🔇 Notification permission denied')
    }
  }
  
  // Създаване на нотификация
  function createNotification(title, message, actions) {
    const notification = new Notification(title, {
      body: message,
      icon: '/icons/icon-128x128.png', // Можете да добавите икона по-късно
      badge: '/icons/icon-128x128.png',
      tag: 'chatzone-message', // Групиране на нотификации
      requireInteraction: false,
      actions: actions
    })
    
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