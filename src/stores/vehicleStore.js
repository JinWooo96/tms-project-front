import { defineStore } from 'pinia';
import { vehicleApi } from '@/api/vehicleApi';

/**
 * 차량 관련 상태를 관리하는 스토어.
 * 배차 화면에서 "선택한 주문에 대해 배차 가능한 차량 목록"을 공유하기 위해 사용한다.
 */
export const useVehicleStore = defineStore('vehicle', {
  state: () => ({
    availableVehicles: [],
    loading: false,
  }),

  actions: {
    /** 특정 주문(orderId) 기준으로 배차 가능한 차량 목록을 조회한다. */
    async fetchAvailableVehicles(orderId) {
      this.loading = true;
      try {
        this.availableVehicles = await vehicleApi.getAvailableVehicles(orderId);
      } finally {
        this.loading = false;
      }
    },

    /** 화면을 벗어나거나 주문 선택이 바뀌었을 때 목록을 초기화한다. */
    clearAvailableVehicles() {
      this.availableVehicles = [];
    },
  },
});
