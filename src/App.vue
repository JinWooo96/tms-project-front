<script setup>
import { RouterLink, RouterView } from 'vue-router';

/**
 * 상단 네비게이션 + 라우터 뷰
 */
</script>

<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <h1>TMS</h1>
      <el-menu mode="horizontal" :ellipsis="false" router>
        <el-menu-item index="/orders/new">
          <RouterLink to="/orders/new">운송주문 등록</RouterLink>
        </el-menu-item>
        <el-menu-item index="/orders">
          <RouterLink to="/orders">운송요청 관리</RouterLink>
        </el-menu-item>
        <el-menu-item index="/dispatch">
          <RouterLink to="/dispatch">운송계획(배차)</RouterLink>
        </el-menu-item>
      </el-menu>
    </el-header>

    <el-main>
      <!-- 페이지 내용이 갈아껴지는 곳 - router/index.js -->
      <RouterView />
    </el-main>
  </el-container>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 32px;
  border-bottom: 1px solid #e4e7ed;
}

.app-header h1 {
  font-size: 20px;
  white-space: nowrap;
}
</style>
