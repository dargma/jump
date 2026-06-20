// ★ 아이템 정의 = 데이터.
// 새 아이템 추가: 여기에 객체 하나 추가 → src/item.js 의 효과 분기 한 줄 추가. 끝.
//
// type 필드(스키마 핵심):
//   "timed"   : duration(초) 동안 효과가 지속된다 (날개, 부스터)
//   "instant" : 즉시 1회 발동, 지속시간 없음 (갈고리)
// → 이렇게 나눠두면 갈고리(instant)를 켜도 timed 스키마(duration)가 안 깨진다.
export const ITEMS = [
  {
    id: "wing",
    name: "날개",
    type: "timed",
    duration: 5,         // 효과 지속(초)
    spawnChance: 0.2,    // 발판마다 등장 확률(0~1)
    color: [120, 200, 255],
    desc: "일정 시간 점프가 높아짐",
    jumpMultiplier: 1.6, // 점프 속도 배수(높이는 약 2.5배). 너무 크면 발판 놓쳐 떨어짐
  },
  {
    id: "booster",
    name: "부스터",
    type: "timed",
    duration: 4,
    spawnChance: 0,      // 0 = 아직 등장 안 함(다음 단계에서 켠다)
    color: [255, 180, 80],
    desc: "일정 시간 점프가 더 자주/통통 (점프 빈도 증가)",
    // 동작(예정): 착지 타이밍과 무관하게 더 자주 튀어오르도록 점프 주기를 줄인다.
  },
  {
    id: "hook",
    name: "갈고리",
    type: "instant",     // 즉시 발동(조준 없음)
    spawnChance: 0,      // 0 = 아직 등장 안 함(다음 단계에서 켠다)
    color: [200, 120, 255],
    desc: "위쪽 가장 가까운 발판으로 자동으로 휙 당겨감 (조준 없음)",
    // 동작(예정): 현재 위치 위쪽에서 제일 가까운 발판을 찾아 즉시 그 위로 당겨 이동시킨다.
  },
];
