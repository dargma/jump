// 발판: 무한 절차생성 + 화면 밖 정리.
// ★ "발판에는 타입이 있다"는 전제로 구조를 잡는다(지금은 normal만 실제 구현).
import { TUNING } from "../config/tuning.js";
import { drawPlatformComp } from "./draw.js";
import { maybeSpawnItem, cleanupItemsBelow } from "./item.js";

// 발판 타입 정의. 나중에 여기에 moving/breakable 추가.
export const PLATFORM_TYPES = {
  normal: "normal",
  // moving:    좌우로 움직이는 발판 (다음 단계) — ptype으로 분기해 update에서 흔들기
  // breakable: 한 번 밟으면 부서지는 발판 (다음 단계) — 착지 시 destroy
};

// 발판 하나 생성. ptype 필드를 들고 다녀서 타입별 동작을 나중에 붙이기 쉽다.
export function makePlatform(k, x, y, type = PLATFORM_TYPES.normal) {
  return k.add([
    k.pos(x, y),
    drawPlatformComp(k, type),
    { ptype: type },
    "platform",
  ]);
}

// 다음 발판 X는 이전 발판 근처에서만 생성 → 사다리처럼 이어져 올라가기 쉽다.
let lastX = TUNING.width / 2;

// 게임 시작 시 발판 여러 개 깔기. 반환: 가장 높이(작은 y) 생성된 발판 y
export function initialPlatforms(k) {
  lastX = TUNING.width / 2;            // 다시하기마다 초기화
  makePlatform(k, lastX, 60);          // 시작 발판(졸라맨 바로 아래)
  let y = 60;
  for (let i = 0; i < 12; i++) {
    y -= randGap(k);
    const x = nextX(k);
    makePlatform(k, x, y);
    maybeSpawnItem(k, x, y);
  }
  return y;
}

// 카메라가 올라가면 화면 위쪽으로 발판을 계속 생성. 반환: 갱신된 topY
// goalY 위쪽(공주 받침대 위)으로는 일반 발판을 만들지 않는다.
export function ensurePlatformsAbove(k, topY, camY, goalY) {
  const ceiling = camY - TUNING.height; // 화면 위 한 칸 더 미리 만들어 둠
  while (topY > ceiling) {
    const ny = topY - randGap(k);
    if (goalY != null && ny <= goalY) break; // 공주 위로는 생성 금지
    topY = ny;
    const x = nextX(k);
    makePlatform(k, x, topY);
    maybeSpawnItem(k, x, topY);
  }
  return topY;
}

// 화면 아래로 사라진 발판/아이템 제거(성능).
export function cleanupBelow(k, camY) {
  const floor = camY + TUNING.height; // 화면 아래 한 칸
  k.get("platform").forEach((p) => {
    if (p.pos.y > floor) k.destroy(p);
  });
  cleanupItemsBelow(k, floor);
}

function randGap(k) {
  return k.rand(TUNING.platformGapMin, TUNING.platformGapMax);
}

// 이전 발판 X에서 platformMaxStepX 안쪽으로만 다음 X를 정한다(닿을 수 있게).
function nextX(k) {
  const half = TUNING.platformWidth / 2;
  const step = TUNING.platformMaxStepX;
  let x = lastX + k.rand(-step, step);
  x = Math.max(half, Math.min(TUNING.width - half, x)); // 화면 안으로 제한
  lastX = x;
  return x;
}
