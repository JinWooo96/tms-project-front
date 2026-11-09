import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/layouts/MainLayout.vue';
import { DEFAULT_TAB_PATH, pageRoutes } from './pages';

/**
 * 라우트 정의.
 * 공통 레이아웃(사이드바 + 헤더 + 탭바)을 부모 라우트로 두고, 각 화면은 그 자식으로 넣는다.
 * -> 화면이 바뀔 때 레이아웃은 그대로 있고, MainLayout 안의 <RouterView> 자리(본문)만 갈아끼워진다.
 *
 * 나중에 로그인 화면이 생기면 레이아웃 "밖"에 별도 라우트로 추가하면 된다.
 *   { path: '/login', component: () => import('@/views/auth/LoginView.vue') }
 */
const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: DEFAULT_TAB_PATH,
    children: pageRoutes, // 화면 정의는 pages.js에서 관리
  },
  {
    // 존재하지 않는 주소는 기본 화면으로 보낸다.
    path: '/:pathMatch(.*)*',
    redirect: DEFAULT_TAB_PATH,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
