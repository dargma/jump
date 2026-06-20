// ★ 아이템 정의 = 데이터.
// 새 아이템 추가: 여기에 객체 하나 추가 → src/item.js 의 효과 분기 한 줄 추가. 끝.
//
// type 필드(스키마 핵심):
//   "timed"   : duration(초) 동안 효과가 지속된다 (날개, 로켓)
//   "instant" : 즉시 1회 발동, 지속시간 없음 (순간이동)
// → 이렇게 나눠두면 instant 아이템을 켜도 timed 스키마(duration)가 안 깨진다.
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
    id: "hook",
    name: "순간이동",
    type: "instant",     // 즉시 발동(조준 없음)
    spawnChance: 0.06,   // 가끔 등장
    color: [200, 120, 255],
    desc: "위쪽 발판으로 순간이동! (조준 없음)",
    teleportUp: 280,     // 위로 이만큼(px) 근처 발판으로 순간이동
  },
  {
    id: "rocket",
    name: "로켓",
    type: "timed",
    duration: 2.2,       // 슈웅 올라가는 시간(초)
    spawnChance: 0.05,   // 가끔 등장(귀한 아이템)
    color: [255, 120, 90],
    desc: "잠깐 로켓처럼 위로 슈웅 날아오른다",
    climbSpeed: 920,     // 로켓 상승 속도(px/s)
  },
  {
    id: "parachute",
    name: "낙하산",
    type: "timed",
    duration: 6,         // 펼쳐져 있는 시간(초)
    spawnChance: 0.06,   // 가끔 등장
    color: [90, 200, 200],
    desc: "잠깐 천천히 사뿐히 내려온다(안 다침)",
    fallSpeed: 110,      // 낙하산 펼친 동안 최대 하강 속도(px/s). 작을수록 더 천천히
  },
];
