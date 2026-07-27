import client from './client';

/**
 * 배차(Dispatch) 관련 API 호출 모듈.
 * API 명세서 3장 "배차(Dispatch)"의 엔드포인트와 1:1로 대응된다.
 */
export const dispatchApi = {
  /** POST /api/dispatches - 배차 확정 */
  confirmDispatch: (orderId, vehicleId) =>
    client.post('/dispatches', { orderId, vehicleId }),

  /** PATCH /api/dispatches/{dispatchId}/cancel - 배차 취소 */
  cancelDispatch: (dispatchId) =>
    client.patch(`/dispatches/${dispatchId}/cancel`),

  /** GET /api/dispatches?status=&vehicleId= - 배차 목록 조회 */
  getDispatches: (params) => client.get('/dispatches', { params }),
};
