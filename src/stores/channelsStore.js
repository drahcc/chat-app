import { defineStore } from 'pinia'

export const useChannelsStore = defineStore('channels', {
  state: () => ({
    channels: {
      1: {
        id: 1,
        name: 'General',
        type: 'public',
        admin: 'Valentin',
        members: ['Valentin', 'Dragomir', 'Marek'],
        banned: [],
        messages: [],
        lastActivity: new Date(),
        createdAt: new Date('2024-01-01'),
        pagination: {
          page: 1,
          hasMore: true,
          pageSize: 20
        },
        isNewInvite: false
      }
    },
    currentUser: 'Valentin',
    allUsers: [
      { id: 1, nickname: 'Valentin', email: 'valentin@example.com', status: 'online' },
      { id: 2, nickname: 'Dragomir', email: 'dragomir@example.com', status: 'online' },
      { id: 3, nickname: 'Marek', email: 'marek@example.com', status: 'online' },
      { id: 4, nickname: 'User1', email: 'user1@example.com', status: 'online' },
      { id: 5, nickname: 'User2', email: 'user2@example.com', status: 'online' }
    ],
    userStatuses: {
      'Valentin': 'online',
      'Dragomir': 'online',
      'Marek': 'online',
      'User1': 'online',
      'User2': 'online'
    },
    typingUsers: {},
    notificationSettings: {
      enabled: true,
      mentionsOnly: false,
      sound: true
    },
    kickVotes: {},
    userInvites: new Set(),
    deletedChannelNames: new Set()
  }),

  getters: {
    getChannelById: (state) => (id) => state.channels[id],
    getUserChannels: (state) => {
      const channels = Object.values(state.channels).filter(channel =>
        channel.members.includes(state.currentUser)
      )
      
      // Сортираме каналите - новите покани най-отгоре
      return channels.sort((a, b) => {
        const aIsNew = state.userInvites.has(a.id) || a.isNewInvite
        const bIsNew = state.userInvites.has(b.id) || b.isNewInvite
        
        if (aIsNew && !bIsNew) return -1
        if (!aIsNew && bIsNew) return 1
        return 0
      })
    },
    getAllUserNicknames: (state) => state.allUsers.map(u => u.nickname),
    getUserStatus: (state) => (username) => state.userStatuses[username] || 'offline',
    getOnlineUsers: (state) => Object.entries(state.userStatuses)
      .filter(([, s]) => s === 'online')
      .map(([u]) => u),
    getTypingUsers: (state) => (channelId) => state.typingUsers[channelId] || [],
    getNotificationSettings: (state) => state.notificationSettings,
    getBannedUsers: (state) => (channelId) => state.channels[channelId]?.banned || [],
    isUserAdmin: (state) => (channelId) => {
      const channel = state.channels[channelId]
      return channel ? channel.admin === state.currentUser : false
    },
    isUserBanned: (state) => (channelId, username) => {
      const channel = state.channels[channelId]
      return channel ? channel.banned.includes(username) : false
    },
    isChannelInactive: (state) => (channelId) => {
      const channel = state.channels[channelId]
      if (!channel) return false
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return channel.lastActivity < thirtyDaysAgo
    },
    hasInfiniteScroll: (state) => (channelId) => {
      const channel = state.channels[channelId]
      return channel ? channel.name === 'General' : false
    },
    isChannelNewInvite: (state) => (channelId) => {
      return state.userInvites.has(channelId)
    },
    // 🆕 Връща списък с канали за автоматично изтриване
    getChannelsForDeletion: (state) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return Object.values(state.channels).filter(channel => 
        channel.lastActivity < thirtyDaysAgo && channel.name !== 'General'
      )
    },
    // 🆕 Проверка дали име на канал е свободно (включително изтрити)
    isChannelNameAvailable: (state) => (name) => {
      // Проверка за съществуващи канали
      const existing = Object.values(state.channels).find(
        channel => channel.name.toLowerCase() === name.toLowerCase()
      )
      if (existing) return false
      
      // Проверка за скоро изтрити имена (lock период 7 дни)
      if (state.deletedChannelNames.has(name.toLowerCase())) {
        return false
      }
      
      return true
    },
    // 🆕 Getter за общ брой канали (за статистика)
    getTotalChannelsCount: (state) => {
      return Object.keys(state.channels).length
    },
    // 🆕 Getter за проверка дали канал съществува
    doesChannelExist: (state) => (channelId) => {
      return !!state.channels[channelId]
    }
  },

  actions: {
    // ✅ CHANNEL MANAGEMENT
    createChannel(name, type = 'public') {
      // 🆕 Проверка дали името е достъпно (включително за изтрити канали)
      if (!this.isChannelNameAvailable(name)) {
        return { success: false, error: 'Channel name already exists or was recently deleted' }
      }

      const newId = Date.now()
      this.channels[newId] = {
        id: newId,
        name,
        type,
        admin: this.currentUser,
        members: [this.currentUser],
        banned: [],
        messages: [],
        lastActivity: new Date(),
        createdAt: new Date(),
        pagination: {
          page: 1,
          hasMore: false,
          pageSize: 20
        },
        isNewInvite: false
      }
      return { success: true, channelId: newId }
    },

    deleteChannel(channelId) {
      const channel = this.channels[channelId]
      if (!channel) {
        return { success: false, error: 'Channel not found' }
      }

      if (channel.admin !== this.currentUser) {
        return { success: false, error: 'Only admin can delete the channel' }
      }

      delete this.channels[channelId]
      return { success: true }
    },

    joinChannel(name, type = 'public') {
      const existing = Object.values(this.channels).find(
        c => c.name.toLowerCase() === name.toLowerCase()
      )
      if (!existing) {
        const result = this.createChannel(name, type)
        return { created: true, id: result.channelId }
      } else {
        if (existing.banned.includes(this.currentUser)) {
          return { created: false, error: 'You are banned from this channel' }
        }
        if (!existing.members.includes(this.currentUser)) {
          existing.members.push(this.currentUser)
          existing.lastActivity = new Date()
        }
        return { created: false, id: existing.id }
      }
    },

    // 🆕 Маркиране на канал като нова покана
    markChannelAsNewInvite(channelId) {
      this.userInvites.add(channelId)
      
      // Автоматично премахване след 24 часа
      setTimeout(() => {
        this.userInvites.delete(channelId)
      }, 24 * 60 * 60 * 1000)
    },

    // 🆕 Премахване на маркировката за нова покана
    dismissNewInvite(channelId) {
      this.userInvites.delete(channelId)
      if (this.channels[channelId]) {
        this.channels[channelId].isNewInvite = false
      }
    },

    inviteUser(channelId, nick) {
      const ch = this.channels[channelId]
      if (!ch) return { success: false, message: 'Channel not found' }
      if (!this.getAllUserNicknames.includes(nick)) return { success: false, message: `User ${nick} does not exist` }
      if (ch.type === 'private' && this.currentUser !== ch.admin) return { success: false, message: 'Only admin can invite in private channels' }
      if (ch.banned.includes(nick)) {
        if (this.currentUser === ch.admin) {
          ch.banned = ch.banned.filter(u => u !== nick)
          ch.members.push(nick)
          // 🆕 Маркираме като нова покана за поканения потребител
          if (nick !== this.currentUser) {
            this.markChannelAsNewInvite(channelId)
          }
          return { success: true, message: `${nick} has been unbanned and invited to ${ch.name}` }
        }
        return { success: false, message: `${nick} is banned from this channel` }
      }
      if (!ch.members.includes(nick)) {
        ch.members.push(nick)
        ch.lastActivity = new Date()
        // 🆕 Маркираме като нова покана за поканения потребител
        if (nick !== this.currentUser) {
          this.markChannelAsNewInvite(channelId)
        }
        return { success: true, message: `${nick} invited to ${ch.name}` }
      }
      return { success: false, message: `${nick} is already a member` }
    },

    revokeUser(channelId, nick) {
      const ch = this.channels[channelId]
      if (!ch) return { success: false, message: 'Channel not found' }
      if (this.currentUser !== ch.admin) return { success: false, message: 'Only admin can revoke users' }
      const idx = ch.members.indexOf(nick)
      if (idx !== -1) {
        ch.members.splice(idx, 1)
        ch.lastActivity = new Date()
        return { success: true, message: `${nick} removed from ${ch.name}` }
      }
      return { success: false, message: `${nick} not found` }
    },

    kickUser(channelId, nick) {
      const ch = this.channels[channelId]
      if (!ch) return { success: false, message: 'Channel not found', votesRemaining: 0 }
      
      if (ch.type === 'private' && this.currentUser !== ch.admin) {
        return { success: false, message: 'Only admin can kick in private channels', votesRemaining: 0 }
      }
      
      if (ch.type === 'public' && this.currentUser !== ch.admin && nick === ch.admin) {
        return { success: false, message: 'Cannot kick the admin', votesRemaining: 0 }
      }

      // Система за гласуване в публични канали
      if (ch.type === 'public' && this.currentUser !== ch.admin) {
        const voteKey = `${channelId}-${nick}`
        if (!this.kickVotes[voteKey]) {
          this.kickVotes[voteKey] = new Set()
        }
        
        this.kickVotes[voteKey].add(this.currentUser)
        const voteCount = this.kickVotes[voteKey].size
        
        if (voteCount >= 3) {
          // 3 гласа = бан
          const idx = ch.members.indexOf(nick)
          if (idx !== -1) {
            ch.members.splice(idx, 1)
            if (!ch.banned.includes(nick)) ch.banned.push(nick)
            ch.lastActivity = new Date()
            delete this.kickVotes[voteKey]
            return { 
              success: true, 
              message: `${nick} has been banned by community vote`, 
              votesRemaining: 0 
            }
          }
        } else {
          const votesRemaining = 3 - voteCount
          return { 
            success: false, 
            message: `Vote recorded. ${votesRemaining} more votes needed to ban ${nick}`,
            votesRemaining 
          }
        }
      }

      // Администраторски kick (веднага бан)
      const idx = ch.members.indexOf(nick)
      if (idx !== -1) {
        ch.members.splice(idx, 1)
        if (!ch.banned.includes(nick)) ch.banned.push(nick)
        ch.lastActivity = new Date()
        return { 
          success: true, 
          message: `${nick} kicked and banned from ${ch.name}`,
          votesRemaining: 0 
        }
      }
      return { success: false, message: `${nick} not found`, votesRemaining: 0 }
    },

    quitChannel(channelId) {
      const ch = this.channels[channelId]
      if (!ch) return { success: false, message: 'Channel not found' }
      if (this.currentUser !== ch.admin) return { success: false, message: 'Only admin can delete channel' }
      delete this.channels[channelId]
      return { success: true, message: `${ch.name} deleted` }
    },

    leaveChannel(channelId) {
      const ch = this.channels[channelId]
      if (!ch) return { success: false, message: 'Channel not found' }
      const idx = ch.members.indexOf(this.currentUser)
      if (idx !== -1) {
        ch.members.splice(idx, 1)
        ch.lastActivity = new Date()
        if (this.currentUser === ch.admin) {
          delete this.channels[channelId]
          return { success: true, message: `Channel ${ch.name} deleted (admin left)` }
        }
        return { success: true, message: `You left ${ch.name}` }
      }
      return { success: false, message: 'You are not a member' }
    },

    // 🆕 АВТОМАТИЧНО ИЗТРИВАНЕ НА КАНАЛИ
    cleanupInactiveChannels() {
      const channelsToDelete = this.getChannelsForDeletion
      const deletionResults = []
      
      channelsToDelete.forEach(channel => {
        // 🆕 Запазваме името в списък с изтрити имена (lock за 7 дни)
        this.deletedChannelNames.add(channel.name.toLowerCase())
        
        // Автоматично премахване след 7 дни
        setTimeout(() => {
          this.deletedChannelNames.delete(channel.name.toLowerCase())
          console.log(`🔓 Channel name "${channel.name}" is now available again`)
        }, 7 * 24 * 60 * 60 * 1000)
        
        // Изтриваме канала
        delete this.channels[channel.id]
        deletionResults.push({
          channelName: channel.name,
          lastActivity: channel.lastActivity,
          deletedAt: new Date()
        })
        
        console.log(`🗑️ Auto-deleted inactive channel: ${channel.name} (last activity: ${channel.lastActivity})`)
      })
      
      return deletionResults
    },

    // 🆕 РЪЧНО ТРИГЪРВАНЕ НА ПОЧИСТВАНЕ (за тестване)
    manualCleanup() {
      console.log('🧹 Starting manual channel cleanup...')
      const results = this.cleanupInactiveChannels()
      
      if (results.length === 0) {
        console.log('✅ No inactive channels found for deletion')
        return { success: true, message: 'No inactive channels found', deleted: [] }
      }
      
      console.log(`✅ Deleted ${results.length} inactive channels`)
      return { 
        success: true, 
        message: `Deleted ${results.length} inactive channels`,
        deleted: results
      }
    },

    // 🆕 СИМУЛИРАНЕ НА СТАРИ КАНАЛИ ЗА ТЕСТВАНЕ
    createTestInactiveChannels() {
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
      const testChannels = [
        { name: 'old-project', type: 'public' },
        { name: 'archived-chat', type: 'private' },
        { name: 'summer-vacation', type: 'public' }
      ]
      
      const createdNames = []
      testChannels.forEach(channelData => {
        const newId = Date.now() + Math.random()
        this.channels[newId] = {
          id: newId,
          name: channelData.name,
          type: channelData.type,
          admin: this.currentUser,
          members: [this.currentUser],
          banned: [],
          messages: [{
            user: this.currentUser,
            from: 'me',
            text: 'This is an old message from 31 days ago',
            time: thirtyOneDaysAgo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }],
          lastActivity: thirtyOneDaysAgo,
          createdAt: thirtyOneDaysAgo,
          pagination: { page: 1, hasMore: false, pageSize: 20 },
          isNewInvite: false
        }
        createdNames.push(channelData.name)
      })
      
      console.log('🧪 Created test inactive channels for cleanup demonstration')
      return createdNames
    },

    // 🆕 КОМАНДА ЗА ПРОВЕРКА НА АКТИВНОСТ
    checkChannelActivity(channelId) {
      const channel = this.channels[channelId]
      if (!channel) {
        return { success: false, message: 'Channel not found' }
      }
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const isInactive = channel.lastActivity < thirtyDaysAgo
      const daysInactive = Math.floor((Date.now() - channel.lastActivity) / (24 * 60 * 60 * 1000))
      
      return {
        success: true,
        channelName: channel.name,
        lastActivity: channel.lastActivity,
        isInactive,
        daysInactive,
        willBeDeleted: isInactive && channel.name !== 'General',
        message: isInactive ? 
          `Channel is inactive for ${daysInactive} days. ${channel.name !== 'General' ? 'Will be auto-deleted soon.' : 'General channel is protected from deletion.'}` :
          `Channel is active (last activity: ${daysInactive} days ago)`
      }
    },

    // ✅ MESSAGES
    sendMessage(channelId, text) {
      const ch = this.channels[channelId]
      if (!ch) return
      
      const messageData = {
        user: this.currentUser,
        from: 'me',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      ch.messages.push(messageData)
      ch.lastActivity = new Date()
      this.notifyNewMessage(channelId, messageData)
    },

    // ✅ PAGINATION / INFINITE SCROLL - САМО ЗА GENERAL
    loadMoreMessages(channelId) {
      const channel = this.channels[channelId]
      
      if (!channel || channel.name !== 'General' || !channel.pagination.hasMore) {
        return []
      }

      console.log(`📜 Loading more messages for General channel, page ${channel.pagination.page}`)
      const newMessages = this.generateMockMessages(channel.pagination.page)
      channel.messages.unshift(...newMessages)
      channel.pagination.page++
      
      if (channel.pagination.page > 5) {
        channel.pagination.hasMore = false
      }
      
      return newMessages
    },

    generateMockMessages(page) {
      const mockMessages = []
      const users = ['Valentin', 'Dragomir', 'Marek', 'User1', 'User2']
      const templates = [
        'Hello everyone!', 'How are you doing?', 'This is an older message',
        'Just testing infinite scroll', 'History loading correctly',
        'Great feature!', 'Working on the project', 'Meeting tomorrow at 10 AM',
        'Did you see the update?', 'Thanks for the help!'
      ]
      for (let i = 0; i < 10; i++) {
        const user = users[Math.floor(Math.random() * users.length)]
        const text = templates[Math.floor(Math.random() * templates.length)]
        mockMessages.push({
          user,
          from: user === this.currentUser ? 'me' : 'them',
          text: `[Historical - Page ${page}] ${text}`,
          time: new Date(Date.now() - (page * 86400000) - (i * 60000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      }
      return mockMessages
    },

    resetPagination(channelId) {
      const channel = this.channels[channelId]
      if (channel) {
        if (channel.name === 'General') {
          channel.pagination = { page: 1, hasMore: true, pageSize: 20 }
        } else {
          channel.pagination = { page: 1, hasMore: false, pageSize: 20 }
        }
      }
    },

    // ✅ USER STATUS
    setUserStatus(status) {
      this.userStatuses[this.currentUser] = status
      const user = this.allUsers.find(u => u.nickname === this.currentUser)
      if (user) user.status = status
    },

    updateUserStatus(username, status) {
      if (this.userStatuses[username]) {
        this.userStatuses[username] = status
        const user = this.allUsers.find(u => u.nickname === username)
        if (user) user.status = status
      }
    },

    getUserStatusInfo(username) {
      const status = this.userStatuses[username] || 'offline'
      const icons = {
        online: { icon: 'circle', color: 'green' },
        dnd: { icon: 'do_not_disturb', color: 'orange' },
        offline: { icon: 'offline_bolt', color: 'grey' }
      }
      return icons[status] || icons.offline
    },

    // ✅ TYPING
    startTyping(channelId) {
      if (!this.typingUsers[channelId]) this.typingUsers[channelId] = []
      if (!this.typingUsers[channelId].includes(this.currentUser)) {
        this.typingUsers[channelId].push(this.currentUser)
      }
    },

    stopTyping(channelId) {
      if (this.typingUsers[channelId]) {
        this.typingUsers[channelId] = this.typingUsers[channelId].filter(
          u => u !== this.currentUser
        )
      }
    },

    // ✅ NOTIFICATIONS
    setNotificationSettings(settings) {
      this.notificationSettings = { ...this.notificationSettings, ...settings }
    },

    notifyNewMessage(channelId, messageData) {
      const channel = this.channels[channelId]
      if (!channel) return
      if (messageData.user === this.currentUser) return
      if (!this.notificationSettings.enabled) return

      const isMention = messageData.text.includes(`@${this.currentUser}`)
      if (this.notificationSettings.mentionsOnly && !isMention) return

      console.log('📢 NOTIFICATION:', {
        type: isMention ? 'mention' : 'message',
        channel: channel.name,
        sender: messageData.user,
        message: messageData.text
      })

      this.triggerBrowserNotification(channel.name, messageData.user, messageData.text, isMention)
    },

    triggerBrowserNotification(channelName, sender, message, isMention) {
      if (!('Notification' in window)) return
      if (!document.hidden) return

      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.createBrowserNotification(channelName, sender, message, isMention)
          }
        })
      } else if (Notification.permission === 'granted') {
        this.createBrowserNotification(channelName, sender, message, isMention)
      }
    },

    createBrowserNotification(channelName, sender, message, isMention) {
      const text = message.length > 100 ? message.substring(0, 100) + '...' : message
      const title = isMention ? `🔔 ${sender} mentioned you` : `💬 ${sender} in #${channelName}`
      const notification = new Notification(title, {
        body: text,
        icon: '/favicon.ico',
        tag: 'chatzone'
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      setTimeout(() => notification.close(), 5000)
    },

    testNotification() {
      this.triggerBrowserNotification('General', 'Test User', 'Testing notifications!', false)
    },

    // 🆕 АВТОМАТИЧНО ПОЧИСТВАНЕ ПРИ СТАРТИРАНЕ НА ПРИЛОЖЕНИЕТО
    initializeAutoCleanup() {
      // Почистване при зареждане на приложението
      this.cleanupInactiveChannels()
      
      // Почистване на всеки 24 часа
      setInterval(() => {
        const results = this.cleanupInactiveChannels()
        if (results.length > 0) {
          console.log(`🕒 Scheduled cleanup: Deleted ${results.length} inactive channels`)
        }
      }, 24 * 60 * 60 * 1000)
      
      console.log('✅ Auto-cleanup system initialized')
    }
  }
})