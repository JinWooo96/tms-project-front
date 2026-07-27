import { defineStore } from 'pinia';
import { dispatchApi } from '@/api/dispatchApi';

/**
 * 배차 관련 상태를 관리하는 스토어.
 */
export const useDispatchStore = defineStore('dispatch', {
  state: () => ({
    dispatches: [],
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
  },
});
