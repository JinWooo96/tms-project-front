/**
 * 백엔드 Enum 값과 정확히 일치해야 하는 상수 정의.
 * 백엔드 OrderStatus, DispatchStatus, VehicleStatus, CargoType이 바뀌면 이 파일도 함께 수정한다.
 */

export const ORDER_STATUS = {
  RECEIVED: { label: '접수', type: 'info' },
  DISPATCHED: { label: '배차완료', type: 'warning' },
  IN_TRANSIT: { label: '운송중', type: 'primary' },
  COMPLETED: { label: '완료', type: 'success' },
};

export const DISPATCH_STATUS = {
  PENDING: { label: '배차대기', type: 'info' },
  CONFIRMED: { label: '배차확정', type: 'success' },
  CANCELLED: { label: '배차취소', type: 'danger' },
};

export const VEHICLE_STATUS = {
  AVAILABLE: { label: '운행가능', type: 'success' },
  ASSIGNED: { label: '배차중', type: 'warning' },
  MAINTENANCE: { label: '정비중', type: 'danger' },
};

export const CARGO_TYPE = {
  GENERAL: { label: '일반' },
  FROZEN: { label: '냉동' },
  DANGEROUS: { label: '위험물' },
};
