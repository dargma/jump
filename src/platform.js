// 발판: 종류별(일반/트램펄린/구름/움직이는) 무한 절차생성 + 난이도 완만 + 화면 밖 정리.
import { TUNING } from "../config/tuning.js";
import { drawPlatformComp } from "./draw.js";
import { maybeSpawnItem, maybeSpawnCoin, cleanupCollectiblesBelow } from "./item.js";
import { PLATFORM_TYPES, NORMAL_TYPE } from "../config/platforms.js";

// 발판 하나 생성. 종류(def)에 따라 점프세기/부서짐/이동 특성을 갖는다.
export function makePlatform(k, x, y, def = NORMAL_TYPE) {
  const p = k.add([
    k.pos(x, y),
    drawPlatformComp(k, def),
    {
      ptype: def.id,
      jumpMul: def.jumpMul || 1,
      breakable: !!def.breakable,
      baseX: x,
      moveSpeed: def.moveSpeed || 0,
      moveDir: k.rand() < 0.5 ? -1 : 1,
      moveRange: 70,
    },
    "platform",
  ]);
  // 움직이는 발판: 좌우로 왕복(화면 안 유지)
  if (p.moveSpeed > 0) {
    p.onUpdate(() => {
      p.pos.x += p.moveSpeed * p.moveDir * k.dt();
      if (p.pos.x > p.baseX + p.moveRange || p.pos.x < p.baseX - p.moveRange) p.moveDir *= -1;
      const half = TUNING.platformWidth / 2;
      p.pos.x = Math.max(half, Math.min(TUNING.width - half, p.pos.x));
    });
  }
  return p;
}

// 다음 발판 X는 이전 발판 근처에서만 → 사다리처럼 이어져 올라가기 쉽다.
let lastX = TUNING.width / 2;

// 게임 시작 발판들. 반환: 가장 높이 생성된 발판 y
export function initialPlatforms(k) {
  lastX = TUNING.width / 2;
  makePlatform(k, lastX, 60); // 시작 발판은 항상 일반(안전)
  let y = 60;
  for (let i = 0; i < 12; i++) {
    y -= gapFor(k, y);
    const x = nextX(k);
    makePlatform(k, x, y, pickType(k, y));
    maybeSpawnItem(k, x, y);
    maybeSpawnCoin(k, x, y);
  }
  return y;
}

// 위쪽으로 발판을 계속 생성. goalY 위(공주 받침대 위)로는 안 만든다.
export function ensurePlatformsAbove(k, topY, camY, goalY) {
  const ceiling = camY - TUNING.height;
  while (topY > ceiling) {
    const ny = topY - gapFor(k, topY);
    if (goalY != null && ny <= goalY) break;
    topY = ny;
    const x = nextX(k);
    makePlatform(k, x, topY, pickType(k, topY));
    maybeSpawnItem(k, x, topY);
    maybeSpawnCoin(k, x, topY);
  }
  return topY;
}

// 화면 아래로 사라진 발판/수집물 제거.
export function cleanupBelow(k, camY) {
  const floor = camY + TUNING.height;
  k.get("platform").forEach((p) => {
    if (p.pos.y > floor) k.destroy(p);
  });
  cleanupCollectiblesBelow(k, floor);
}

// 0(시작)~1(rampDist 이상) 난이도. 위로 갈수록 1에 가까워진다.
function difficulty(y) {
  return Math.max(0, Math.min(1, -y / TUNING.rampDist));
}

// 발판 세로 간격: 초반엔 좁고(gapStartMax) 위로 갈수록 platformGapMax까지 벌어짐.
function gapFor(k, y) {
  const d = difficulty(y);
  const maxGap = TUNING.gapStartMax + (TUNING.platformGapMax - TUNING.gapStartMax) * d;
  return k.rand(TUNING.platformGapMin, maxGap);
}

// 발판 종류 가중 추첨. "어려운(hard)" 종류는 난이도(d)에 비례해 점점 자주 나온다.
function pickType(k, y) {
  const d = difficulty(y);
  const weights = PLATFORM_TYPES.map((t) => (t.hard ? t.weight * d : t.weight));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = k.rand(0, total);
  for (let i = 0; i < PLATFORM_TYPES.length; i++) {
    if ((r -= weights[i]) <= 0) return PLATFORM_TYPES[i];
  }
  return NORMAL_TYPE;
}

function nextX(k) {
  const half = TUNING.platformWidth / 2;
  const step = TUNING.platformMaxStepX;
  let x = lastX + k.rand(-step, step);
  x = Math.max(half, Math.min(TUNING.width - half, x));
  lastX = x;
  return x;
}
