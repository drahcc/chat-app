// src/stores/authStore.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useChannelsStore } from './channelsStore'

export const useAuthStore = defineStore('authStore', {
  state: () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const token = localStorage.getItem('token') || null
    const notificationPreference = localStorage.getItem('notification_preference') || user?.notification_preference || 'all'
    console.log('🔐 AUTH STORE INIT:', { user, token: token ? 'EXISTS' : 'NO TOKEN' })
    return { user, token, notificationPreference }
  },

  actions: {
    async loginUser(email, password) {
      try {
        const res = await api.post('/login', { email, password })

        // Поддържа и двата Adonis формата:
        // 1) token.token
        // 2) token
        const jwt =
          res.data?.token?.token ||   // ако е обект
          res.data?.token ||          // ако е директен string
          null

        if (!jwt) {
          console.error("TOKEN FORMAT IS INVALID:", res.data)
          return { success: false, error: "Invalid token format from server" }
        }

        this.user = res.data.user
        this.token = jwt
        this.notificationPreference = res.data.user?.notification_preference || 'all'

        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('token', jwt)
        localStorage.setItem('notification_preference', this.notificationPreference)
        
        console.log('✅ LOGIN SUCCESS:', { 
          userId: this.user.id, 
          nickname: this.user.nickname,
          email: this.user.email 
        })

        // Set user status to online on login
        try {
          await api.post('/users/status', { status: 'online' })
        } catch (statusErr) {
          console.warn('Failed to set online status:', statusErr)
        }

        // Load all user statuses immediately after login
        const channelsStore = useChannelsStore()
        try {
          await channelsStore.loadAllUserStatuses()
        } catch (statusErr) {
          console.warn('Failed to load user statuses:', statusErr)
        }

        return {
          success: true,
          user: this.user,
          token: this.token
        }

      } catch (err) {
        console.error('LOGIN ERROR:', err.response?.data || err)
        return { success: false, error: err.response?.data?.message || 'Invalid email or password' }
      }
    },

    async registerUser(username, email, password) {
      try {
        const res = await api.post('/register', { username, email, password })
        return { success: true, user: res.data.user }
      } catch (err) {
        console.error('REGISTER ERROR:', err.response?.data || err)
        return { success: false, error: err.response?.data?.message || 'Registration failed' }
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.notificationPreference = 'all'
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('notification_preference')
    },

    async loadNotificationPreference() {
      try {
        const res = await api.get('/users/notification-preference')
        const pref = res.data?.notification_preference || 'all'
        this.notificationPreference = pref
        localStorage.setItem('notification_preference', pref)
        // also sync into user object if present
        if (this.user) {
          this.user.notification_preference = pref
          localStorage.setItem('user', JSON.stringify(this.user))
        }
        return pref
      } catch (err) {
        console.error('Failed to load notification preference:', err)
        return this.notificationPreference || 'all'
      }
    },

    async setNotificationPreference(preference) {
      try {
        await api.post('/users/notification-preference', { preference })
        this.notificationPreference = preference
        localStorage.setItem('notification_preference', preference)
        if (this.user) {
          this.user.notification_preference = preference
          localStorage.setItem('user', JSON.stringify(this.user))
        }
        return true
      } catch (err) {
        console.error('Failed to save notification preference:', err)
        return false
      }
    }
  }
})
