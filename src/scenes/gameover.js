// 게임오버 / 승리 씬: 결과 보여주고 스페이스·클릭으로 다시 시작.
import { TUNING } from "../../config/tuning.js";
import { STORY } from "../../config/stages.js";
import { drawPrincessComp } from "../draw.js";

const FONT = "kr";

export function registerGameOverScene(k) {
  k.scene("gameover", ({ score, best, win }) => {
    const cx = TUNING.width / 2;

    if (win) {
      // 승리: 공주를 구한 축하 화면 + 엔딩 이야기
      k.add([drawPrincessComp(k), k.pos(cx, 140)]);
      k.add([k.text("공주를 구했어요!", { size: 30, font: FONT }), k.pos(cx, 218), k.anchor("center"), k.color(220, 90, 160)]);
      k.add([k.text(STORY.ending, { size: 16, font: FONT, width: TUNING.width - 50, align: "center" }), k.pos(cx, 256), k.anchor("center"), k.color(110, 90, 120)]);
    } else {
      k.add([k.text("게임 오버", { size: 40, font: FONT }), k.pos(cx, 175), k.anchor("center"), k.color(40, 40, 60)]);
    }

    k.add([k.text(`점수  ${score}`, { size: 28, font: FONT }), k.pos(cx, 290), k.anchor("center"), k.color(40, 40, 60)]);
    k.add([k.text(`최고  ${best}`, { size: 22, font: FONT }), k.pos(cx, 332), k.anchor("center"), k.color(120, 120, 140)]);
    k.add([k.text("스페이스 또는 클릭으로 다시!", { size: 18, font: FONT }), k.pos(cx, 410), k.anchor("center"), k.color(70, 120, 200)]);

    const restart = () => k.go("game");
    k.onKeyPress("space", restart);
    k.onMousePress(restart);
  });
}
