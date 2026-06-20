// 졸라맨: 자동 점프 + 좌우 이동 + 화면 양옆 순환.
// 물리는 tuning.js 숫자로만 굴러간다(매직넘버 없음).
import { TUNING } from "../config/tuning.js";
import { drawPlayerComp } from "./draw.js";

// 졸라맨 생성. pos는 중심 기준(충돌 계산도 중심 기준).
export function makePlayer(k, x, y) {
  return k.add([
    k.pos(x, y),
    drawPlayerComp(k),
    {
      vy: 0,            // 세로 속도(+면 하강)
      prevY: y,         // 직전 프레임 y (one-way 착지 판정용)
      w: TUNING.playerWidth,
      h: TUNING.playerHeight,
    },
    "player",
  ]);
}

// 매 프레임: 좌우 입력 → 중력 → 양옆 순환
export function updatePlayer(k, p, dt) {
  p.prevY = p.pos.y;

  // 좌우 이동(화살표 또는 A/D)
  let dir = 0;
  if (k.isKeyDown("left") || k.isKeyDown("a")) dir -= 1;
  if (k.isKeyDown("right") || k.isKeyDown("d")) dir += 1;
  p.pos.x += dir * TUNING.moveSpeed * dt;

  // 중력 적용
  p.vy += TUNING.gravity * dt;
  p.pos.y += p.vy * dt;

  // 화면 양옆 순환(왼쪽으로 나가면 오른쪽에서 등장)
  if (p.pos.x < 0) p.pos.x += TUNING.width;
  if (p.pos.x > TUNING.width) p.pos.x -= TUNING.width;
}

// 발판 위에 떨어질 때만 착지 → 자동 점프(one-way: 올라갈 땐 통과).
export function tryLand(k, p, plat, state) {
  if (p.vy <= 0) return; // 상승 중엔 발판 통과

  const platTop = plat.pos.y - TUNING.platformHeight / 2;
  const feetPrev = p.prevY + p.h / 2;
  const feetNow = p.pos.y + p.h / 2;

  // 직전엔 발판 위, 이번엔 발판 선을 넘어 내려옴 = 착지 순간
  const crossed = feetPrev <= platTop && feetNow >= platTop;
  const inX = Math.abs(p.pos.x - plat.pos.x) <= TUNING.platformWidth / 2;

  if (crossed && inX) {
    p.pos.y = platTop - p.h / 2; // 발판 위에 살짝 얹기
    jump(p, state);
  }
}

// 자동 점프: 아이템(날개)이 켜져 있으면 jumpMultiplier만큼 더 높이.
export function jump(p, state) {
  p.vy = -TUNING.jumpVel * state.jumpMultiplier;
}
