// 게임 플레이 씬: 물리, 카메라(데드존), 점수, 발판, 하늘 배경, 체력/추락 데미지, 공주 승리.
import { TUNING } from "../../config/tuning.js";
import { makePlayer, updatePlayer, tryLand } from "../player.js";
import { initialPlatforms, ensurePlatformsAbove, cleanupBelow, makePlatform } from "../platform.js";
import { drawPrincessComp, drawCloudComp, drawBirdComp, drawHeartComp } from "../draw.js";
import { collideItem, applyEffect, tickEffect } from "../item.js";
import { ensureAudio, startBGM, stopBGM, playItem, playOuch, playGameOver } from "../audio.js";

const FONT = "kr";
const BEST_KEY = "doodle-prince-best";
const GOAL_HALF = 80; // 공주 받침대 절반 폭

export function registerGameScene(k) {
  k.scene("game", () => {
    const state = { jumpMultiplier: 1, activeItem: null, inventory: [] };

    spawnSky(k);

    const player = makePlayer(k, TUNING.width / 2, 0);
    let topY = initialPlatforms(k);

    const goalY = -(TUNING.princessHeight * TUNING.pxPerScore);
    let goalSpawned = false;
    let won = false;

    let highestY = 0;
    let camY = 0;
    let score = 0;
    let coinBonus = 0;
    let health = TUNING.maxHealth;

    const best = Number(localStorage.getItem(BEST_KEY) || 0);

    // HUD
    const scoreLabel = k.add([k.text("0", { size: 26, font: FONT }), k.pos(14, 12), k.color(30, 30, 50), k.fixed()]);
    const itemLabel = k.add([k.text("", { size: 18, font: FONT }), k.pos(14, 46), k.color(60, 110, 200), k.fixed()]);
    const invLabel = k.add([k.text("", { size: 16, font: FONT }), k.pos(14, 72), k.color(150, 100, 30), k.fixed()]);
    k.add([k.text("최고 " + best, { size: 18, font: FONT }), k.pos(TUNING.width - 14, 16), k.anchor("topright"), k.color(90, 90, 120), k.fixed()]);
    const hearts = makeHearts(k);

    // 첫 입력 때 오디오 깨우기 + 배경음악
    let bgmOn = false;
    const wake = () => { ensureAudio(); if (!bgmOn) { startBGM(); bgmOn = true; } };
    k.onKeyPress(wake);
    k.onMousePress(wake);

    // 아이템 사용: 가방의 마지막 아이템을 꺼내 발동(스페이스 또는 위 화살표)
    const useItem = () => {
      if (state.inventory.length === 0) return;
      applyEffect(k, state, player, state.inventory.pop());
      playItem();
    };
    k.onKeyPress("space", useItem);
    k.onKeyPress("up", useItem);

    // 큰 추락 데미지 처리(하트 -1 + 아야! 연출)
    const bigFall = () => {
      health -= 1;
      player.hurtT = 0.3;
      playOuch();
      if (k.shake) k.shake(8);
      burstStars(k, player.pos.x, player.pos.y);
      floatText(k, player.pos.x, player.pos.y);
      if (health <= 0) {
        stopBGM();
        playGameOver();
        if (score > best) localStorage.setItem(BEST_KEY, String(score));
        k.go("gameover", { score, best: Math.max(best, score), win: false });
      }
    };

    k.onUpdate(() => {
      const dt = k.dt();

      // 1) 졸라맨 물리
      updatePlayer(k, player, dt);

      // 2) 발판 착지 → 점프. 착지 순간 추락 거리로 데미지 판정
      const wasFalling = player.vy > 0;
      const fromPlatY = player.lastPlatY;
      k.get("platform").forEach((p) => tryLand(k, player, p, state));
      if (wasFalling && player.vy < 0) {
        const netDrop = player.lastPlatY - fromPlatY; // 출발 발판보다 얼마나 아래로 떨어졌나
        if (netDrop > TUNING.bigFallDist) bigFall();
      }

      // 3) 아주 밑까지 떨어져도 항상 받침이 있도록(모든 발판 아래로 가면 받침 생성)
      ensureCatch(k, player);

      // 4) 아이템은 가방에 담고(나중에 사용), 코인은 즉시 점수 보너스
      k.get("item").forEach((it) => {
        if (collideItem(player, it)) {
          state.inventory.push(it.def);
          playItem();
          k.destroy(it);
        }
      });
      k.get("coin").forEach((c) => {
        if (collideItem(player, c)) {
          coinBonus += TUNING.coinValue;
          playItem();
          burstStars(k, c.pos.x, c.pos.y);
          k.destroy(c);
        }
      });
      tickEffect(state, dt);

      // 5) 점수(올라간 높이 + 코인 보너스)
      highestY = Math.min(highestY, player.pos.y);
      score = Math.floor(-highestY / TUNING.pxPerScore) + coinBonus;

      // 6) 카메라(데드존 + 하드 클램프: 빠르게 떨어져도 졸라맨이 화면 밖으로 못 나감)
      camY = k.lerp(camY, deadzoneCam(player.pos.y, camY), TUNING.cameraFollow);
      camY = clampCam(player.pos.y, camY);
      setCamera(k, TUNING.width / 2, camY);

      // 7) 발판 생성/정리 + 공주 받침대
      if (!goalSpawned) {
        topY = ensurePlatformsAbove(k, topY, camY, goalY);
        if (topY <= goalY + TUNING.platformGapMax + 1) {
          spawnGoal(k, goalY);
          goalSpawned = true;
        }
      }
      cleanupBelow(k, camY);

      // 8) HUD
      scoreLabel.text = String(score);
      itemLabel.text = state.activeItem ? `${state.activeItem.def.name} ${state.activeItem.timeLeft.toFixed(1)}s` : "";
      invLabel.text = invText(state.inventory);
      hearts.forEach((h, i) => (h.filled = i < health));

      // 9) 공주 도달 → 승리
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

// 카메라 데드존: 졸라맨이 화면 위/아래 경계를 넘을 때만 그 경계에 맞춰 따라간다.
function deadzoneCam(playerY, camY) {
  const h = TUNING.height;
  const sy = playerY - camY + h / 2; // 화면상 y
  if (sy < h * TUNING.cameraTopFrac) return playerY + h / 2 - h * TUNING.cameraTopFrac;
  if (sy > h * TUNING.cameraBotFrac) return playerY + h / 2 - h * TUNING.cameraBotFrac;
  return camY;
}

// 하드 클램프: lerp가 못 따라가도 졸라맨이 위/아래 띠 밖으로 못 나가게 강제한다.
function clampCam(playerY, camY) {
  const h = TUNING.height;
  const minCam = playerY + h / 2 - h * TUNING.cameraBotFrac; // 더 내려가면 카메라가 따라 내려감
  const maxCam = playerY + h / 2 - h * TUNING.cameraTopFrac; // 더 올라가면 카메라가 따라 올라감
  return Math.max(minCam, Math.min(maxCam, camY));
}

// 모든 발판보다 아래로 떨어지면 졸라맨 바로 아래에 받침을 깔아 항상 걸리게 한다.
function ensureCatch(k, player) {
  if (player.vy <= 0) return;
  const plats = k.get("platform");
  let lowest = -Infinity;
  for (const p of plats) if (p.pos.y > lowest) lowest = p.pos.y;
  if (player.pos.y > lowest + 30) {
    const x = Math.max(TUNING.platformWidth / 2, Math.min(TUNING.width - TUNING.platformWidth / 2, player.pos.x));
    makePlatform(k, x, player.pos.y + 90);
  }
}

// 가방 표시: "가방: 날개 x2  (스페이스로 사용)"
function invText(inv) {
  if (!inv.length) return "";
  const counts = {};
  for (const d of inv) counts[d.name] = (counts[d.name] || 0) + 1;
  const parts = Object.keys(counts).map((n) => `${n} x${counts[n]}`);
  return "가방: " + parts.join(", ") + "  (스페이스 사용)";
}

// 체력 하트 HUD 만들기(왼쪽 위, 점수 아래)
function makeHearts(k) {
  const hearts = [];
  for (let i = 0; i < TUNING.maxHealth; i++) {
    const h = k.add([drawHeartComp(k), k.pos(TUNING.width - 24 - i * 26, 52), k.fixed(), { filled: true }]);
    hearts.push(h);
  }
  return hearts;
}

// 큰 추락 시 별이 사방으로 터진다.
function burstStars(k, x, y) {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const st = k.add([
      k.circle(3), k.pos(x, y), k.color(255, 210, 80), k.opacity(1), k.anchor("center"),
      { vx: Math.cos(a) * 130, vy: Math.sin(a) * 130 - 30, life: 0.6 },
    ]);
    st.onUpdate(() => {
      const d = k.dt();
      st.life -= d;
      st.pos.x += st.vx * d;
      st.pos.y += st.vy * d;
      st.vy += 320 * d;
      st.opacity = Math.max(0, st.life / 0.6);
      if (st.life <= 0) k.destroy(st);
    });
  }
}

// "아야!" 글자가 위로 떠오르며 사라진다.
function floatText(k, x, y) {
  const t = k.add([
    k.text("아야!", { size: 22, font: FONT }), k.pos(x, y - 22), k.anchor("center"),
    k.color(220, 70, 70), k.opacity(1), { life: 0.8 },
  ]);
  t.onUpdate(() => {
    const d = k.dt();
    t.life -= d;
    t.pos.y -= 40 * d;
    t.opacity = Math.max(0, t.life / 0.8);
    if (t.life <= 0) k.destroy(t);
  });
}

// 공주 받침대 + 공주
function spawnGoal(k, goalY) {
  k.add([
    k.rect(GOAL_HALF * 2, 16, { radius: 6 }),
    k.pos(TUNING.width / 2, goalY),
    k.anchor("center"),
    k.color(170, 135, 95),
    "platform",
    "goal",
    { ptype: "goal" },
  ]);
  k.add([drawPrincessComp(k), k.pos(TUNING.width / 2, goalY - 50)]);
}

// 하늘 배경: 구름은 천천히, 새는 좌우 다양한 방향으로 가로지른다(화면 고정 + 양쪽 순환).
function spawnSky(k) {
  for (let i = 0; i < 3; i++) {
    const c = k.add([drawCloudComp(k), k.pos(k.rand(0, TUNING.width), 50 + i * 75), k.fixed(), k.z(-10), { spd: k.rand(8, 18) }]);
    c.onUpdate(() => {
      c.pos.x += c.spd * k.dt();
      if (c.pos.x > TUNING.width + 50) c.pos.x = -50;
    });
  }
  for (let i = 0; i < 3; i++) {
    const dir = k.rand() < 0.5 ? -1 : 1; // 왼→오 또는 오→왼
    const b = k.add([drawBirdComp(k), k.pos(k.rand(0, TUNING.width), 95 + i * 95), k.fixed(), k.z(-9), { spd: k.rand(28, 48) * dir, phase: k.rand(0, 6) }]);
    b.onUpdate(() => {
      b.pos.x += b.spd * k.dt();
      if (b.pos.x > TUNING.width + 30) b.pos.x = -30;
      if (b.pos.x < -30) b.pos.x = TUNING.width + 30;
    });
  }
}

// Kaplay 버전별 카메라 함수 이름 차이 흡수.
function setCamera(k, x, y) {
  if (k.setCamPos) k.setCamPos(k.vec2(x, y));
  else k.camPos(x, y);
}
