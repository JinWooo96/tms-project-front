// 화물 한 줄(규격 + 개수) 계산 유틸. 백엔드 Cargo.totalWeight()/totalVolume()과 같은 개념이다.

const has = (n) => n !== null && n !== undefined && n !== '' && n > 0;

export function hasDimensions(cargo) {
  return has(cargo.widthCm) && has(cargo.lengthCm) && has(cargo.heightCm);
}

export function hasWeight(cargo) {
  return has(cargo.weightKg);
}

export function hasQuantity(cargo) {
  return has(cargo.quantity);
}

/** 규격/중량/개수가 모두 올바르게 입력됐는지 */
export function isCargoValid(cargo) {
  return hasDimensions(cargo) && hasWeight(cargo) && hasQuantity(cargo);
}

/** 이 줄의 총부피(㎥). 규격이나 개수가 비어 있으면 0 */
export function cargoVolumeM3(cargo) {
  if (!hasDimensions(cargo) || !hasQuantity(cargo)) return 0;
  return (cargo.widthCm * cargo.lengthCm * cargo.heightCm * cargo.quantity) / 1_000_000;
}

/** 이 줄의 총중량(kg). 중량이나 개수가 비어 있으면 0 (중량 = 1개당 중량 x 개수) */
export function cargoWeightKg(cargo) {
  if (!hasWeight(cargo) || !hasQuantity(cargo)) return 0;
  return cargo.weightKg * cargo.quantity;
}

/** 화물 목록 전체 합계. 입력이 덜 된 줄은 해당 항목만 제외하고 합산한다. */
export function summarizeCargo(list) {
  return list.reduce(
    (acc, cargo) => {
      acc.totalQuantity += hasQuantity(cargo) ? cargo.quantity : 0;
      acc.totalWeightKg += cargoWeightKg(cargo);
      acc.totalVolumeM3 += cargoVolumeM3(cargo);
      if (!hasWeight(cargo)) acc.missingWeightCount += 1;
      if (!hasDimensions(cargo) || !hasQuantity(cargo)) acc.missingSpecCount += 1;
      return acc;
    },
    { totalQuantity: 0, totalWeightKg: 0, totalVolumeM3: 0, missingWeightCount: 0, missingSpecCount: 0 },
  );
}

/** 화면 표시용 숫자 포맷 (소수점 최대 2자리, 천 단위 구분) */
export function formatNumber(value, maxFractionDigits = 2) {
  return Number(value).toLocaleString('ko-KR', { maximumFractionDigits: maxFractionDigits });
}
