<template>
  <div
    v-if="visible"
    class="app-context-menu"
    :style="{ left: `${x}px`, top: `${y}px` }"
    @click.stop
    @contextmenu.prevent
  >
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="app-context-menu__item"
      @click="$emit('select', item.id)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  items: {
    type: Array,
    default: () => []
  }
})

defineEmits(['select'])
</script>

<style scoped>
.app-context-menu {
  position: fixed;
  z-index: 12000;
  min-width: 220px;
  background: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-context-menu__item {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: #e5e7eb;
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.app-context-menu__item:hover {
  background: #374151;
}
</style>
