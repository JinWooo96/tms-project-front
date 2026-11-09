<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowDown, Key, SwitchButton, User } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

// v-model:visible로 팝오버 열림 상태를 직접 제어한다. (메뉴 항목을 누르면 닫기 위함)
const visible = ref(false);

// 로그인 기능이 아직 없으므로 각 메뉴는 "준비 중" 안내만 띄운다.
// 인증을 붙일 때 이 함수들을 실제 동작(내 정보 화면 이동, 로그아웃 API 호출 등)으로 교체한다.
function handleMenuClick(label) {
  visible.value = false;
  ElMessage.info(`${label} 기능은 아직 준비 중입니다.`);
}
</script>

<template>
  <el-popover
    v-model:visible="visible"
    trigger="click"
    placement="bottom-end"
    :width="248"
    :show-arrow="false"
    :offset="6"
    popper-class="user-popover"
  >
    <template #reference>
      <button type="button" class="user-button" aria-haspopup="true" :aria-expanded="visible" aria-label="사용자 메뉴">
        <span class="avatar">{{ userStore.initial }}</span>
        <span class="user-name">{{ userStore.user.name }}</span>
        <el-icon :size="16" class="chevron"><ArrowDown /></el-icon>
      </button>
    </template>

    <div class="user-card">
      <div class="user-info">
        <span class="avatar avatar-lg">{{ userStore.initial }}</span>
        <div class="user-info-text">
          <div class="info-name">{{ userStore.user.name }}</div>
          <div class="info-sub">{{ userStore.user.role }}</div>
          <div class="info-sub">{{ userStore.user.email }}</div>
        </div>
      </div>

      <button type="button" class="menu-item" @click="handleMenuClick('내 정보')">
        <el-icon :size="18"><User /></el-icon>내 정보
      </button>
      <button type="button" class="menu-item" @click="handleMenuClick('비밀번호 변경')">
        <el-icon :size="18"><Key /></el-icon>비밀번호 변경
      </button>
      <div class="menu-divider"></div>
      <button type="button" class="menu-item menu-item-danger" @click="handleMenuClick('로그아웃')">
        <el-icon :size="18"><SwitchButton /></el-icon>로그아웃
      </button>
    </div>
  </el-popover>
</template>

<style scoped>
.user-button {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 0 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--tms-text);
  cursor: pointer;
}

.user-button:hover {
  background: #eef2f7;
}

.user-button:focus-visible,
.menu-item:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.chevron {
  color: var(--tms-text-muted);
}

.avatar {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

.avatar-lg {
  width: 38px;
  height: 38px;
  font-size: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 6px;
  border-bottom: 1px solid #eef1f5;
}

.user-info-text {
  min-width: 0;
}

.info-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--tms-text);
}

.info-sub {
  font-size: 12.5px;
  color: var(--tms-text-muted);
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--tms-text);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover {
  background: #f1f5f9;
}

.menu-item .el-icon {
  color: var(--tms-text-muted);
}

.menu-item-danger,
.menu-item-danger .el-icon {
  color: #b42318;
}

.menu-divider {
  height: 1px;
  margin: 6px 0;
  background: #eef1f5;
}
</style>

<!-- 팝오버 박스(.el-popper) 자체는 body로 옮겨져 렌더링되므로, 여기만 scoped가 아닌 전역 스타일로 덮어쓴다. -->
<style>
.el-popper.user-popover {
  padding: 6px;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(16, 42, 67, 0.14);
}
</style>
