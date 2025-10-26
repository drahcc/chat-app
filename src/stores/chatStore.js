import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const chatData = reactive({
    1: { 
      name: 'General', 
      type: 'public', 
      admin: 'Valentin', 
      members: ['Valentin'], 
      messages: [] 
    }
  })

  // 👉 Създаване на нов канал
  function createChannel(name, type = 'public', admin = 'Valentin') {
    const newId = Object.keys(chatData).length + 1
    chatData[newId] = { name, type, admin, members: [admin], messages: [] }
    return newId
  }

  // 👉 Изтриване на канал
  function deleteChannel(name) {
    for (const key in chatData) {
      if (chatData[key].name === name) {
        delete chatData[key]
        break
      }
    }
  }

  return { chatData, createChannel, deleteChannel }
})
