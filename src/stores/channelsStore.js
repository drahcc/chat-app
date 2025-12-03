import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useChannelsStore = defineStore('channels', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  actions: {
    async loginUser(email, password) {
      console.log('🔐 Attempting login...')

      try {
        const res = await api.post('/login', {
          email,
          password
        })

        console.log("FULL LOGIN RESPONSE:", JSON.stringify(res.data, null, 2))

        // 👇 Правилно взимане на токена
       const token =
  typeof res.data.token === 'object'
    ? res.data.token.token   // взимаме вътрешното token поле
    : res.data.token
        const user = res.data.user

        console.log("👉 Extracted token:", token)
        console.log("👉 Extracted user:", user)

        // 🧠 Записване локално
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        this.token = token
        this.user = user

        return { success: true, user }

      } catch (err) {
        console.error('❌ Login error:', err)
        return { success: false, error: err.response?.data?.message || 'Network error' }
      }
    }
  }
})
