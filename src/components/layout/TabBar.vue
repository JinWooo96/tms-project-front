<script setup>
import { useRouter } from 'vue-router';
import { Close } from '@element-plus/icons-vue';
import { useTabStore } from '@/stores/tabStore';
import { useTabs } from '@/composables/useTabs';

const router = useRouter();
const tabStore = useTabStore();
const { closeTab } = useTabs();
</script>

<template>
  <div class="tab-bar" role="tablist" aria-label="열린 메뉴">
    <div
      v-for="tab in tabStore.tabs"
      :key="tab.path"
      class="tab"
      :class="{ 'is-active': tab.path === tabStore.activePath }"
    >
      <!-- 탭 클릭: 해당 화면으로 이동 (keep-alive 덕분에 입력하던 상태 그대로 복귀) -->
      <button
        type="button"
        role="tab"
        class="tab-label"
        :class="{ 'no-close': !tabStore.isClosable(tab.path) }"
        :aria-selected="tab.path === tabStore.activePath"
        @click="router.push(tab.path)"
      >
        {{ tab.title }}
      </button>

      <!-- 기본 화면 하나만 남았을 때는 X 버튼을 숨긴다. -->
      <button
        v-if="tabStore.isClosable(tab.path)"
        type="button"
        class="tab-close"
        :aria-label="`${tab.title} 탭 닫기`"
        @click.stop="closeTab(tab.path)"
      >
        <el-icon :size="12"><Close /></el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tab-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  min-height: 44px;
  padding: 8px 16px 0;
  background: var(--tms-tab-strip-bg);
  border-bottom: 1px solid var(--tms-border-strong);
  box-sizing: border-box;
  overflow-x: auto;
}

.tab {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
}

/* 활성 탭: 흰 배경으로 본문과 이어져 보이게 한다. */
.tab.is-active {
  position: relative;
  top: 1px;
  background: #fff;
  border-color: var(--tms-border-strong);
}

.tab-label {
  height: 36px;
  padding: 0 6px 0 14px;
  border: 0;
  background: transparent;
  color: var(--tms-text-muted);
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

.tab-label.no-close {
  padding-right: 14px;
}

.tab-label:hover {
  color: var(--tms-text-strong);
}

.tab.is-active .tab-label {
  color: var(--tms-text-strong);
  font-weight: 600;
}

.tab-close {
  width: 22px;
  height: 22px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--tms-text-muted);
  cursor: pointer;
}

.tab-close:hover {
  background: #dce3ec;
}

.tab-label:focus-visible,
.tab-close:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}
</style>
