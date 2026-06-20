// 졸라맨: 자동 점프 + 좌우 이동 + 화면 양옆 순환.
// 물리는 tuning.js 숫자로만 굴러간다(매직넘버 없음).
import { TUNING } from "../config/tuning.js";
import { drawPlayerComp } from "./draw.js";
import { playJump } from "./audio.js";

// 졸라맨 생성. pos는 중심 기준(충돌 계산도 중심 기준). character로 머리색 결정.
export function makePlayer(k, x, y, character) {
  return k.add([
    k.pos(x, y),
    drawPlayerComp(k),
    {
      vy: 0,            // 세로 속도(+면 하강)
      prevY: y,         // 직전 프레임 y (one-way 착지 판정용)
      lastPlatY: y,     // 마지막으로 밟은 발판 y (추락 거리 계산용)
      hurtT: 0,         // 아야! 찌그러짐 애니메이션 남은 시간
      rocketOn: false,  // 로켓 효과 중이면 발밑에 불꽃
      skyDark: 0,       // 0(낮)~1(밤). 밤엔 졸라맨을 밝게 그려 보이게 한다
      hairCol: character ? character.hair : null, // 캐릭터 머리색
      w: TUNING.playerWidth,
      h: TUNING.playerHeight,
    },
    "player",
  ]);
}

// 매 프레임: 좌우 입력 → 중력 → 양옆 벽(순환 없음)
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

  // 양옆은 벽: 화면 밖으로 못 나간다(순간이동 없음).
  const half = p.w / 2;
  p.pos.x = Math.max(half, Math.min(TUNING.width - half, p.pos.x));

  // 아야! 애니메이션 시간 감소
  if (p.hurtT > 0) p.hurtT -= dt;
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
    p.lastPlatY = plat.pos.y;    // 추락 거리 계산용
    jump(p, state, plat.jumpMul || 1);
    if (plat.breakable) k.destroy(plat); // 구름: 한 번 밟으면 사라짐
  }
}

// 자동 점프: 아이템(날개)·발판 종류(트램펄린 등)에 따라 더 높이 뛴다.
export function jump(p, state, platMul = 1) {
  p.vy = -TUNING.jumpVel * state.jumpMultiplier * platMul;
  playJump();
}
