// 진입점: Kaplay 초기화 → 한글 폰트 로드 → 씬 등록 → 게임 시작.
import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";
import { TUNING } from "../config/tuning.js";
import { registerGameScene } from "./scenes/game.js";
import { registerGameOverScene } from "./scenes/gameover.js";

// 전역 오염 없이 k 컨텍스트만 사용(global:false).
const k = kaplay({
  width: TUNING.width,
  height: TUNING.height,
  background: [188, 222, 248], // 옅은 하늘색
  letterbox: true,
  global: false,
  pixelDensity: 2,
});

// 한글 폰트 로드(없으면 한글이 안 보임). 다른 폰트 URL로 교체 가능.
k.loadFont("kr", "https://cdn.jsdelivr.net/fontsource/fonts/jua@latest/korean-400-normal.woff2");

// 전체 게임 속도(0.8~0.9면 더 차분). dt 기반 움직임이 전부 함께 느려진다.
if (k.debug) k.debug.timeScale = TUNING.gameSpeed;

registerGameScene(k);
registerGameOverScene(k);

k.go("game");
