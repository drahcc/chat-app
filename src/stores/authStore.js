// src/stores/authStore.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useAuthStore = defineStore('authStore', {
  state: () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    const token = localStorage.getItem('token') || null
    console.log('🔐 AUTH STORE INIT:', { user, token: token ? 'EXISTS' : 'NO TOKEN' })
    return { user, token }
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

        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('token', jwt)
        
        console.log('✅ LOGIN SUCCESS:', { 
          userId: this.user.id, 
          nickname: this.user.nickname,
          email: this.user.email 
        })

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
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }
})
