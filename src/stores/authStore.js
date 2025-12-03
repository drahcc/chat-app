import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    user: null,
    token: null
  }),

  actions: {
    async loginUser(email, password) {
      try {
        const res = await axios.post('http://127.0.0.1:3333/login', {
          email,
          password
        })

        this.user = res.data.user
        this.token = res.data.token

        // запиши токена в axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

        return { success: true, user: this.user }

      } catch (err) {
        console.error('LOGIN ERROR:', err.response?.data || err)
        return { success: false, error: 'Invalid email or password' }
      }
    },

    async registerUser(username, email, password) {
      try {
        const res = await axios.post('http://127.0.0.1:3333/register', {
          username,
          email,
          password
        })

        return { success: true, user: res.data.user }

      } catch (err) {
        console.error('REGISTER ERROR:', err.response?.data || err)
        return { success: false, error: 'Registration failed' }
      }
    }
  }
})
