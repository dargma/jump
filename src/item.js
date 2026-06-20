// 아이템: 발판 위 스폰 + 졸라맨과 충돌 시 효과 발동.
// 데이터는 config/items.js, 여기는 "효과 로직"만.
import { TUNING } from "../config/tuning.js";
import { ITEMS } from "../config/items.js";
import { drawItemComp, drawCoinComp } from "./draw.js";

// 발판 위에 확률적으로 아이템 1개 스폰(한 발판에 최대 1개).
export function maybeSpawnItem(k, x, platY) {
  for (const def of ITEMS) {
    if (def.spawnChance > 0 && k.rand() < def.spawnChance) {
      spawnItem(k, x, platY - 22, def); // 발판 살짝 위에
      return;
    }
  }
}

function spawnItem(k, x, y, def) {
  return k.add([
    k.pos(x, y),
    drawItemComp(k, def),
    { def, w: 26, h: 26 },
    "item",
  ]);
}

// 발판 위에 코인(점수 보너스) 스폰. 아이템과 겹치지 않게 살짝 옆으로.
export function maybeSpawnCoin(k, x, platY) {
  if (k.rand() >= TUNING.coinChance) return;
  const cx = Math.max(16, Math.min(TUNING.width - 16, x + k.rand(-20, 20)));
  k.add([
    k.pos(cx, platY - 24),
    drawCoinComp(k),
    { w: 20, h: 20 },
    "coin",
  ]);
}

// 졸라맨 ↔ 아이템 AABB 충돌(중심 기준).
export function collideItem(player, it) {
  return (
    Math.abs(player.pos.x - it.pos.x) < (player.w + it.w) / 2 &&
    Math.abs(player.pos.y - it.pos.y) < (player.h + it.h) / 2
  );
}

// 효과 발동: type으로 분기. timed=지속, instant=즉시 1회.
export function applyEffect(k, state, player, def) {
  if (def.type === "timed") startTimed(state, def);
  else if (def.type === "instant") runInstant(k, state, player, def);
}

// --- timed(지속형) ---
function startTimed(state, def) {
  state.activeItem = { def, timeLeft: def.duration };
  if (def.id === "wing") state.jumpMultiplier = def.jumpMultiplier; // 날개: 점프 더 높이
  if (def.id === "rocket") state.rocketSpeed = def.climbSpeed;      // 로켓: 위로 슈웅
  // booster: 점프 빈도 증가 (다음 단계)
}

// 매 프레임 효과 시간 감소, 끝나면 효과 OFF.
export function tickEffect(state, dt) {
  if (!state.activeItem) return;
  state.activeItem.timeLeft -= dt;
  if (state.activeItem.timeLeft <= 0) {
    state.jumpMultiplier = 1; // 효과 해제(원래대로)
    state.rocketSpeed = 0;
    state.activeItem = null;
  }
}

// --- instant(즉발형) ---
function runInstant(k, state, player, def) {
  // hook(갈고리): 위쪽 가장 가까운 발판으로 휙 당겨감 (다음 단계)
  //   - k.get("platform") 중 player보다 위(y가 작은)에서 가장 가까운 발판을 찾아
  //   - player.pos 를 그 발판 위로 옮기고 점프시킨다.
}

// 화면 아래로 내려간 수집물(아이템·코인) 제거.
export function cleanupCollectiblesBelow(k, floorY) {
  k.get("item").forEach((it) => {
    if (it.pos.y > floorY) k.destroy(it);
  });
  k.get("coin").forEach((c) => {
    if (c.pos.y > floorY) k.destroy(c);
  });
}
