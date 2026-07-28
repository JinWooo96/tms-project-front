<script setup>
import { RouterView, useRoute } from 'vue-router';

// el-menu의 하이라이트(activeIndex)를 현재 라우트 경로와 항상 일치시킨다.
// 이렇게 하지 않으면, 브라우저 뒤로가기/새로고침 등으로 경로가 바뀌었을 때
// 메뉴 하이라이트가 실제 화면과 어긋날 수 있다.
const route = useRoute();
</script>

<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <h1>TMS</h1>
      <!--
        router 속성을 주면, el-menu-item의 index 값을 라우트 경로로 인식해서
        클릭 시 자동으로 해당 경로로 이동시켜준다.
        이때 el-menu-item 안에 RouterLink를 또 넣으면 네비게이션 처리 주체가
        el-menu(router 속성)와 RouterLink 둘로 나뉘어 충돌이 생긴다.
        그래서 el-menu-item 안에는 순수 텍스트(라벨)만 넣는다.
      -->
      <el-menu mode="horizontal" :ellipsis="false" router :default-active="route.path">
        <el-menu-item index="/orders/new">운송주문 등록</el-menu-item>
        <el-menu-item index="/orders">운송요청 관리</el-menu-item>
        <el-menu-item index="/dispatch">운송계획(배차)</el-menu-item>
      </el-menu>
    </el-header>

    <el-main>
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