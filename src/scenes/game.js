// 게임 플레이 씬: 물리 업데이트, 카메라(위로만), 점수, 발판 생성, 게임오버 판정.
import { TUNING } from "../../config/tuning.js";
import { makePlayer, updatePlayer, tryLand } from "../player.js";
import { initialPlatforms, ensurePlatformsAbove, cleanupBelow } from "../platform.js";
import { drawPrincessComp } from "../draw.js";
import { collideItem, applyEffect, tickEffect } from "../item.js";
import { ensureAudio, startBGM, stopBGM, playItem, playGameOver } from "../audio.js";

const FONT = "kr";
const BEST_KEY = "doodle-prince-best"; // 최고기록 localStorage 키

export function registerGameScene(k) {
  k.scene("game", () => {
    // 아이템이 바꾸는 점프 상태
    const state = { jumpMultiplier: 1, activeItem: null };

    const player = makePlayer(k, TUNING.width / 2, 0);
    let topY = initialPlatforms(k); // 가장 높이 생성된 발판 y

    let highestY = 0; // 가장 높이(작은 y) 올라간 값 → 점수
    let camY = 0;
    let score = 0;
    let reached = false; // 공주 도달 1회만 처리

    const best = Number(localStorage.getItem(BEST_KEY) || 0);

    // HUD (fixed: 카메라 영향 안 받음)
    const scoreLabel = k.add([k.text("0", { size: 26, font: FONT }), k.pos(14, 12), k.color(30, 30, 50), k.fixed()]);
    const itemLabel = k.add([k.text("", { size: 18, font: FONT }), k.pos(14, 46), k.color(60, 110, 200), k.fixed()]);
    k.add([k.text("최고 " + best, { size: 18, font: FONT }), k.pos(TUNING.width - 14, 16), k.anchor("topright"), k.color(90, 90, 120), k.fixed()]);

    // 첫 입력 때 오디오를 깨우고 배경음악 시작(브라우저 자동재생 정책 때문)
    let bgmOn = false;
    const wake = () => {
      ensureAudio();
      if (!bgmOn) {
        startBGM();
        bgmOn = true;
      }
    };
    k.onKeyPress(wake);
    k.onMousePress(wake);

    k.onUpdate(() => {
      const dt = k.dt();

      // 1) 졸라맨 물리(중력+좌우+양옆순환)
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
      // 4) 효과 시간 갱신
      tickEffect(state, dt);

      // 5) 점수(올라간 높이)
      highestY = Math.min(highestY, player.pos.y);
      score = Math.floor(-highestY / 10);

      // 6) 카메라(최고 높이를 위로만 부드럽게 추적)
      const target = highestY - TUNING.height * 0.05;
      camY = k.lerp(camY, target, TUNING.cameraFollow);
      setCamera(k, TUNING.width / 2, camY);

      // 7) 발판 무한 생성 + 화면 밖 정리
      topY = ensurePlatformsAbove(k, topY, camY);
      cleanupBelow(k, camY);

      // 8) HUD 갱신
      scoreLabel.text = String(score);
      itemLabel.text = state.activeItem
        ? `${state.activeItem.def.name} ${state.activeItem.timeLeft.toFixed(1)}s`
        : "";

      // 9) 공주 도달 → 예쁜 공주 등장 + 축하 메시지
      if (!reached && score >= TUNING.princessHeight) {
        reached = true;
        playItem(); // 반짝 효과음
        k.add([drawPrincessComp(k), k.pos(TUNING.width / 2, 120), k.fixed()]);
        k.add([k.text("공주를 구했어요!", { size: 24, font: FONT }), k.pos(TUNING.width / 2, 195), k.anchor("center"), k.color(220, 90, 160), k.fixed()]);
      }

      // 10) 게임오버(발판 놓치고 화면 아래로 추락)
      const deadLine = camY + TUNING.height / 2 + TUNING.fallMargin;
      if (player.pos.y > deadLine) {
        if (score > best) localStorage.setItem(BEST_KEY, String(score));
        stopBGM();
        playGameOver();
        k.go("gameover", { score, best: Math.max(best, score) });
      }
    });
  });
}

// Kaplay 버전별 카메라 함수 이름 차이 흡수.
function setCamera(k, x, y) {
  if (k.setCamPos) k.setCamPos(k.vec2(x, y));
  else k.camPos(x, y);
}
