// 화물 규격 빠른 입력용 프리셋. 규격(cm)만 채우고 중량/개수/유형은 사용자가 직접 입력한다.
// 자주 쓰는 규격이 바뀌면 이 배열만 수정하면 된다.
export const CARGO_PRESETS = [
  { key: 'PALLET', label: '표준 파레트', widthCm: 110, lengthCm: 110, heightCm: 150 },
  { key: 'BOX_S', label: '소형 박스', widthCm: 40, lengthCm: 30, heightCm: 30 },
  { key: 'BOX_L', label: '대형 박스', widthCm: 60, lengthCm: 40, heightCm: 40 },
];
