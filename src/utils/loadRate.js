//  주문 1건이 차량 1대를 얼마나 차지하는지 (적재율) 계산하는 유틸. 서버 재검증과 별개로 화면 표시용이다.

const num = (v) => Number(v ?? 0);

/* 적재함 부피 = 가로 x 세로 x 높이(cm) / 1,000,000 */
export function bedVolumeM3(vehicle) {
    return (num(vehicle.bedWidthCm) * num(vehicle.bedLengthCm) * num(vehicle.bedHeightCm)) / 1_000_000;
}

/** 적재율 구간 라벨 (el-tag type과 함께 사용) */
export const FIT = {
    OVER: { label: '초과', type: 'danger' },
    GOOD: { label: '적정', type: 'success' },
    ROOMY: { label: '여유', type: 'info' },
    WASTE: { label: '과다 여유', type: 'warning' },
};

/** 중량/부피 중 더 높은 적재율을 기준으로 구간을 판정한다. */
export function fitOf(maxPct) {
    if (maxPct > 100) return FIT.OVER;
    if (maxPct >= 50) return FIT.GOOD;
    if (maxPct >= 15) return FIT.ROOMY;
    return FIT.WASTE;
}

/**
 * 주문(order)을 차량(vehicle)에 실었을 때의 적재율을 계산한다.
 * order: { totalWeightKg, totalVolumeM3 }  /  vehicle: { maxWeightKg, bedWidthCm, bedLengthCm, bedHeightCm }
 */
export function calcLoadRate(order, vehicle) {
    const maxWeight = num(vehicle.maxWeightKg);
    const bedVolume = bedVolumeM3(vehicle);
    const weightPct = maxWeight > 0 ? Math.round((num(order.totalWeightKg) / maxWeight) * 100) : 0;
    const volumePct = bedVolume > 0 ? Math.round((num(order.totalVolumeM3) / bedVolume) * 100) : 0;
    return { weightPct, volumePct, maxPct: Math.max(weightPct, volumePct), fit: fitOf(Math.max(weightPct, volumePct)) };
}