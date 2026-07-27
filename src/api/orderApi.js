import client from './client';

/**
 * 운송주문(Order) 관련 API 호출 모듈.
 * API 명세서 1장 "운송주문(Transport Order)"의 엔드포인트와 1:1로 대응된다.
 */
export const orderApi = {
  /** POST /api/orders - 운송주문 등록 */
  createOrder: (payload) => client.post('/orders', payload),

  /** GET /api/orders - 운송주문 목록 조회 (status, page, size 필터) */
  getOrders: (params) => client.get('/orders', { params }),

  /** GET /api/orders/{orderId} - 운송주문 상세 조회 */
  getOrder: (orderId) => client.get(`/orders/${orderId}`),
};
