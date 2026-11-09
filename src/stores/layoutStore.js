import { defineStore } from 'pinia';

// 사이드바 접힘 상태는 새로고침/재접속해도 유지되도록 localStorage에 저장한다.
const STORAGE_KEY = 'tms.sidebarCollapsed';

function loadCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** 공통 레이아웃 UI 상태 (사이드바 접힘 여부) */
export const useLayoutStore = defineStore('layout', {
  state: () => ({
    sidebarCollapsed: loadCollapsed(),
  }),

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      try {
        localStorage.setItem(STORAGE_KEY, String(this.sidebarCollapsed));
      } catch {
        // 저장 실패는 무시 (이번 접속에서만 유지됨)
      }
    },
  },
});
