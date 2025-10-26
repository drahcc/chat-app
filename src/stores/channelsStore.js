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
        banned: [], // Добавяме banned users
        messages: [],
        lastActivity: new Date() // Добавяме за следене на активност
      }
    },
    currentUser: 'Valentin',
    allUsers: ['Valentin', 'Dragomir', 'Marek', 'User1', 'User2'] // Добавяме списък с всички потребители
  }),

  getters: {
    getChannelById: (state) => (id) => state.channels[id],
    getUserChannels: (state) => {
      return Object.values(state.channels).filter(channel => 
        channel.members.includes(state.currentUser)
      )
    }
  },

  actions: {
    createChannel(name, type = 'public') {
      const newId = Date.now() // По-добър начин за генериране на ID
      this.channels[newId] = {
        id: newId,
        name,
        type,
        admin: this.currentUser,
        members: [this.currentUser],
        banned: [],
        messages: [],
        lastActivity: new Date()
      }
      return newId
    },

    joinChannel(name, type = 'public') {
      // Проверка дали канал с такова име вече съществува
      const existing = Object.values(this.channels).find(
        c => c.name.toLowerCase() === name.toLowerCase()
      )
      
      if (!existing) {
        // Създаване на нов канал
        const id = this.createChannel(name, type)
        return { created: true, id }
      } else {
        // Присъединяване към съществуващ канал
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

    inviteUser(channelId, nick) {
      const ch = this.channels[channelId]
      if (!ch) return 'Channel not found'
      
      // Проверка дали потребителят съществува
      if (!this.allUsers.includes(nick)) {
        return `User ${nick} does not exist`
      }
      
      // Проверка за права
      if (ch.type === 'private' && this.currentUser !== ch.admin) {
        return 'Only admin can invite in private channels'
      }
      
      if (ch.banned.includes(nick)) {
        // Admin може да invite-не баннат потребител (unban)
        if (this.currentUser === ch.admin) {
          ch.banned = ch.banned.filter(user => user !== nick)
          ch.members.push(nick)
          return `${nick} has been unbanned and invited to ${ch.name}`
        }
        return `${nick} is banned from this channel`
      }
      
      if (!ch.members.includes(nick)) {
        ch.members.push(nick)
        ch.lastActivity = new Date()
        return `${nick} invited to ${ch.name}`
      }
      return `${nick} is already a member`
    },

    revokeUser(channelId, nick) {
      const ch = this.channels[channelId]
      if (!ch) return 'Channel not found'
      
      if (this.currentUser !== ch.admin) {
        return 'Only admin can revoke users'
      }
      
      const idx = ch.members.indexOf(nick)
      if (idx !== -1) {
        ch.members.splice(idx, 1)
        ch.lastActivity = new Date()
        return `${nick} removed from ${ch.name}`
      }
      return `${nick} not found in channel`
    },

    kickUser(channelId, nick) {
      const ch = this.channels[channelId]
      if (!ch) return 'Channel not found'
      
      // Проверки за права
      if (ch.type === 'private' && this.currentUser !== ch.admin) {
        return 'Only admin can kick in private channels'
      }
      
      if (ch.type === 'public' && this.currentUser !== ch.admin && nick === ch.admin) {
        return 'Cannot kick the admin'
      }
      
      const idx = ch.members.indexOf(nick)
      if (idx !== -1) {
        ch.members.splice(idx, 1)
        
        // Система за банване (3 киквания = бан)
        // Тук трябва да се имплементира брояч за киквания
        // За сега просто банваме
        if (!ch.banned.includes(nick)) {
          ch.banned.push(nick)
        }
        
        ch.lastActivity = new Date()
        return `${nick} kicked and banned from ${ch.name}`
      }
      return `${nick} not found in channel`
    },

    quitChannel(channelId) {
      const ch = this.channels[channelId]
      if (!ch) return 'Channel not found'
      
      if (this.currentUser !== ch.admin) {
        return 'Only admin can delete channel'
      }
      
      delete this.channels[channelId]
      return `${ch.name} deleted`
    },

    leaveChannel(channelId) {
      const ch = this.channels[channelId]
      if (!ch) return 'Channel not found'
      
      const idx = ch.members.indexOf(this.currentUser)
      if (idx !== -1) {
        ch.members.splice(idx, 1)
        ch.lastActivity = new Date()
        
        // Ако admin напусне, изтриваме канала
        if (this.currentUser === ch.admin) {
          delete this.channels[channelId]
          return `Channel ${ch.name} deleted (admin left)`
        }
        
        return `You left ${ch.name}`
      }
      return 'You are not a member of this channel'
    },

    sendMessage(channelId, text) {
      const ch = this.channels[channelId]
      if (!ch) return
      
      ch.messages.push({
        user: this.currentUser,
        from: 'me',
        text,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      })
      ch.lastActivity = new Date()
    },

    // Нов метод за проверка на неактивни канали
    cleanupInactiveChannels() {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      Object.keys(this.channels).forEach(channelId => {
        const channel = this.channels[channelId]
        if (channel.lastActivity < thirtyDaysAgo) {
          delete this.channels[channelId]
        }
      })
    }
  }
})