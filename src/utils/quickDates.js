// 일시 "빠른 선택" 칩 계산 유틸. 값은 el-date-picker의 value-format(YYYY-MM-DDTHH:mm:ss)과 같은 문자열이다.

const pad = (n) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DDTHH:mm:ss' (로컬 시간 기준. toISOString()은 UTC로 바뀌어 쓰면 안 된다) */
export function toLocalIso(date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/** 'YYYY-MM-DDTHH:mm:ss'(오프셋 없음) -> Date. 오프셋이 없으면 로컬 시간으로 해석된다. */
export function fromLocalIso(value) {
  return new Date(value);
}

/** 기준 날짜(day)에서 offsetDays일 뒤의 hour시 정각 */
function at(base, offsetDays, hour) {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** 상차 희망일시 칩: 오늘(다음 정시) / 내일 09:00 / 모레 09:00 */
export function pickupQuickOptions(now = new Date()) {
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return [
    { label: '오늘', value: toLocalIso(nextHour), disabled: false },
    { label: '내일 09:00', value: toLocalIso(at(now, 1, 9)), disabled: false },
    { label: '모레 09:00', value: toLocalIso(at(now, 2, 9)), disabled: false },
  ];
}

/**
 * 도착 희망일시 칩: 상차 +4시간 / 당일 18:00 / 다음날 09:00
 * 상차일시가 있으면 그 날짜를 기준으로, 없으면 오늘을 기준으로 계산한다.
 * 상차일시보다 이르거나 같아지는 칩, 그리고 기준이 필요한 "상차 +4시간"(상차일시 없음)은 비활성화한다.
 */
export function deliveryQuickOptions(pickupValue, now = new Date()) {
  const pickup = pickupValue ? fromLocalIso(pickupValue) : null;
  const base = pickup ?? now;

  const plus4h = pickup ? new Date(pickup.getTime() + 4 * 60 * 60 * 1000) : null;
  const sameDay18 = at(base, 0, 18);
  const nextDay09 = at(base, 1, 9);

  const notAfterPickup = (d) => (pickup ? d.getTime() <= pickup.getTime() : false);

  return [
    { label: '상차 +4시간', value: plus4h ? toLocalIso(plus4h) : '', disabled: !plus4h },
    { label: '당일 18:00', value: toLocalIso(sameDay18), disabled: notAfterPickup(sameDay18) },
    { label: '다음날 09:00', value: toLocalIso(nextDay09), disabled: false },
  ];
}
