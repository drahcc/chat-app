import { boot } from 'quasar/wrappers'
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:3333'
})

// ДИНАМИЧНО четене на токена при всяка заявка
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')   // <- Взима се всеки път

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default boot(({ app }) => {
  app.config.globalProperties.$api = api
})

export { api }
