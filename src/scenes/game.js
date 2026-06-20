// 게임 플레이 씬: 물리, 카메라, 점수, 발판, 3스테이지(테마·스토리·보상), 체력, 공주 승리.
import { TUNING } from "../../config/tuning.js";
import { STAGES, STORY } from "../../config/stages.js";
import { ITEMS } from "../../config/items.js";
import { CHARACTERS, selected } from "../../config/characters.js";
import { makePlayer, updatePlayer, tryLand } from "../player.js";
import { initialPlatforms, ensurePlatformsAbove, cleanupBelow, makePlatform } from "../platform.js";
import { drawPrincessComp, drawCloudComp, drawBirdComp, drawHeartComp } from "../draw.js";
import { collideItem, applyEffect, tickEffect } from "../item.js";
import { ensureAudio, startBGM, stopBGM, playItem, playOuch, playGameOver } from "../audio.js";

const FONT = "kr";
const BEST_KEY = "doodle-prince-best";
const GOAL_HALF = 80;

export function registerGameScene(k) {
  k.scene("game", () => {
    const state = { jumpMultiplier: 1, activeItem: null, inventory: [], rocketSpeed: 0 };

    const sky = makeSky(k);
    spawnSky(k);

    const character = CHARACTERS[selected.index] || CHARACTERS[0];
    const player = makePlayer(k, TUNING.width / 2, 0, character);
    let topY = initialPlatforms(k);

    // 공주는 3개 스테이지를 모두 오른 높이에 있다.
    const goalScore = STAGES.reduce((s, st) => s + st.climb, 0);
    const goalY = -(goalScore * TUNING.pxPerScore);
    let goalSpawned = false;
    let won = false;

    let highestY = 0;
    let camY = 0;
    let score = 0;
    let coinBonus = 0;
    let health = TUNING.maxHealth;
    let stageIndex = 0;
    let stageBase = 0; // 현재 스테이지가 시작된 점수

    const best = Number(localStorage.getItem(BEST_KEY) || 0);

    // HUD
    const scoreLabel = k.add([k.text("0", { size: 26, font: FONT }), k.pos(14, 12), k.fixed()]);
    const stageLabel = k.add([k.text("", { size: 16, font: FONT }), k.pos(TUNING.width / 2, 14), k.anchor("top"), k.fixed()]);
    const itemLabel = k.add([k.text("", { size: 18, font: FONT }), k.pos(14, 46), k.fixed()]);
    const invLabel = k.add([k.text("", { size: 16, font: FONT }), k.pos(14, 72), k.fixed()]);
    const bestLabel = k.add([k.text("최고 " + best, { size: 16, font: FONT }), k.pos(TUNING.width - 14, 78), k.anchor("topright"), k.fixed()]);
    const hearts = makeHearts(k);

    // 시작 이야기
    banner(k, STORY.intro, 150, 3.0);

    // 첫 입력 때 오디오 깨우기 + 배경음악
    let bgmOn = false;
    const wake = () => { ensureAudio(); if (!bgmOn) { startBGM(); bgmOn = true; } };
    k.onKeyPress(wake);
    k.onMousePress(wake);

    // 아이템 사용(스페이스 또는 위 화살표)
    const useItem = () => {
      if (state.inventory.length === 0) return;
      applyEffect(k, state, player, state.inventory.pop());
      playItem();
    };
    k.onKeyPress("space", useItem);
    k.onKeyPress("up", useItem);

    // 큰 추락 데미지(하트 -1 + 아야!)
    const bigFall = () => {
      health -= 1;
      player.hurtT = 0.3;
      playOuch();
      if (k.shake) k.shake(8);
      burstStars(k, player.pos.x, player.pos.y);
      floatText(k, player.pos.x, player.pos.y, "아야!", k.rgb(220, 70, 70));
      if (health <= 0) {
        stopBGM();
        playGameOver();
        if (score > best) localStorage.setItem(BEST_KEY, String(score));
        k.go("gameover", { score, best: Math.max(best, score), win: false });
      }
    };

    k.onUpdate(() => {
      const dt = k.dt(); // 전체 속도는 main.js의 timeScale로 조절(0.8~0.9)

      // 1) 물리
      updatePlayer(k, player, dt);

      // 2) 착지 + 추락 데미지
      const wasFalling = player.vy > 0;
      const fromPlatY = player.lastPlatY;
      k.get("platform").forEach((p) => tryLand(k, player, p, state));
      if (wasFalling && player.vy < 0 && player.lastPlatY - fromPlatY > TUNING.bigFallDist) bigFall();

      // 3) 항상 받침 보장
      ensureCatch(k, player);

      // 4) 아이템(가방) + 코인(점수)
      k.get("item").forEach((it) => {
        if (collideItem(player, it)) { state.inventory.push(it.def); playItem(); k.destroy(it); }
      });
      k.get("coin").forEach((c) => {
        if (collideItem(player, c)) {
          coinBonus += TUNING.coinValue;
          playItem();
          burstStars(k, c.pos.x, c.pos.y);
          floatText(k, c.pos.x, c.pos.y, "+" + TUNING.coinValue, k.rgb(255, 190, 40));
          k.destroy(c);
        }
      });
      tickEffect(state, dt);

      // 로켓: 위로 슈웅 + 발밑 불꽃
      player.rocketOn = state.rocketSpeed > 0;
      if (player.rocketOn) player.vy = -state.rocketSpeed;

      // 5) 점수
      highestY = Math.min(highestY, player.pos.y);
      score = Math.floor(-highestY / TUNING.pxPerScore) + coinBonus;

      // 6) 스테이지 클리어 → 보상 + 다음 스테이지 이야기
      if (stageIndex < STAGES.length - 1 && score - stageBase >= STAGES[stageIndex].climb) {
        const cleared = STAGES[stageIndex];
        grantReward(state, cleared.reward);
        playItem();
        banner(k, `${cleared.name} 클리어!  ${cleared.rewardText}`, 120, 2.2);
        stageBase += cleared.climb;
        stageIndex += 1;
        banner(k, STAGES[stageIndex].story, 178, 2.6);
      }

      // 7) 배경(스테이지 테마로 부드럽게) + 별. 밤일수록 글자/캐릭터 밝게.
      const dark = updateSky(k, sky, STAGES[stageIndex]);
      player.skyDark = dark;

      // 8) 카메라
      camY = k.lerp(camY, deadzoneCam(player.pos.y, camY), TUNING.cameraFollow);
      camY = clampCam(player.pos.y, camY);
      setCamera(k, TUNING.width / 2, camY);

      // 9) 발판 생성/정리 + 공주 받침대
      if (!goalSpawned) {
        topY = ensurePlatformsAbove(k, topY, camY, goalY);
        if (topY <= goalY + TUNING.platformGapMax + 1) { spawnGoal(k, goalY); goalSpawned = true; }
      }
      cleanupBelow(k, camY);

      // 10) HUD (밤에도 잘 보이게 색을 밝힘)
      const hud = hudColor(k, dark);
      scoreLabel.text = String(score);
      scoreLabel.color = hud;
      stageLabel.text = `${stageIndex + 1}/${STAGES.length}  ${STAGES[stageIndex].name}`;
      stageLabel.color = hud;
      bestLabel.color = hud;
      itemLabel.color = hud;
      itemLabel.text = state.activeItem ? `${state.activeItem.def.name} ${state.activeItem.timeLeft.toFixed(1)}s` : "";
      invLabel.color = hud;
      invLabel.text = invText(state.inventory);
      hearts.forEach((h, i) => (h.filled = i < health));

      // 11) 공주 도달 → 승리
      if (goalSpawned && !won && player.pos.y <= goalY + 10 && Math.abs(player.pos.x - TUNING.width / 2) < GOAL_HALF + 30) {
        won = true;
        stopBGM();
        playItem();
        if (score > best) localStorage.setItem(BEST_KEY, String(score));
        k.go("gameover", { score, best: Math.max(best, score), win: true });
      }
    });
  });
}

// ── 카메라 ──
function deadzoneCam(playerY, camY) {
  const h = TUNING.height;
  const sy = playerY - camY + h / 2;
  if (sy < h * TUNING.cameraTopFrac) return playerY + h / 2 - h * TUNING.cameraTopFrac;
  if (sy > h * TUNING.cameraBotFrac) return playerY + h / 2 - h * TUNING.cameraBotFrac;
  return camY;
}
function clampCam(playerY, camY) {
  const h = TUNING.height;
  const minCam = playerY + h / 2 - h * TUNING.cameraBotFrac;
  const maxCam = playerY + h / 2 - h * TUNING.cameraTopFrac;
  return Math.max(minCam, Math.min(maxCam, camY));
}

// 모든 발판 아래로 떨어지면 졸라맨 바로 아래 받침을 깔아 항상 걸리게 한다.
function ensureCatch(k, player) {
  if (player.vy <= 0) return;
  let lowest = -Infinity;
  for (const p of k.get("platform")) if (p.pos.y > lowest) lowest = p.pos.y;
  if (player.pos.y > lowest + 30) {
    const x = Math.max(TUNING.platformWidth / 2, Math.min(TUNING.width - TUNING.platformWidth / 2, player.pos.x));
    makePlatform(k, x, player.pos.y + 90);
  }
}

// 스테이지 보상을 가방에 넣기
function grantReward(state, reward) {
  if (!reward) return;
  const def = ITEMS.find((d) => d.id === reward.item);
  if (!def) return;
  for (let i = 0; i < reward.n; i++) state.inventory.push(def);
}

function invText(inv) {
  if (!inv.length) return "";
  const counts = {};
  for (const d of inv) counts[d.name] = (counts[d.name] || 0) + 1;
  return "가방: " + Object.keys(counts).map((n) => `${n} x${counts[n]}`).join(", ") + "  (스페이스 사용)";
}

function makeHearts(k) {
  const hearts = [];
  for (let i = 0; i < TUNING.maxHealth; i++) {
    hearts.push(k.add([drawHeartComp(k), k.pos(TUNING.width - 24 - i * 26, 52), k.fixed(), { filled: true }]));
  }
  return hearts;
}

// ── 연출 ──
function burstStars(k, x, y) {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const st = k.add([
      k.circle(3), k.pos(x, y), k.color(255, 210, 80), k.opacity(1), k.anchor("center"),
      { vx: Math.cos(a) * 130, vy: Math.sin(a) * 130 - 30, life: 0.6 },
    ]);
    st.onUpdate(() => {
      const d = k.dt();
      st.life -= d; st.pos.x += st.vx * d; st.pos.y += st.vy * d; st.vy += 320 * d;
      st.opacity = Math.max(0, st.life / 0.6);
      if (st.life <= 0) k.destroy(st);
    });
  }
}

// 위로 떠오르며 사라지는 작은 글자(아야!, +25 등)
function floatText(k, x, y, text, color) {
  const t = k.add([k.text(text, { size: 20, font: FONT }), k.pos(x, y - 16), k.anchor("center"), color, k.opacity(1), { life: 0.75 }]);
  t.onUpdate(() => {
    const d = k.dt();
    t.life -= d; t.pos.y -= 44 * d;
    t.opacity = Math.max(0, t.life / 0.75);
    if (t.life <= 0) k.destroy(t);
  });
}

// 화면 중앙 배너(이야기·스테이지·보상). 분홍색이라 낮·밤 어디서나 잘 보인다.
function banner(k, text, y, dur) {
  const t = k.add([
    k.text(text, { size: 22, font: FONT, width: TUNING.width - 40, align: "center" }),
    k.pos(TUNING.width / 2, y), k.anchor("center"), k.color(255, 100, 150), k.opacity(1), k.fixed(), { life: dur },
  ]);
  t.onUpdate(() => {
    const d = k.dt();
    t.life -= d; t.pos.y -= 8 * d;
    t.opacity = Math.max(0, Math.min(1, t.life));
    if (t.life <= 0) k.destroy(t);
  });
}

// ── 하늘(스테이지 테마로 부드럽게 전환) ──
function makeSky(k) {
  const c = STAGES[0].sky;
  const bg = k.add([k.rect(TUNING.width, TUNING.height), k.pos(0, 0), k.fixed(), k.z(-100), k.color(c[0], c[1], c[2])]);
  const stars = [];
  for (let i = 0; i < 24; i++) {
    stars.push(k.add([
      k.circle(k.rand(1, 2)), k.pos(k.rand(0, TUNING.width), k.rand(0, TUNING.height * 0.8)),
      k.color(255, 255, 255), k.opacity(0), k.fixed(), k.z(-99), { ph: k.rand(0, 6) },
    ]));
  }
  return { bg, stars, r: c[0], g: c[1], b: c[2], dark: STAGES[0].dark };
}

// 매 프레임 현재 스테이지 색/어둠으로 천천히 다가간다. 반환: 현재 어둠(0~1)
function updateSky(k, sky, stage) {
  const f = 0.03; // 작을수록 더 부드럽고 느린 전환
  sky.r = lerpN(sky.r, stage.sky[0], f);
  sky.g = lerpN(sky.g, stage.sky[1], f);
  sky.b = lerpN(sky.b, stage.sky[2], f);
  sky.bg.color = k.rgb(sky.r, sky.g, sky.b);
  sky.dark = lerpN(sky.dark, stage.dark, f);
  for (const s of sky.stars) s.opacity = sky.dark * (0.4 + 0.6 * Math.abs(Math.sin(k.time() * 2 + s.ph)));
  return sky.dark;
}

function hudColor(k, dark) {
  const v = lerpN(40, 245, dark);
  return k.rgb(v, v, Math.min(255, v + 12));
}
function lerpN(a, b, t) { return a + (b - a) * t; }

// 공주 받침대 + 공주
function spawnGoal(k, goalY) {
  k.add([
    k.rect(GOAL_HALF * 2, 16, { radius: 6 }), k.pos(TUNING.width / 2, goalY),
    k.anchor("center"), k.color(170, 135, 95), "platform", "goal", { ptype: "goal" },
  ]);
  k.add([drawPrincessComp(k), k.pos(TUNING.width / 2, goalY - 50)]);
}

// 구름·새 배경(화면 고정, 가로로 흐름)
function spawnSky(k) {
  for (let i = 0; i < 3; i++) {
    const c = k.add([drawCloudComp(k), k.pos(k.rand(0, TUNING.width), 50 + i * 75), k.fixed(), k.z(-10), { spd: k.rand(8, 18) }]);
    c.onUpdate(() => { c.pos.x += c.spd * k.dt(); if (c.pos.x > TUNING.width + 50) c.pos.x = -50; });
  }
  for (let i = 0; i < 3; i++) {
    const dir = k.rand() < 0.5 ? -1 : 1;
    const b = k.add([drawBirdComp(k), k.pos(k.rand(0, TUNING.width), 95 + i * 95), k.fixed(), k.z(-9), { spd: k.rand(28, 48) * dir, phase: k.rand(0, 6) }]);
    b.onUpdate(() => {
      b.pos.x += b.spd * k.dt();
      if (b.pos.x > TUNING.width + 30) b.pos.x = -30;
      if (b.pos.x < -30) b.pos.x = TUNING.width + 30;
    });
  }
}

function setCamera(k, x, y) {
  if (k.setCamPos) k.setCamPos(k.vec2(x, y));
  else k.camPos(x, y);
}
