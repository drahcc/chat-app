<template>
  <q-page class="column fit bg-grey-10">

    <!-- HEADER -->
    <div class="row items-center q-pa-sm bg-grey-9">
      <div class="text-h6 text-white">
        {{ currentChannel ? currentChannel.name : "Select a Channel" }}
      </div>
    </div>

    <!-- MESSAGES -->
    <div class="col scroll q-pa-md">
      <div v-for="(msg, i) in messages" :key="msg.id || i" class="q-pa-sm q-mb-sm rounded bg-grey-8 text-white">
        <div class="text-bold">
          {{ msg.user?.nickname || msg.user?.email || `User #${msg.user_id}` }}
        </div>
        <div>{{ msg.content }}</div>
        <div class="text-grey-5 text-caption">{{ formatTime(msg.created_at) }}</div>
      </div>

      <div v-if="typingUsers.length" class="text-grey-5 q-mt-sm">
        {{ typingUsers.join(', ') }} typing...
      </div>
    </div>

    <!-- INPUT -->
    <div class="row q-pa-sm bg-grey-9">
      <q-input v-model="newMessage" filled class="col" placeholder="Type message..."
        @keydown="onTyping" @keyup.enter="sendMessage" />
      <q-btn class="q-ml-sm" color="primary" label="Send" @click="sendMessage" />
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { useChannelsStore } from "src/stores/channelsStore";
import { useAuthStore } from "src/stores/authStore";
import { joinChannel, wsEvents, wsSend } from "src/boot/ws";
import { api } from "src/boot/axios";

const route = useRoute();
const channelsStore = useChannelsStore();
const authStore = useAuthStore();

const newMessage = ref("");
const typingUsers = ref([]);
const messages = ref([]);
const currentChannelId = ref(null);

const currentChannel = computed(() =>
  channelsStore.channels.find((c) => c.id == currentChannelId.value)
);

const currentUser = computed(() => authStore.user);

onMounted(async () => {
  // Get channel ID from route params
  const paramId = route.params.channelId;
  
  if (paramId) {
    currentChannelId.value = parseInt(paramId);
    
    // Load channel if not in store
    if (!currentChannel.value) {
      await channelsStore.loadChannels();
    }
    
    if (currentChannelId.value) {
      // First join channel, THEN load messages
      await joinChannel(currentChannelId.value);
      await loadMessages(currentChannelId.value);
    }
  } else if (channelsStore.channels.length) {
    currentChannelId.value = channelsStore.channels[0].id;
    await joinChannel(currentChannelId.value);
    await loadMessages(currentChannelId.value);
  }

  // Listen to WebSocket events
  wsEvents.on("message", onMessage);
  wsEvents.on("typing", onTypingEvent);
});

watch(currentChannelId, async (id) => {
  if (id) {
    messages.value = [];
    await joinChannel(id);
    await loadMessages(id);
  }
});

async function loadMessages(channelId) {
  try {
    const res = await api.get(`/channels/${channelId}/messages`);
    console.log('📥 API Response:', res.data);
    
    // Response is paginated: { data: [...], meta: {...} }
    let msgs = res.data?.data || res.data || [];
    
    // Ensure it's an array
    if (!Array.isArray(msgs)) {
      console.error('Messages is not an array:', msgs);
      msgs = [];
    }
    
    // Reverse because API returns DESC order
    messages.value = msgs.reverse();
  } catch (err) {
    const apiError = err?.response?.data?.error || '';
    console.error('Failed to load messages:', apiError || err);

    // Auto-join channel if backend says "not a member"
    if (typeof apiError === 'string' && apiError.toLowerCase().includes('not a member')) {
      try {
        console.warn(`Auto-joining channel ${channelId}...`);
        await api.post(`/channels/${channelId}/join`);
        const retry = await api.get(`/channels/${channelId}/messages`);
        let msgs = retry.data?.data || retry.data || [];
        if (!Array.isArray(msgs)) msgs = [];
        messages.value = msgs.reverse();
        return;
      } catch (joinErr) {
        console.error('Join channel failed:', joinErr?.response?.data || joinErr);
      }
    }

    messages.value = [];
  }
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return ''
  }
}

function onMessage(msg) {
  console.log('📩 Received message:', msg);
  console.log('   Current channel:', currentChannelId.value);
  console.log('   Message channel:', msg.channel_id);
  
  if (msg.channel_id != currentChannelId.value) {
    console.warn('   ⚠️ Message for different channel, ignoring');
    return;
  }
  
  console.log('   ✅ Adding to messages array');
  messages.value.push(msg);
}

function onTypingEvent(data) {
  if (data.channel_id !== currentChannelId.value) return;

  if (data.stop) {
    typingUsers.value = typingUsers.value.filter(
      (u) => u !== data.username
    );
  } else {
    if (!typingUsers.value.includes(data.username)) {
      typingUsers.value.push(data.username);
    }
  }
}

onBeforeUnmount(() => {
  wsEvents.off("message", onMessage);
  wsEvents.off("typing", onTypingEvent);
});

function sendMessage() {
  if (!newMessage.value.trim() || !currentChannelId.value) return;
  if (!currentUser.value || !currentUser.value.id) {
    console.error('No user logged in');
    return;
  }

  console.log('📤 SENDING MESSAGE as user:', {
    id: currentUser.value.id,
    nickname: currentUser.value.nickname,
    email: currentUser.value.email
  });

  wsSend("message", {
    channel_id: currentChannelId.value,
    user_id: currentUser.value.id,
    content: newMessage.value.trim(),
    created_at: new Date().toISOString(),
  });

  newMessage.value = "";
}

let timeout = null;

function onTyping() {
  if (!currentChannelId.value || !currentUser.value) return;

  wsSend("typing", {
    channel_id: currentChannelId.value,
    user_id: currentUser.value.id,
    username: currentUser.value.username || currentUser.value.nickname,
  });

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    wsSend("typing", {
      channel_id: currentChannelId.value,
      user_id: currentUser.value.id,
      username: currentUser.value.username || currentUser.value.nickname,
      stop: true,
    });
  }, 600);
}
</script>


<style>
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
</style>
