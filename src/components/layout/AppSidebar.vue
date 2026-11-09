<script setup>
import { DocumentAdd, Guide, List, Van } from '@element-plus/icons-vue';
import { pageRoutes } from '@/router/pages';
import { useLayoutStore } from '@/stores/layoutStore';

const layoutStore = useLayoutStore();

// pages.js의 meta.icon(문자열) -> 실제 아이콘 컴포넌트 매핑.
// 새 아이콘을 쓰려면 여기에 import + 등록한다. (라우트 정의에 컴포넌트를 직접 넣지 않으려고 문자열로 관리)
const ICONS = { DocumentAdd, List, Guide, Van };

// pages.js의 화면 목록을 meta.group 기준으로 묶어서 메뉴 구조를 만든다. (정의 순서 유지)
const menuGroups = [];
for (const route of pageRoutes) {
  let group = menuGroups.find((g) => g.name === route.meta.group);
  if (!group) {
    group = { name: route.meta.group, items: [] };
    menuGroups.push(group);
  }
  group.items.push({
    path: `/${route.path}`, // 자식 라우트의 path에는 '/'가 없으므로 붙여준다.
    title: route.meta.title,
    icon: ICONS[route.meta.icon],
  });
}
</script>

<template>
  <aside class="sidebar" :class="{ 'is-collapsed': layoutStore.sidebarCollapsed }">
    <div class="brand">
      <div class="brand-mark">
        <el-icon :size="18"><Van /></el-icon>
      </div>
      <span v-if="!layoutStore.sidebarCollapsed" class="brand-name">TMS</span>
    </div>

    <nav class="nav" aria-label="주 메뉴">
      <template v-for="(group, index) in menuGroups" :key="group.name">
        <!-- 펼침: 그룹 제목 / 접힘: 그룹 사이 구분선 -->
        <div v-if="!layoutStore.sidebarCollapsed" class="group-label">{{ group.name }}</div>
        <div v-else-if="index > 0" class="group-divider"></div>

        <!-- 접힌 상태에서는 아이콘만 보이므로 마우스를 올리면 메뉴명을 툴팁으로 보여준다. -->
        <el-tooltip
          v-for="item in group.items"
          :key="item.path"
          :content="item.title"
          placement="right"
          :show-after="150"
          :disabled="!layoutStore.sidebarCollapsed"
        >
          <!-- RouterLink가 현재 경로와 같으면 is-active 클래스와 aria-current="page"를 자동으로 붙여준다. -->
          <RouterLink :to="item.path" class="nav-item" active-class="is-active" :aria-label="item.title">
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
            <span v-if="!layoutStore.sidebarCollapsed" class="nav-label">{{ item.title }}</span>
          </RouterLink>
        </el-tooltip>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  flex: 0 0 auto;
  width: var(--tms-sidebar-width);
  display: flex;
  flex-direction: column;
  background: var(--tms-sidebar-bg);
  color: var(--tms-sidebar-text);
  transition: width 0.18s ease;
  overflow: hidden;
}

.sidebar.is-collapsed {
  width: var(--tms-sidebar-width-collapsed);
}

.brand {
  height: var(--tms-header-height);
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
}

.brand-mark {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--el-color-primary);
  color: #fff;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #fff;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 10px;
}

.group-label {
  padding: 14px 12px 6px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.6px;
  color: var(--tms-sidebar-text-muted);
}

.group-divider {
  height: 1px;
  margin: 10px 8px;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--tms-sidebar-text);
  text-decoration: none;
  white-space: nowrap;
  box-sizing: border-box;
}

.nav-item:hover {
  background: var(--tms-sidebar-hover-bg);
}

.nav-item.is-active {
  background: var(--tms-sidebar-active-bg);
  color: #fff;
  font-weight: 600;
}

.nav-item:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

/* 접힌 상태: 아이콘만 가운데 정렬 */
.is-collapsed .nav-item {
  justify-content: center;
  padding: 0;
}
</style>
