import { defineStore } from 'pinia';
import { dispatchApi } from '@/api/dispatchApi';

/**
 * 배차 관련 상태를 관리하는 스토어.
 */
export const useDispatchStore = defineStore('dispatch', {
  state: () => ({
    dispatches: [],
    recommendations: [],    // 추천 결과 목록
    unassignedOrderIds: [], // 이번 추천에서 배정되지 못한 주문 ID 목록
    loading: false,
  }),

  actions: {
    /** 배차를 확정한다. */
    async confirmDispatch(orderId, vehicleId) {
      return dispatchApi.confirmDispatch(orderId, vehicleId);
    },

    /** 배차를 취소한다. */
    async cancelDispatch(dispatchId) {
      return dispatchApi.cancelDispatch(dispatchId);
    },

    /** 배차 목록을 조회해서 상태에 반영한다. */
    async fetchDispatches(params = {}) {
      this.loading = true;
      try {
        this.dispatches = await dispatchApi.getDispatches(params);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 자동 배차 추천을 계산해서 상태에 반영
     * orderIds를 안 넘기면 전체 추천, 배열을 넘기면 선택 추천.
     */
    async fetchRecommendations(orderIds) {
      this.loading = true;
      try {
        const result = await dispatchApi.getRecommendations(orderIds);
        this.recommendations = result.recommendations;
        this.unassignedOrderIds = result.unassignedOrderIds;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 추천 여러 건을 순서대로 확정한다. (한 건이 실패해도 나머지는 계속 진행)
     * 순차 호출이므로 앞 건이 차지한 용량이 다음 건의 서버 재검증에 반영된다.
     * @returns {{ succeededIds: number[], failures: { orderId:number, orderNo:string, message:string }[]}}
     */
    async confirmBulk(items) {
      const succeededIds = [];
      const failures = [];
      for (const item of items) {
        try {
          await dispatchApi.confirmDispatch(item.orderId, item.vehicleId);
          succeededIds.push(item.orderId);
        } catch (error) {
          failures.push({ orderId: item.orderId, orderNo: item.orderNo, message: error.message });
        }
      }
      this.removeRecommendations(succeededIds); // 확정된 건은 추천 목록에서 제거
      return { succeededIds, failures };
    },

    /** 추천 목록에서 특정 주문들을 제거한다. */
    removeRecommendations(orderIds) {
      this.recommendations = this.recommendations.filter((r) => !orderIds.includes(r.orderId));
    },

    /**
     * 추천 목록을 초기화한다. (확정 처리 후, 또는 화면을 벗어날 때)
     */
    clearRecommendations() {
      this.recommendations = [];
      this.unassignedOrderIds = [];
    }
  },
});
