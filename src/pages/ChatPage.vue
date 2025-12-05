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
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="q-pa-sm q-mb-sm rounded bg-grey-8 text-white"
      >
        <div class="text-bold">{{ msg.user }}</div>
        <div>{{ msg.text }}</div>
        <div class="text-grey-5 text-caption">{{ msg.time }}</div>
      </div>

      <!-- TYPING -->
      <div v-if="typingUsers.length" class="text-grey-5 q-mt-sm">
        {{ typingUsers.join(", ") }} typing...
      </div>
    </div>

    <!-- INPUT -->
    <div class="row q-pa-sm bg-grey-9">
      <q-input
        v-model="newMessage"
        filled
        class="col"
        placeholder="Type message..."
        @keydown="onTyping"
        @keyup.enter="sendMessage"
      />

      <q-btn
        class="q-ml-sm"
        color="primary"
        label="Send"
        @click="sendMessage"
      />
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useChannelsStore } from "src/stores/channelsStore";
import { wsSend, wsEvents } from "src/boot/ws";

const channelsStore = useChannelsStore();

// STATE ---------------------------------------------------------------
const newMessage = ref("");
const typingUsers = ref([]);
const messages = ref([]);
const currentChannelId = ref(null);

// AUTO SELECT FIRST CHANNEL -------------------------------------------
onMounted(() => {
  if (channelsStore.channels.length) {
    currentChannelId.value = channelsStore.channels[0].id;
  }
});

// COMPUTED CURRENT CHANNEL --------------------------------------------
const currentChannel = computed(() =>
  channelsStore.channels.find((c) => c.id === currentChannelId.value)
);

// LOAD messages when channel changes ----------------------------------
watch(currentChannelId, () => {
  messages.value = []; // clear old messages
});

// WEBSOCKET LISTENERS -------------------------------------------------

function onMessage(msg) {
  if (msg.channel_id !== currentChannelId.value) return;
  messages.value.push(msg);
}

function onTypingEvent(data) {
  const { channel_id, user, stop } = data;
  if (channel_id !== currentChannelId.value) return;

  if (stop) {
    typingUsers.value = typingUsers.value.filter((u) => u !== user);
  } else {
    if (!typingUsers.value.includes(user)) typingUsers.value.push(user);
  }
}

// REGISTER LISTENERS
onMounted(() => {
  wsEvents.on("message", onMessage);
  wsEvents.on("typing", onTypingEvent);
});

// REMOVE LISTENERS
onBeforeUnmount(() => {
  wsEvents.off("message", onMessage);
  wsEvents.off("typing", onTypingEvent);
});

// SEND MESSAGE ---------------------------------------------------------
function sendMessage() {
  if (!newMessage.value.trim() || !currentChannel.value) return;

  wsSend("message", {
    channel_id: currentChannelId.value,
    user: channelsStore.currentUser,
    text: newMessage.value.trim(),
    time: new Date().toLocaleTimeString()
  });

  newMessage.value = "";
}

// TYPING INDICATOR ------------------------------------------------------
let typingTimeout = null;

function onTyping() {
  if (!currentChannel.value) return;

  wsSend("typing", {
    channel_id: currentChannelId.value,
    user: channelsStore.currentUser
  });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    wsSend("typing", {
      channel_id: currentChannelId.value,
      user: channelsStore.currentUser,
      stop: true
    });
  }, 700);
}
</script>

<style>
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 10px;
}
</style>
