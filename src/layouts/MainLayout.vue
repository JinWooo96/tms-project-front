<template>
  <div class="layout">
    <AppSidebar />

    <div class="main-column">
      <AppHeader />
      <TabBar />

      <main class="content">
        <!--
          KeepAlive: 화면을 파괴하지 않고 메모리에 보관했다가 다시 보여준다. (탭 전환 시 입력값/스크롤/필터 유지)
          include: "열려 있는 탭"의 컴포넌트만 보관한다. 탭을 닫으면 목록에서 빠지면서 캐시도 함께 정리된다.
          include는 컴포넌트 이름으로 비교하므로 각 View에 defineOptions({ name })이 있어야 한다.
        -->
        <RouterView v-slot="{ Component }">
          <KeepAlive :include="tabStore.cachedNames">
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import TabBar from '@/components/layout/TabBar.vue';
import { useTabStore } from '@/stores/tabStore';
import { routeToTab } from '@/composables/useTabs';

/**
 * 공통 레이아웃: 사이드바 + 헤더 + 탭바 + 본문.
 * 화면이 바뀔 때 바뀌는 곳은 본문(<RouterView>)뿐이다.
 */
const route = useRoute();
const router = useRouter();
const tabStore = useTabStore();

// 새로고침 대비: sessionStorage에 저장해둔 탭 목록을 복원한다.
// router.resolve()로 경로를 라우트 정보로 바꿔서 탭을 만들고, 더 이상 존재하지 않는 경로는 걸러진다.
tabStore.restore((path) => routeToTab(router.resolve(path)));

// 주소(경로)가 바뀔 때마다 해당 화면의 탭을 열거나 활성화한다. (immediate: 처음 진입한 화면도 탭으로 연다)
// 사이드바 클릭, 탭 클릭, 주소창 직접 입력, 뒤로가기 등 이동 방법과 관계없이 항상 같은 규칙이 적용된다.
watch(
  () => route.path,
  () => {
    const tab = routeToTab(route);
    if (tab) tabStore.openTab(tab);
  },
  { immediate: true },
);
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  background: var(--tms-page-bg);
}

.main-column {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 헤더와 탭바는 고정, 본문만 스크롤된다. */
.content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 24px 20px 32px;
}
</style>
