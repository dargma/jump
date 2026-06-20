// 시작화면: 제목 + 캐릭터 고르기. 캐릭터를 누르면 미션 설명(howto)으로 간다.
import { TUNING } from "../../config/tuning.js";
import { CHARACTERS, selected } from "../../config/characters.js";
import { drawPlayerComp } from "../draw.js";

const FONT = "kr";

export function registerStartScene(k) {
  k.scene("start", () => {
    k.add([k.text("졸라맨 점프", { size: 42, font: FONT }), k.pos(TUNING.width / 2, 92), k.anchor("center"), k.color(40, 40, 70)]);
    k.add([k.text("하늘 위 공주를 구하러!", { size: 18, font: FONT }), k.pos(TUNING.width / 2, 132), k.anchor("center"), k.color(90, 100, 140)]);
    k.add([k.text("캐릭터를 골라줘", { size: 22, font: FONT }), k.pos(TUNING.width / 2, 210), k.anchor("center"), k.color(60, 60, 90)]);

    CHARACTERS.forEach((c, i) => {
      const x = TUNING.width / 2 + (i - 1) * 112;
      const y = 310;
      // 클릭 카드
      const card = k.add([
        k.rect(88, 116, { radius: 14 }), k.pos(x, y), k.anchor("center"),
        k.color(255, 255, 255), k.outline(3, k.rgb(215, 222, 235)), k.area(),
      ]);
      // 머리색 입힌 졸라맨 미리보기
      k.add([k.pos(x, y - 4), drawPlayerComp(k), { hairCol: c.hair, vy: 0, hurtT: 0, rocketOn: false, skyDark: 0 }]);
      // 이름
      k.add([k.text(c.name, { size: 16, font: FONT }), k.pos(x, y + 44), k.anchor("center"), k.color(60, 60, 90)]);
      card.onClick(() => pick(k, i));
    });

    k.add([k.text("캐릭터를 누르면 시작! (또는 1·2·3)", { size: 15, font: FONT }), k.pos(TUNING.width / 2, 430), k.anchor("center"), k.color(120, 120, 150)]);
    k.onKeyPress("1", () => pick(k, 0));
    k.onKeyPress("2", () => pick(k, 1));
    k.onKeyPress("3", () => pick(k, 2));
  });
}

function pick(k, i) {
  selected.index = i;
  k.go("howto");
}
