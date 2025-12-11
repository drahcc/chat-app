<template>
  <q-page class="column fit bg-grey-10">

    <!-- HEADER -->
    <div class="row items-center justify-between q-pa-sm bg-grey-9">
      <div class="row items-center q-gutter-sm header-actions">
        <div class="text-h6 text-white">
          {{ currentChannel ? currentChannel.name : "Select a Channel" }}
        </div>
      </div>
      
      <!-- SETTINGS MENU -->
      <div class="row items-center q-gutter-sm">
        <q-btn flat round icon="settings" color="white" @click.stop="settingsMenuOpen = !settingsMenuOpen" />
        <q-menu
          v-model="settingsMenuOpen"
          anchor="bottom right"
          self="top right"
          :offset="[0, 6]"
          content-class="header-menu"
          transition-show="jump-down"
          transition-hide="jump-up"
        >
          <q-list style="min-width: 200px">
            <q-item clickable v-close-popup @click="showSearch = true">
              <q-item-section>Search messages</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup @click="notificationSettingsOpen = true">
              <q-item-section>Notification Settings</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-close-popup>
              <q-item-section>
                Logged in as: {{ currentUser?.nickname || currentUser?.username || currentUser?.email || 'Guest' }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>
    </div>

    <!-- NOTIFICATION SETTINGS DIALOG -->
    <q-dialog v-model="notificationSettingsOpen">
      <q-card style="min-width: 300px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Notification Settings</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-option-group
            v-model="notificationPreference"
            :options="[
              { label: 'All messages', value: 'all' },
              { label: 'Mentions only', value: 'mentions_only' }
            ]"
            color="primary"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveNotificationPreference" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- TYPING PREVIEW DIALOG -->
    <q-dialog v-model="typingPreviewOpen">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ typingPreviewUser }} is typing...</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="text-body1 q-pa-md" style="background-color: #f5f5f5; border-radius: 8px; min-height: 60px;">
            <span v-if="typingPreviewMessage">{{ typingPreviewMessage }}</span>
            <span v-else class="text-grey-6 text-italic">Waiting for text...</span>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- MESSAGES (scrollable) -->
    <div ref="messagesContainer" class="col overflow-auto q-pa-md" style="scroll-behavior: smooth;" @scroll="onScroll">
      <div v-if="isLoadingOlder" class="text-grey-5 text-center q-mb-sm">
        <q-spinner size="20px" color="primary" class="q-mr-sm" /> Loading older...
      </div>
      
      <!-- Pinned Messages Bar -->
      <PinnedMessages v-if="currentChannelId" :channel-id="currentChannelId" @jump-to-message="jumpToMessage" />

      <div v-if="showSearch" class="bg-grey-9 q-pa-sm">
        <MessageSearch 
          v-if="currentChannelId"
          :channel-id="currentChannelId"
          @close="showSearch = false"
          @jump-to-message="jumpToMessage"
        />
      </div>

      <!-- Messages with New Component -->
      <MessageItem 
        v-for="(msg, i) in messages" 
        :key="msg.id || i" 
        :message="msg"
        :channel-id="currentChannelId"
        :is-admin="isChannelAdmin"
      />

      <div v-if="typingUsers.length" class="text-grey-5 q-mt-sm">
        <span v-for="(user, index) in typingUsers" :key="user">
          <span 
            class="typing-username" 
            @click="showTypingPreview(user)"
            style="cursor: pointer; text-decoration: underline; color: #64b5f6;"
          >
            {{ user }}
          </span>
          <span v-if="index < typingUsers.length - 1">, </span>
        </span>
        <span> typing...</span>
      </div>
      
      <div ref="messagesEnd" style="height: 1px;"></div>
    </div>

    <!-- INPUT (fixed at bottom) -->
    <div class="row q-pa-sm bg-grey-9 items-center" style="flex-shrink: 0; position: sticky; bottom: 0;">
      <!-- File Attach Button -->
      <q-btn
        flat
        round
        dense
        icon="attach_file"
        color="grey-6"
        @click="$refs.fileInput.click()"
        title="Attach file"
      />
      <input 
        ref="fileInput" 
        type="file" 
        multiple 
        accept="image/*,application/pdf,.doc,.docx" 
        style="display: none" 
        @change="handleFileSelect"
      />
      
      <!-- Emoji Picker Button -->
      <q-btn
        flat
        round
        dense
        icon="emoji_emotions"
        color="grey-6"
        title="Add emoji"
      >
        <q-popup-proxy cover transition-show="jump-down" transition-hide="jump-up">
          <div class="q-pa-md" style="width: 300px">
            <div class="text-h6 q-mb-md">Add Emoji</div>
            <div class="row q-gutter-sm flex-wrap">
              <q-btn
                v-for="emoji in commonEmojis"
                :key="emoji"
                flat
                round
                :label="emoji"
                v-close-popup
                @click="insertEmoji(emoji)"
                style="font-size: 1.5em; min-width: 50px"
              />
            </div>
          </div>
        </q-popup-proxy>
      </q-btn>
      
      <q-input 
        v-model="newMessage" 
        filled 
        class="col q-ml-sm" 
        placeholder="Type message..."
        @keydown="onTyping" 
        @keyup.enter="sendMessage" 
      />
      <q-btn class="q-ml-sm" color="primary" label="Send" @click="sendMessage" />
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useChannelsStore } from "src/stores/channelsStore";
import { useAuthStore } from "src/stores/authStore";
import { useChatStore } from "src/stores/chatStore";
import { joinChannel, wsEvents, wsSend, wsEmit } from "src/boot/ws";
import { api } from "src/boot/axios";
import MessageItem from "src/components/MessageItem.vue";
import MessageSearch from "src/components/MessageSearch.vue";
import PinnedMessages from "src/components/PinnedMessages.vue";
import { useNotifications } from "src/composables/useNotifications";

const route = useRoute();
const router = useRouter();
const channelsStore = useChannelsStore();
const authStore = useAuthStore();
const chatStore = useChatStore();
const notifications = useNotifications();

const messagesContainer = ref(null);
const messagesEnd = ref(null);
const fileInput = ref(null);
const newMessage = ref("");
const typingUsers = ref([]);
const typingData = ref({}); // Store typing data: username -> {message, timestamp}
const typingPreviewOpen = ref(false);
const typingPreviewUser = ref('');
const typingPreviewMessage = ref('');
const messages = ref([]);
const currentChannelId = ref(null);
const currentPage = ref(1);
const lastPage = ref(1);
const isLoadingOlder = ref(false);
const settingsMenuOpen = ref(false);
const notificationSettingsOpen = ref(false);
const notificationPreference = ref(authStore.notificationPreference || 'all');
const showSearch = ref(false);
const isChannelAdmin = ref(false);
const showEmojiPicker = ref(false);
const commonEmojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥', '🎉', '😢', '😡', '🙏', '💯', '✨'];

const currentUserStatus = computed(() => {
  const uid = authStore.user?.id;
  if (!uid) return 'offline';
  return channelsStore.getUserStatus(uid) || 'offline';
});

const currentChannel = computed(() =>
  channelsStore.channels.find((c) => c.id == currentChannelId.value)
);

const currentUser = computed(() => authStore.user);

watch(() => authStore.notificationPreference, (val) => {
  notificationPreference.value = val || 'all';
});

onMounted(async () => {
  // Load all user statuses first
  await channelsStore.loadAllUserStatuses();

  // Load notification preference
  await loadNotificationPreference();

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
  wsEvents.on("user:status", onUserStatus);
  
  // Listen for kick events on current channel
  if (currentChannelId.value) {
    wsEvents.on(`channel:${currentChannelId.value}:kick`, onUserKicked);
  }
});

// Watch for route changes to handle navigation
watch(() => route.params.channelId, async (newId) => {
  if (newId) {
    const channelId = parseInt(newId);
    if (channelId !== currentChannelId.value) {
      console.log('🔄 Route changed to channel:', channelId);
      currentChannelId.value = channelId;
    }
  }
});

watch(currentChannelId, async (newId, oldId) => {
  if (newId) {
    // Remove old channel kick listener
    if (oldId) {
      wsEvents.off(`channel:${oldId}:kick`, onUserKicked);
    }
    
    // Add new channel kick listener
    wsEvents.on(`channel:${newId}:kick`, onUserKicked);
    
    messages.value = [];
    currentPage.value = 1;
    lastPage.value = 1;
    await joinChannel(newId);
    await loadMessages(newId, 1, false);
  }
});

async function loadMessages(channelId, page = 1, prepend = false) {
  try {
    const res = await api.get(`/channels/${channelId}/messages`, { params: { page } });
    console.log('📥 API Response:', res.data);
    
    // Response is paginated: { data: [...], meta: {...} }
    // Try multiple levels to extract array
    let msgs = res.data?.data || res.data || [];
    
    // If still not array, try unwrapping further
    if (!Array.isArray(msgs) && msgs?.data) {
      msgs = msgs.data;
    }
    
    // Ensure it's an array
    if (!Array.isArray(msgs)) {
      console.error('Messages is not an array:', msgs);
      msgs = [];
    }

    // Pagination meta
    const meta = res.data?.meta || res.data?.pagination || {};
    lastPage.value = meta.last_page || meta.lastPage || meta.total_pages || 1;
    currentPage.value = page;
    
    // API returns DESC; reverse to ASC
    const prepared = msgs.reverse();

    if (prepend) {
      const container = messagesContainer.value;
      const prevHeight = container?.scrollHeight || 0;
      const prevTop = container?.scrollTop || 0;

      messages.value = [...prepared, ...messages.value];

      await nextTick();
      if (container) {
        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - (prevHeight - prevTop);
      }
    } else {
      messages.value = prepared;
      scrollToBottom();
    }
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

function scrollToBottom() {
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }, 100);
}

function onMessage(msg) {
  console.log('📩 Received message:', msg);
  console.log('   Current channel:', currentChannelId.value);
  console.log('   Message channel:', msg.channel_id);
  
  const sameChannel = msg.channel_id == currentChannelId.value;
  notifyForMessage(msg, sameChannel);

  if (!sameChannel) {
    console.warn('   ⚠️ Message for different channel, not rendering');
    return;
  }

  const existing = msg.id && messages.value.find(m => m.id === msg.id);
  if (existing) {
    Object.assign(existing, msg);
    console.log('   🔁 Message already exists, merged updates');
    return;
  }

  console.log('   ✅ Adding to messages array');
  messages.value.push(msg);
  scrollToBottom();
}

function onTypingEvent(data) {
  if (data.channel_id !== currentChannelId.value) return;

  if (data.stop) {
    typingUsers.value = typingUsers.value.filter(
      (u) => u !== data.username
    );
    // Remove from typing data
    delete typingData.value[data.username];
    
    // Close preview after 1 second delay if this user stopped typing
    if (typingPreviewUser.value === data.username) {
      setTimeout(() => {
        // Only close if still the same user and they haven't started typing again
        if (typingPreviewUser.value === data.username && !typingData.value[data.username]) {
          typingPreviewOpen.value = false;
        }
      }, 1000); // 1 second delay before closing
    }
  } else {
    if (!typingUsers.value.includes(data.username)) {
      typingUsers.value.push(data.username);
    }
    
    // Store typing message for preview
    typingData.value[data.username] = {
      message: data.message || '',
      timestamp: Date.now()
    };
    
    // Update preview if it's currently open for this user
    if (typingPreviewOpen.value && typingPreviewUser.value === data.username) {
      typingPreviewMessage.value = data.message || '';
    }
  }
}

async function onScroll(e) {
  const el = e.target;
  if (!el || isLoadingOlder.value) return;

  // Near top → load older messages
  if (el.scrollTop <= 50) {
    await loadOlder();
  }
}

async function loadOlder() {
  if (isLoadingOlder.value) return;
  if (currentPage.value >= lastPage.value) return;
  if (!currentChannelId.value) return;

  isLoadingOlder.value = true;
  const nextPage = currentPage.value + 1;
  await loadMessages(currentChannelId.value, nextPage, true);
  isLoadingOlder.value = false;
}

function onUserStatus(data) {
  console.log('👤 User status changed:', data);
  if (data.userId) {
    channelsStore.updateUserStatus(data.userId, data.status);
  }
}

function isMentioned(msg) {
  const myId = currentUser.value?.id;
  const myNick = currentUser.value?.nickname || currentUser.value?.username;
  const byId = msg.mentioned_user_id && myId && msg.mentioned_user_id === myId;
  const byText = myNick && msg.content && msg.content.includes(`@${myNick}`);
  return Boolean(byId || byText);
}

function channelNameById(id) {
  const chan = channelsStore.channels.find((c) => c.id === id);
  return chan?.name || `channel ${id}`;
}

function notifyForMessage(msg, sameChannel) {
  // Respect DND
  if (currentUserStatus.value === 'dnd') return;

  const mentioned = isMentioned(msg);
  if (notificationPreference.value === 'mentions_only' && !mentioned) return;

  if (notifications.isAppVisible()) return; // show only when app hidden

  const sender = msg.user?.nickname || msg.user?.username || 'Unknown';
  const channelName = sameChannel && currentChannel.value?.name
    ? currentChannel.value.name
    : channelNameById(msg.channel_id);

  if (mentioned) {
    notifications.notifyMention(sender, msg.content || '', channelName);
    return;
  }

  notifications.notifyNewMessage(sender, msg.content || '', channelName);
}

function onUserKicked(data) {
  console.log('👢 User kicked event:', data);
  
  // If I am the one who was kicked, redirect to channels list
  if (data.userId === currentUser.value?.id) {
    $q.notify({
      type: 'negative',
      message: '❌ You were kicked from this channel',
      position: 'top',
      timeout: 3000
    });
    
    // Reload channels to remove this one from the list
    channelsStore.loadChannels();
    
    // Redirect to channels list
    router.push('/channels');
  }
}

onBeforeUnmount(() => {
  wsEvents.off("message", onMessage);
  wsEvents.off("typing", onTypingEvent);
  wsEvents.off("user:status", onUserStatus);
  if (currentChannelId.value) {
    wsEvents.off(`channel:${currentChannelId.value}:kick`, onUserKicked);
  }
});

async function sendMessage() {
  if (!newMessage.value.trim() || !currentChannelId.value) return;
  if (!currentUser.value || !currentUser.value.id) {
    console.error('No user logged in');
    return;
  }

  const text = newMessage.value.trim();

  // Check if it's a command
  if (text.startsWith('/')) {
    handleCommand(text);
    newMessage.value = '';
    return;
  }

  console.log('📤 SENDING MESSAGE as user:', {
    id: currentUser.value.id,
    nickname: currentUser.value.nickname,
    email: currentUser.value.email
  });

  // Send final typing event with complete message before clearing
  if (currentChannelId.value && currentUser.value) {
    wsSend("typing", {
      channel_id: currentChannelId.value,
      user_id: currentUser.value.id,
      username: currentUser.value.username || currentUser.value.nickname,
      message: text // Send the COMPLETE message text
    });
  }

  try {
    // Persist to API so history survives refresh
    const res = await api.post(`/channels/${currentChannelId.value}/messages`, {
      content: text
    });

    const saved = res.data?.message || {
      channel_id: currentChannelId.value,
      user_id: currentUser.value.id,
      user: currentUser.value,
      content: text,
      created_at: new Date().toISOString()
    };

    messages.value.push(saved);

    // Broadcast via WS with user info
    wsSend("message", saved);

    // Now clear the typing indicator
    clearTimeout(timeout);
    wsSend("typing", {
      channel_id: currentChannelId.value,
      user_id: currentUser.value.id,
      username: currentUser.value.username || currentUser.value.nickname,
      stop: true,
    });

    newMessage.value = "";
    scrollToBottom();
  } catch (err) {
    console.error('Send message failed:', err?.response?.data || err);
  }
}

async function handleCommand(cmd) {
  const parts = cmd.trim().split(/\s+/);
  const command = parts[0];

  try {
    switch (command) {
      case '/help':
        await handleHelp();
        break;
      case '/join':
        await handleJoin(parts);
        break;
      case '/list':
        await handleList();
        break;
      case '/kick':
        await handleKick(parts);
        break;
      case '/invite':
        await handleInvite(parts);
        break;
      case '/cancel':
      case '/leave':
        await handleLeave();
        break;
      case '/quit':
        await handleQuit();
        break;
      case '/revoke':
        await handleRevoke(parts);
        break;
      case '/ban':
        await handleBan(parts);
        break;
      case '/unban':
        await handleUnban(parts);
        break;
      default:
        messages.value.push({
          id: null,
          user: { nickname: 'System' },
          content: `Unknown command: ${command}. Type /help to see available commands.`,
          created_at: new Date().toISOString()
        });
    }
  } catch (err) {
    console.error('Command error:', err);
  }
}

async function handleJoin(parts) {
  if (parts.length < 2) {
    console.error('Usage: /join channelName [private]');
    return;
  }
  const channelName = parts[1];
  const isPrivate = parts[2] === 'private';
  
  try {
    const response = await api.post('/messages/command', {
      content: `/join ${channelName}${isPrivate ? ' private' : ''}`
    });
    
    if (response.data.error) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: `Error: ${response.data.error}`,
        created_at: new Date().toISOString()
      });
    } else if (response.data.success) {
      const msg = response.data.created 
        ? `Created and joined channel "${channelName}"`
        : response.data.already_member
        ? `Already a member of "${channelName}"`
        : `Joined channel "${channelName}"`;
      
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: msg,
        created_at: new Date().toISOString()
      });
      
      // Navigate to new channel immediately
      if (response.data.channel) {
        console.log('🔄 Navigating to channel:', response.data.channel.id);
        
        // Reload channels in background
        channelsStore.loadChannels();
        
        // Force navigation with replace
        router.replace(`/chat/${response.data.channel.id}`).catch(err => {
          console.error('Navigation error:', err);
          // Fallback to location change
          window.location.href = `/#/chat/${response.data.channel.id}`;
        });
      }
    }
  } catch (err) {
    console.error('Join error:', err);
  }
}

async function handleList() {
  try {
    const response = await api.get(`/channels/${currentChannelId.value}/members`);
    const members = response.data || [];
    const memberNames = Array.isArray(members) 
      ? members.map(m => m.user?.nickname || m.user?.email || 'Unknown').join(', ')
      : 'No members';
    
    messages.value.push({
      id: null,
      user: { nickname: 'System' },
      content: `Channel members: ${memberNames}`,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('List error:', err);
  }
}

async function handleHelp() {
  const helpMessage = `📚 Available Commands:

📝 Channel Management
• /join channelName [private] - Join existing channel or create new one
• /cancel or /quit - Leave current channel
• /list - Show all members in current channel

👥 User Management
• /invite @username - Invite user to current channel
• /kick @username [reason] - Remove user from channel (admin only)
• /revoke @username - Cancel pending invitation (admin only)
• /unban @username - Unban user from channel (admin only)

ℹ️ Other
• /help - Show this help message

Example:
/join general - Join or create channel "general"
/invite @john - Invite user "john" to current channel`;

  messages.value.push({
    id: null,
    user: { nickname: 'System' },
    content: helpMessage,
    created_at: new Date().toISOString()
  });
}

async function handleKick(parts) {
  if (parts.length < 2) {
    messages.value.push({
      id: null,
      user: { nickname: 'System' },
      content: 'Usage: /kick username',
      created_at: new Date().toISOString()
    });
    return;
  }
  const username = parts[1].replace('@', ''); // Remove @ if present
  
  try {
    const response = await api.post(`/channels/${currentChannelId.value}/messages`, {
      content: `/kick ${username}`
    });
    
    if (response.data.error) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: `❌ ${response.data.error}`,
        created_at: new Date().toISOString()
      });
    } else if (response.data.success) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: `✅ ${response.data.message || `Kicked ${username}`}`,
        created_at: new Date().toISOString()
      });
      
      // Send WebSocket event to notify the kicked user
      if (response.data.userId && response.data.channelId) {
        wsEmit('user:kick', {
          userId: response.data.userId,
          channelId: response.data.channelId,
          kickedBy: currentUser.value.id
        });
      }
      
      // Reload members
      await channelsStore.loadChannels();
    }
  } catch (err) {
    console.error('Kick error:', err);
    const errorMsg = err.response?.data?.error 
      || err.response?.data?.message 
      || err.message 
      || 'Unknown error occurred';
    messages.value.push({
      id: null,
      user: { nickname: 'System' },
      content: `❌ Failed to kick user: ${errorMsg}`,
      created_at: new Date().toISOString()
    });
  }
}

async function handleInvite(parts) {
  if (parts.length < 2) {
    console.error('Usage: /invite username');
    return;
  }
  const username = parts[1];
  
  try {
    const response = await api.post(`/channels/${currentChannelId.value}/messages`, {
      content: `/invite ${username}`
    });
    
    if (response.data.error) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: `Error: ${response.data.error}`,
        created_at: new Date().toISOString()
      });
    } else if (response.data.success) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: response.data.message || `Invited ${username}`,
        created_at: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error('Invite error:', err);
  }
}

async function handleLeave() {
  try {
    await api.post(`/channels/${currentChannelId.value}/leave`);
    messages.value.push({
      id: null,
      user: { nickname: 'System' },
      content: 'You have left the channel',
      created_at: new Date().toISOString()
    });
    // Reload channels
    await channelsStore.loadChannels();
  } catch (err) {
    console.error('Leave error:', err);
  }
}

async function handleQuit() {
  try {
    await api.post(`/channels/${currentChannelId.value}/leave`);
    messages.value.push({
      id: null,
      user: { nickname: 'System' },
      content: 'Channel deleted',
      created_at: new Date().toISOString()
    });
    // Reload channels
    await channelsStore.loadChannels();
  } catch (err) {
    console.error('Quit error:', err);
  }
}

async function handleRevoke(parts) {
  if (parts.length < 2) {
    console.error('Usage: /revoke username');
    return;
  }
  const username = parts[1];
  
  try {
    const response = await api.post(`/channels/${currentChannelId.value}/messages`, {
      content: `/revoke ${username}`
    });
    
    if (response.data.error) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: `Error: ${response.data.error}`,
        created_at: new Date().toISOString()
      });
    } else if (response.data.success) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: response.data.message || `Revoked invite for ${username}`,
        created_at: new Date().toISOString()
      });
      
      // Reload members
      await channelsStore.loadChannels();
    }
  } catch (err) {
    console.error('Revoke error:', err);
  }
}

async function handleBan(parts) {
  if (parts.length < 2) {
    console.error('Usage: /ban username [reason]');
    return;
  }
  const username = parts[1];
  const reason = parts.slice(2).join(' ') || 'No reason provided';
  
  try {
    const response = await api.post(`/channels/${currentChannelId.value}/messages`, {
      content: `/ban ${username} ${reason}`
    });
    
    if (response.data.error) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: `Error: ${response.data.error}`,
        created_at: new Date().toISOString()
      });
    } else if (response.data.success) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: response.data.message || `Banned ${username}`,
        created_at: new Date().toISOString()
      });
      
      // Reload members
      await channelsStore.loadChannels();
    }
  } catch (err) {
    console.error('Ban error:', err);
  }
}

async function handleUnban(parts) {
  if (parts.length < 2) {
    console.error('Usage: /unban username');
    return;
  }
  const username = parts[1];
  
  try {
    const response = await api.post(`/channels/${currentChannelId.value}/messages`, {
      content: `/unban ${username}`
    });
    
    if (response.data.error) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: `Error: ${response.data.error}`,
        created_at: new Date().toISOString()
      });
    } else if (response.data.success) {
      messages.value.push({
        id: null,
        user: { nickname: 'System' },
        content: response.data.message || `Unbanned ${username}`,
        created_at: new Date().toISOString()
      });
      
      // Reload members
      await channelsStore.loadChannels();
    }
  } catch (err) {
    console.error('Unban error:', err);
  }
}

let timeout = null;

function onTyping() {
  if (!currentChannelId.value || !currentUser.value) return;

  wsSend("typing", {
    channel_id: currentChannelId.value,
    user_id: currentUser.value.id,
    username: currentUser.value.username || currentUser.value.nickname,
    message: newMessage.value // Send current message text for preview
  });

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    wsSend("typing", {
      channel_id: currentChannelId.value,
      user_id: currentUser.value.id,
      username: currentUser.value.username || currentUser.value.nickname,
      stop: true,
    });
  }, 2000); // Increased from 600ms to 2 seconds
}

function showTypingPreview(username) {
  typingPreviewUser.value = username;
  typingPreviewMessage.value = typingData.value[username]?.message || '';
  typingPreviewOpen.value = true;
}

function insertEmoji(emoji) {
  newMessage.value += emoji;
  showEmojiPicker.value = false;
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length || !currentChannelId.value) {
    event.target.value = '';
    return;
  }

  for (const file of files) {
    try {
      // 1) Create a message first (use current text or filename)
      const baseContent = newMessage.value?.trim() || file.name;
      const msgRes = await api.post(`/channels/${currentChannelId.value}/messages`, {
        content: baseContent
      });
      const created = msgRes.data?.message;
      if (!created) continue;

      // 2) Upload the file against this message
      const form = new FormData();
      form.append('file', file);
      const uploadRes = await api.post(`/messages/${created.id}/files`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const attachment = uploadRes.data?.attachment;
      if (attachment) {
        created.attachments = [attachment];
      }

      // 3) Add to local list and notify via WS
      messages.value.push(created);
      wsSend('message', created);
    } catch (err) {
      console.error('File upload error:', err?.response?.data || err);
    }
  }

  newMessage.value = '';
  event.target.value = '';
  scrollToBottom();
}

async function loadNotificationPreference() {
  try {
    const pref = await authStore.loadNotificationPreference();
    notificationPreference.value = pref || 'all';
  } catch (err) {
    console.error('Failed to load notification preference:', err);
  }
}

async function saveNotificationPreference() {
  try {
    const ok = await authStore.setNotificationPreference(notificationPreference.value);
    if (ok) {
      console.log('Notification preference saved:', notificationPreference.value);
    }
  } catch (err) {
    console.error('Failed to save notification preference:', err);
  }
}

function jumpToMessage(messageId) {
  const messageElement = document.getElementById(`message-${messageId}`);
  if (messageElement) {
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Highlight the message
    messageElement.classList.add('highlight');
    setTimeout(() => {
      messageElement.classList.remove('highlight');
    }, 2000);
  }
}

function updateIsAdmin() {
  if (!currentChannel.value) {
    isChannelAdmin.value = false;
    return;
  }
  
  // Check if current user is admin of this channel
  const membership = currentChannel.value.members?.find(m => m.user_id === authStore.user?.id);
  isChannelAdmin.value = membership?.is_admin || currentChannel.value.admin_id === authStore.user?.id || false;
}

watch(currentChannel, updateIsAdmin);
</script>

<style scoped>
.header-actions {
  position: relative;
  z-index: 4001;
}
.header-menu {
  z-index: 4002 !important;
}
.highlight {
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    background-color: inherit;
  }
  50% {
    background-color: rgba(255, 193, 7, 0.3);
  }
}
</style>
<style>
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
</style>
