import { boot } from 'quasar/wrappers'
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:3333' // backend URL
})

export default boot(({ app }) => {
  // при стартиране, ако има токен го добавяме автоматично
  const token = localStorage.getItem('token')
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // attach to app so in components you can use this.$api
  app.config.globalProperties.$api = api
})

export { api }
