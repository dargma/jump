// 게임 플레이 씬: 물리, 카메라(위로만), 점수, 발판 생성, 하늘 배경, 공주 도달(승리), 게임오버.
import { TUNING } from "../../config/tuning.js";
import { makePlayer, updatePlayer, tryLand } from "../player.js";
import { initialPlatforms, ensurePlatformsAbove, cleanupBelow } from "../platform.js";
import { drawPrincessComp, drawCloudComp, drawBirdComp } from "../draw.js";
import { collideItem, applyEffect, tickEffect } from "../item.js";
import { ensureAudio, startBGM, stopBGM, playItem, playGameOver } from "../audio.js";

const FONT = "kr";
const BEST_KEY = "doodle-prince-best"; // 최고기록 localStorage 키
const GOAL_HALF = 80;                   // 공주 받침대 절반 폭(충돌/승리 판정용)

export function registerGameScene(k) {
  k.scene("game", () => {
    const state = { jumpMultiplier: 1, activeItem: null }; // 아이템이 바꾸는 점프 상태

    spawnSky(k); // 구름·새 배경(가장 뒤)

    const player = makePlayer(k, TUNING.width / 2, 0);
    let topY = initialPlatforms(k);

    // 공주가 서 있는 목표 높이(월드 y). princessHeight(점수)를 픽셀로 환산.
    const goalY = -(TUNING.princessHeight * TUNING.pxPerScore);
    let goalSpawned = false;
    let won = false;

    let highestY = 0; // 가장 높이 올라간 값(점수)
    let camY = 0;
    let score = 0;

    const best = Number(localStorage.getItem(BEST_KEY) || 0);

    // HUD (fixed: 카메라 영향 안 받음)
    const scoreLabel = k.add([k.text("0", { size: 26, font: FONT }), k.pos(14, 12), k.color(30, 30, 50), k.fixed()]);
    const itemLabel = k.add([k.text("", { size: 18, font: FONT }), k.pos(14, 46), k.color(60, 110, 200), k.fixed()]);
    k.add([k.text("최고 " + best, { size: 18, font: FONT }), k.pos(TUNING.width - 14, 16), k.anchor("topright"), k.color(90, 90, 120), k.fixed()]);

    // 첫 입력 때 오디오를 깨우고 배경음악 시작(브라우저 자동재생 정책)
    let bgmOn = false;
    const wake = () => {
      ensureAudio();
      if (!bgmOn) { startBGM(); bgmOn = true; }
    };
    k.onKeyPress(wake);
    k.onMousePress(wake);

    k.onUpdate(() => {
      const dt = k.dt();

      // 1) 졸라맨 물리(중력+좌우+벽)
      updatePlayer(k, player, dt);
      // 2) 발판 착지 → 자동 점프(one-way)
      k.get("platform").forEach((p) => tryLand(k, player, p, state));
      // 3) 아이템 충돌 → 효과
      k.get("item").forEach((it) => {
        if (collideItem(player, it)) {
          applyEffect(k, state, player, it.def);
          playItem();
          k.destroy(it);
        }
      });
      tickEffect(state, dt);

      // 4) 점수(올라간 높이)
      highestY = Math.min(highestY, player.pos.y);
      score = Math.floor(-highestY / TUNING.pxPerScore);

      // 5) 카메라(최고 높이를 위로만 추적, 졸라맨을 화면 cameraPlayerY 위치에 둠)
      const target = highestY + TUNING.height * (0.5 - TUNING.cameraPlayerY);
      camY = k.lerp(camY, target, TUNING.cameraFollow);
      setCamera(k, TUNING.width / 2, camY);

      // 6) 발판 생성/정리 + 공주 받침대 등장
      if (!goalSpawned) {
        topY = ensurePlatformsAbove(k, topY, camY, goalY);
        // 마지막 일반 발판이 공주 높이 한 칸 아래까지 오면 받침대+공주 설치
        if (topY <= goalY + TUNING.platformGapMax + 1) {
          spawnGoal(k, goalY);
          goalSpawned = true;
        }
      }
      cleanupBelow(k, camY);

      // 7) HUD
      scoreLabel.text = String(score);
      itemLabel.text = state.activeItem
        ? `${state.activeItem.def.name} ${state.activeItem.timeLeft.toFixed(1)}s`
        : "";

      // 8) 공주에게 도달 → 승리 종료
      if (goalSpawned && !won &&
          player.pos.y <= goalY + 10 &&
          Math.abs(player.pos.x - TUNING.width / 2) < GOAL_HALF + 30) {
        won = true;
        stopBGM();
        playItem();
        if (score > best) localStorage.setItem(BEST_KEY, String(score));
        k.go("gameover", { score, best: Math.max(best, score), win: true });
        return;
      }

      // 9) 게임오버(화면 아래로 추락)
      const deadLine = camY + TUNING.height / 2 + TUNING.fallMargin;
      if (player.pos.y > deadLine) {
        if (score > best) localStorage.setItem(BEST_KEY, String(score));
        stopBGM();
        playGameOver();
        k.go("gameover", { score, best: Math.max(best, score), win: false });
      }
    });
  });
}

// 공주가 서 있는 받침대 + 공주 캐릭터를 목표 높이에 설치.
function spawnGoal(k, goalY) {
  // 받침대(넓은 발판). "platform"이라 졸라맨이 밟을 수 있고, "goal"로 구분.
  k.add([
    k.rect(GOAL_HALF * 2, 16, { radius: 6 }),
    k.pos(TUNING.width / 2, goalY),
    k.anchor("center"),
    k.color(170, 135, 95),
    "platform",
    "goal",
    { ptype: "goal" },
  ]);
  // 공주(받침대 위에 서 있음). 월드 오브젝트라 카메라 따라 함께 보인다.
  k.add([drawPrincessComp(k), k.pos(TUNING.width / 2, goalY - 50)]);
}

// 하늘 배경: 구름·새가 천천히 가로질러 흐른다(화면 고정 + 가로 순환).
function spawnSky(k) {
  for (let i = 0; i < 3; i++) {
    const c = k.add([drawCloudComp(k), k.pos(k.rand(0, TUNING.width), 50 + i * 75), k.fixed(), k.z(-10), { spd: k.rand(8, 18) }]);
    c.onUpdate(() => {
      c.pos.x += c.spd * k.dt();
      if (c.pos.x > TUNING.width + 50) c.pos.x = -50;
    });
  }
  for (let i = 0; i < 2; i++) {
    const b = k.add([drawBirdComp(k), k.pos(k.rand(0, TUNING.width), 110 + i * 130), k.fixed(), k.z(-9), { spd: k.rand(28, 48) }]);
    b.onUpdate(() => {
      b.pos.x += b.spd * k.dt();
      if (b.pos.x > TUNING.width + 30) b.pos.x = -30;
    });
  }
}

// Kaplay 버전별 카메라 함수 이름 차이 흡수.
function setCamera(k, x, y) {
  if (k.setCamPos) k.setCamPos(k.vec2(x, y));
  else k.camPos(x, y);
}
