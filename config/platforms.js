// ★ 발판 종류 = 데이터. 새 발판은 여기에 객체 하나 추가하면 끝.
//   weight    : 등장 가중치(클수록 자주)
//   jumpMul   : 밟았을 때 점프 세기 배수(트램펄린은 크게)
//   breakable : true면 한 번 밟으면 사라짐
//   moveSpeed : 0보다 크면 좌우로 왕복(px/s)
//   hard      : true면 "어려운 발판" → 초반(낮은 높이)엔 안 나오고 위로 갈수록 등장
export const PLATFORM_TYPES = [
  { id: "normal", name: "일반",   color: [95, 185, 95],   weight: 64, jumpMul: 1.0 },
  { id: "spring", name: "트램펄린", color: [250, 165, 55],  weight: 14, jumpMul: 1.9 }, // 콩! 높이 튕김
  { id: "cloud",  name: "구름",   color: [225, 235, 250], weight: 12, jumpMul: 1.0, breakable: true, hard: true }, // 한 번 밟으면 사라짐
  { id: "mover",  name: "움직이는", color: [150, 130, 230], weight: 10, jumpMul: 1.0, moveSpeed: 55, hard: true },  // 좌우 왕복
];

export const NORMAL_TYPE = PLATFORM_TYPES[0];
