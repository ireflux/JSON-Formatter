<template>
  <transition name="fade">
    <div v-if="toast.show" :class="['toast', toast.type]" role="status" aria-live="polite">
      {{ toast.message }}
    </div>
  </transition>
</template>

<script setup>
defineProps({
  toast: {
    type: Object,
    required: true
  }
})
</script>
