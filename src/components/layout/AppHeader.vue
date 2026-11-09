<script setup>
import { Expand, Fold } from '@element-plus/icons-vue';
import { useLayoutStore } from '@/stores/layoutStore';
import UserPopover from './UserPopover.vue';

const layoutStore = useLayoutStore();
</script>

<template>
  <header class="app-header">
    <button
      type="button"
      class="toggle-button"
      :aria-label="layoutStore.sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'"
      @click="layoutStore.toggleSidebar()"
    >
      <el-icon :size="20">
        <Expand v-if="layoutStore.sidebarCollapsed" />
        <Fold v-else />
      </el-icon>
    </button>

    <div class="spacer"></div>

    <UserPopover />
  </header>
</template>

<style scoped>
.app-header {
  height: var(--tms-header-height);
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  background: var(--tms-header-bg);
  border-bottom: 1px solid var(--tms-border);
  box-sizing: border-box;
}

.spacer {
  flex: 1 1 auto;
}

.toggle-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  cursor: pointer;
}

.toggle-button:hover {
  background: #eef2f7;
}

.toggle-button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
</style>
