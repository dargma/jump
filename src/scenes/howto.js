// 미션 설명 화면: 이야기 + 조작법을 보여주고 스페이스/클릭으로 게임 시작.
import { TUNING } from "../../config/tuning.js";
import { STORY, STAGES } from "../../config/stages.js";

const FONT = "kr";

export function registerHowtoScene(k) {
  k.scene("howto", () => {
    const cx = TUNING.width / 2;

    k.add([k.text("미션", { size: 34, font: FONT }), k.pos(cx, 70), k.anchor("center"), k.color(40, 40, 70)]);
    k.add([k.text(STORY.intro, { size: 18, font: FONT, width: TUNING.width - 60, align: "center" }), k.pos(cx, 130), k.anchor("center"), k.color(70, 80, 120)]);

    const lines = [
      "← → 로 좌우 이동 (점프는 자동!)",
      "스페이스로 아이템 사용",
      "태권소년은 화살표 연타로 발차기 콤보!",
      `${STAGES.length}개 세계를 지나 공주를 구하자`,
    ];
    lines.forEach((t, i) => k.add([k.text("• " + t, { size: 17, font: FONT }), k.pos(44, 210 + i * 42), k.color(50, 50, 80)]));

    k.add([k.text("스페이스 또는 클릭으로 시작!", { size: 20, font: FONT }), k.pos(cx, 470), k.anchor("center"), k.color(255, 100, 150)]);

    // 시작화면 클릭이 그대로 이어져 바로 넘어가지 않도록 잠깐 뒤에 입력 받기
    let ready = false;
    k.wait(0.35, () => (ready = true));
    const go = () => { if (ready) k.go("game"); };
    k.onKeyPress("space", go);
    k.onMousePress(go);
  });
}
