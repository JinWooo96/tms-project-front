import { defineStore } from 'pinia';
import { DEFAULT_TAB_PATH } from '@/router/pages';

// 새로고침해도 열린 탭 목록을 유지하기 위해 sessionStorage에 "경로 목록만" 저장한다.
// - sessionStorage: 브라우저 탭(창)을 닫으면 사라진다. (다음날 다시 접속했을 때 어제 탭이 남아있는 걸 막기 위함)
// - 제목/컴포넌트명은 저장하지 않는다. 복원할 때 라우트 정의(pages.js)에서 다시 읽으므로 메뉴명이 바뀌어도 항상 최신이다.
const STORAGE_KEY = 'tms.openTabPaths';

function loadSavedPaths() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // 저장값이 깨졌거나 storage 접근이 막힌 경우엔 빈 목록으로 시작
  }
}

/**
 * 상단 탭 상태 관리.
 * tab 형태: { path, title, componentName }
 */
export const useTabStore = defineStore('tab', {
  state: () => ({
    tabs: [],
    activePath: null,
  }),

  getters: {
    // <KeepAlive :include>에 넘길 값. "열려 있는 탭의 컴포넌트만" 캐시한다.
    // -> 탭을 닫으면 목록에서 빠지고, KeepAlive가 해당 화면의 캐시(입력값 등)를 버린다.
    cachedNames: (state) => state.tabs.map((tab) => tab.componentName),

    // 탭이 기본 화면 하나만 남았을 때는 닫을 수 없다. (닫아도 곧바로 같은 화면이 다시 열리기 때문)
    isClosable: (state) => (path) => !(state.tabs.length === 1 && path === DEFAULT_TAB_PATH),
  },

  actions: {
    /**
     * 저장해둔 탭 목록을 복원한다. 앱 시작 시 한 번만 호출한다.
     * @param toTab 경로 -> tab 객체로 바꿔주는 함수. 존재하지 않는 경로면 null을 반환해야 한다.
     */
    restore(toTab) {
      if (this.tabs.length > 0) return;
      const seen = new Set();
      this.tabs = loadSavedPaths()
        .map(toTab)
        .filter((tab) => tab && !seen.has(tab.path) && seen.add(tab.path));
    },

    /** 탭을 열거나, 이미 열려 있으면 그 탭을 활성화한다. */
    openTab(tab) {
      if (!this.tabs.some((t) => t.path === tab.path)) {
        this.tabs.push({ path: tab.path, title: tab.title, componentName: tab.componentName });
      }
      this.activePath = tab.path;
      this.persist();
    },

    /**
     * 탭을 닫는다.
     * @returns 닫은 탭이 "활성 탭"이었다면 대신 보여줄 탭의 경로(오른쪽 이웃 -> 없으면 왼쪽 이웃). 그 외에는 null.
     *          화면 이동 자체는 이 스토어가 하지 않고, 호출한 쪽(useTabs)이 router로 처리한다.
     */
    closeTab(path) {
      const index = this.tabs.findIndex((tab) => tab.path === path);
      if (index === -1 || !this.isClosable(path)) return null;

      const wasActive = this.activePath === path;
      this.tabs.splice(index, 1);
      this.persist();

      if (!wasActive) return null;
      const neighbor = this.tabs[index] ?? this.tabs[index - 1];
      return neighbor ? neighbor.path : null;
    },

    /** 현재 탭 목록의 경로만 sessionStorage에 저장 */
    persist() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.tabs.map((tab) => tab.path)));
      } catch {
        // 저장 실패(용량 초과, 접근 차단)는 기능상 치명적이지 않으므로 무시한다.
      }
    },
  },
});
