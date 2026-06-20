// 게임오버 씬: 점수/최고기록 보여주고 스페이스 또는 클릭으로 다시 시작.
import { TUNING } from "../../config/tuning.js";

const FONT = "kr";

export function registerGameOverScene(k) {
  k.scene("gameover", ({ score, best }) => {
    const cx = TUNING.width / 2;

    k.add([k.text("게임 오버", { size: 40, font: FONT }), k.pos(cx, 170), k.anchor("center"), k.color(40, 40, 60)]);
    k.add([k.text(`점수  ${score}`, { size: 30, font: FONT }), k.pos(cx, 250), k.anchor("center"), k.color(40, 40, 60)]);
    k.add([k.text(`최고  ${best}`, { size: 22, font: FONT }), k.pos(cx, 295), k.anchor("center"), k.color(120, 120, 140)]);
    k.add([k.text("스페이스 또는 클릭으로 다시!", { size: 18, font: FONT }), k.pos(cx, 390), k.anchor("center"), k.color(70, 120, 200)]);

    const restart = () => k.go("game");
    k.onKeyPress("space", restart);
    k.onMousePress(restart);
  });
}
