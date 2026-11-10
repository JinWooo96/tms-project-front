// 차량유형(톤수) 프리셋. value는 서버에 저장되는 문자열, label은 화면 표시용이다.
// (백엔드 vehicleType은 Enum이 아니라 자유 문자열이므로, 목록에 없는 값은 "직접 입력"으로 등록할 수 있다.)
export const VEHICLE_TYPES = [
    { value: '1TON', label: '1톤' },
    { value: '2_5TON', label: '2.5톤' },
    { value: '3_5TON', label: '3.5톤' },
    { value: '5TON', label: '5톤' },
    { value: '11TON', label: '11톤' },
];

/** 서버 값(예: '2_5TON')을 화면 표시용(예: '2.5톤')으로 바꾼다. 목록에 없으면 값 그대로 보여준다. */
export function formatVehicleType(value) {
    return VEHICLE_TYPES.find((t) => t.value === value)?.label ?? value;
}