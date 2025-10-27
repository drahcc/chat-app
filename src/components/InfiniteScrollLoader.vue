<template>
  <div class="infinite-scroll-loader">
    <div 
      v-if="loading" 
      class="loading-indicator row items-center justify-center q-pa-md"
    >
      <q-spinner size="sm" color="primary" class="q-mr-sm" />
      <span class="text-caption">Loading older messages...</span>
    </div>
    
    <div 
      v-else-if="hasMore" 
      class="load-more-indicator text-center q-pa-sm"
    >
      <q-btn 
        flat 
        dense 
        label="Load older messages" 
        icon="expand_less"
        color="primary"
        @click="loadMore"
        class="full-width"
      />
    </div>
    
    <div 
      v-else 
      class="no-more-indicator text-center q-pa-md text-grey text-caption"
    >
      No more messages
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['load-more'])

function loadMore() {
  emit('load-more')
}
</script>

<style scoped>
.infinite-scroll-loader {
  border-bottom: 1px solid #e0e0e0;
}

.loading-indicator {
  background-color: #f8f9fa;
}

.load-more-indicator {
  background-color: #f8f9fa;
  cursor: pointer;
}

.load-more-indicator:hover {
  background-color: #e9ecef;
}

.no-more-indicator {
  background-color: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}
</style>