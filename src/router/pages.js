/**
 * 앱의 "화면(= 탭 하나)" 목록. 사이드바 메뉴, 상단 탭, 라우터가 모두 이 정의 하나를 공유한다.
 * 메뉴를 추가/변경할 때는 이 파일만 고치면 된다.
 *
 * 라우터 index.js와 분리한 이유:
 *  - index.js는 MainLayout을 import하고, MainLayout 안의 사이드바는 이 목록을 import한다.
 *  - 같은 파일에 두면 router -> MainLayout -> 사이드바 -> router 로 순환 import가 생기므로 파일을 나눴다.
 *
 * meta 항목
 *  - title         : 사이드바 메뉴명 / 탭 제목
 *  - icon          : @element-plus/icons-vue 아이콘 이름 (AppSidebar.vue의 ICONS 맵에 등록해야 함)
 *  - group         : 사이드바에서 묶어서 보여줄 그룹명
 *  - componentName : 해당 View의 defineOptions({ name }) 값. keep-alive의 include가 이 이름으로 캐시 대상을 판단한다.
 */

// 탭이 하나도 없을 때(마지막 탭을 닫았을 때) 자동으로 열리는 화면. 메인(홈) 화면이 생기면 그 경로로 교체한다.
export const DEFAULT_TAB_PATH = '/orders';

// MainLayout의 자식 라우트이므로 path 앞에 '/'를 붙이지 않는다. (실제 경로는 '/orders/new' 등)
export const pageRoutes = [
  {
    path: 'orders/new',
    name: 'order-register',
    component: () => import('@/views/order/OrderRegisterView.vue'),
    meta: { title: '운송주문 등록', icon: 'DocumentAdd', group: '운송', componentName: 'OrderRegisterView' },
  },
  {
    path: 'orders',
    name: 'order-list',
    component: () => import('@/views/order/OrderListView.vue'),
    meta: { title: '운송요청 관리', icon: 'List', group: '운송', componentName: 'OrderListView' },
  },
  {
    path: 'dispatch',
    name: 'dispatch-plan',
    component: () => import('@/views/dispatch/DispatchPlanView.vue'),
    meta: { title: '운송계획(배차)', icon: 'Guide', group: '배차', componentName: 'DispatchPlanView' },
  },
  {
    path: 'vehicles',
    name: 'vehicle-manage',
    component: () => import('@/views/vehicle/VehicleManageView.vue'),
    meta: { title: '차량 관리', icon: 'Van', group: '기준정보', componentName: 'VehicleManageView' },
  },
];
