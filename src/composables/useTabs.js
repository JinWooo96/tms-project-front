import { useRouter } from 'vue-router';
import { useTabStore } from '@/stores/tabStore';
import { DEFAULT_TAB_PATH } from '@/router/pages';

/**
 * 라우트 정보를 탭 객체로 변환한다. 탭으로 쓸 수 없는 라우트(meta.title 없음)는 null.
 * route는 router.resolve()의 결과 또는 useRoute()의 값 둘 다 가능하다.
 */
export function routeToTab(route) {
  if (!route?.meta?.title) return null;
  return {
    path: route.path,
    title: route.meta.title,
    componentName: route.meta.componentName,
  };
}

/**
 * 탭 닫기/이동처럼 "스토어 + 라우터"를 함께 다루는 동작 모음.
 * 스토어는 화면 이동을 모르고, 이동은 여기서 router로 처리한다.
 */
export function useTabs() {
  const router = useRouter();
  const tabStore = useTabStore();

  /** 탭이 모두 없어졌을 때 기본 화면(운송요청 관리)을 연다. */
  function openDefaultTab() {
    tabStore.openTab(routeToTab(router.resolve(DEFAULT_TAB_PATH)));
    router.push(DEFAULT_TAB_PATH);
  }

  /** 탭 X 버튼 동작: 탭을 닫고, 활성 탭이었다면 이웃 탭으로 이동한다. */
  function closeTab(path) {
    const nextPath = tabStore.closeTab(path);

    if (tabStore.tabs.length === 0) {
      openDefaultTab(); // 마지막 탭을 닫으면 기본 화면으로
    } else if (nextPath) {
      router.push(nextPath);
    }
  }

  /** 화면 안에서 호출: 현재 탭을 닫고 다른 화면으로 이동한다. (예: 주문 등록 완료 -> 목록) */
  function closeTabAndGo(path, to) {
    tabStore.closeTab(path);
    router.push(to);
  }

  return { closeTab, closeTabAndGo };
}
