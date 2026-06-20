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

// 게임 시작 시 발판 여러 개 깔기. 반환: 가장 높이(작은 y) 생성된 발판 y
export function initialPlatforms(k) {
  makePlatform(k, TUNING.width / 2, 60); // 시작 발판(졸라맨 바로 아래)
  let y = 60;
  for (let i = 0; i < 12; i++) {
    y -= randGap(k);
    const x = randX(k);
    makePlatform(k, x, y);
    maybeSpawnItem(k, x, y);
  }
  return y;
}

// 카메라가 올라가면 화면 위쪽으로 발판을 계속 생성. 반환: 갱신된 topY
export function ensurePlatformsAbove(k, topY, camY) {
  const ceiling = camY - TUNING.height; // 화면 위 한 칸 더 미리 만들어 둠
  while (topY > ceiling) {
    topY -= randGap(k);
    const x = randX(k);
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
function randX(k) {
  return k.rand(TUNING.platformWidth / 2, TUNING.width - TUNING.platformWidth / 2);
}
