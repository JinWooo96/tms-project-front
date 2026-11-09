<script setup>
// 화면 구성(사이드바/헤더/탭)은 router에서 부모 라우트로 지정한 MainLayout이 담당한다.
// App.vue는 라우트가 결정한 컴포넌트를 그려주는 최상위 자리만 남긴다.
// (나중에 로그인 화면처럼 레이아웃이 없는 페이지도 같은 방식으로 들어올 수 있다.)
</script>

<template>
  <RouterView />
</template>
