import { createRouter, createWebHistory } from 'vue-router';

/**
 * 라우트 정의.
 * component에 동적 임포트(() => import(...))를 사용해 라우트별 코드 분할(lazy loading)이 되도록 한다.
 */
const routes = [
  {
    path: '/',
    redirect: '/orders',
  },
  {
    path: '/orders/new',
    name: 'order-register',
    component: () => import('@/views/order/OrderRegisterView.vue'),
  },
  {
    path: '/orders',
    name: 'order-list',
    component: () => import('@/views/order/OrderListView.vue'),
  },
  {
    path: '/dispatch',
    name: 'dispatch-plan',
    component: () => import('@/views/dispatch/DispatchPlanView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
