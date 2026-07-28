import client from './client';

/**
 * 차량(Vehicle) 관련 API 호출 모듈.
 * API 명세서 2장 "차량(Vehicle)"의 엔드포인트와 1:1로 대응된다.
 */
export const vehicleApi = {
  /** POST /api/vehicles - 차량 등록 */
  createVehicle: (payload) => client.post('/vehicles', payload),

  /** GET /api/vehicles/available?orderId= - 배차 가능 차량 조회 */
  getAvailableVehicles: (orderId) =>
      client.get('/vehicles/available', { params: { orderId } }),

  /** GET /api/vehicles?status= - 차량 전체 조회 (관리용) */
  getVehicles: (params) => client.get('/vehicles', { params }),
};