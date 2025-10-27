<template>
  <div v-if="typingUsers.length > 0" class="typing-indicator q-px-md q-py-xs">
    <div class="row items-center">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="q-ml-sm text-caption text-grey">
        {{ typingText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useChannelsStore } from 'src/stores/channelsStore'
import { computed } from 'vue'

const props = defineProps({
  channelId: {
    type: [String, Number],
    required: true
  }
})

const store = useChannelsStore()

const typingUsers = computed(() => store.getTypingUsers(props.channelId))

const typingText = computed(() => {
  const users = typingUsers.value
  if (users.length === 0) return ''
  
  if (users.length === 1) {
    return `${users[0]} is typing...`
  } else if (users.length === 2) {
    return `${users[0]} and ${users[1]} are typing...`
  } else {
    return `${users[0]}, ${users[1]} and ${users.length - 2} more are typing...`
  }
})
</script>

<style scoped>
.typing-indicator {
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 4px 16px;
  align-self: flex-start;
  max-width: 80%;
}

.typing-dots {
  display: inline-flex;
  gap: 2px;
}

.typing-dots span {
  height: 6px;
  width: 6px;
  border-radius: 50%;
  background-color: #666;
  animation: typing-dots 1.4s ease-in-out infinite both;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing-dots {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>