import { defineStore } from 'pinia';
import { orderApi } from '@/api/orderApi';

/**
 * 운송주문 관련 상태를 관리하는 스토어.
 * 여러 화면(운송요청 관리 화면, 배차 화면 등)에서 공유될 수 있는 데이터만 여기서 관리한다.
 * (등록 화면의 폼 입력값처럼 화면 하나에서만 쓰는 상태는 컴포넌트 지역 상태로 둔다.)
 */
export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [],
    totalElements: 0,
    totalPages: 0,
    loading: false,
  }),

  actions: {
    /**
     * 주문 목록을 조회해서 상태에 반영한다.
     * @param {{status?: string, page?: number, size?: number}} params
     */
    async fetchOrders(params = {}) {
      this.loading = true;
      try {
        const result = await orderApi.getOrders(params);
        this.orders = result.content;
        this.totalElements = result.totalElements;
        this.totalPages = result.totalPages;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 운송주문을 등록한다. 성공 시 등록된 주문 정보를 반환한다.
     * (목록 갱신은 호출부에서 필요할 때 fetchOrders()를 다시 호출하는 방식으로 처리)
     */
    async createOrder(payload) {
      return orderApi.createOrder(payload);
    },
  },
});
