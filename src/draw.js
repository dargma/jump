// 선·도형으로 그리는 곳. ★ 나중에 이미지로 바꾸려면 이 파일의 함수만 교체.
// (예: drawPlayerComp -> k.sprite("zolaman") 컴포넌트로 교체)
// 각 함수는 Kaplay '컴포넌트(draw 메서드 포함)'를 돌려준다.
// draw() 안의 좌표 (0,0) 은 그 게임오브젝트의 pos(중심)다.
import { TUNING } from "../config/tuning.js";

// 졸라맨: 동그란 머리 + 막대 팔다리
export function drawPlayerComp(k) {
  return {
    draw() {
      const ink = k.rgb(35, 35, 50);
      // 머리(원, 윤곽선만)
      k.drawCircle({ pos: k.vec2(0, -13), radius: 7, fill: false, outline: { width: 3, color: ink } });
      // 몸통
      k.drawLine({ p1: k.vec2(0, -6), p2: k.vec2(0, 8), width: 3, color: ink });
      // 팔
      k.drawLine({ p1: k.vec2(-9, 0), p2: k.vec2(9, 0), width: 3, color: ink });
      // 다리
      k.drawLine({ p1: k.vec2(0, 8), p2: k.vec2(-7, 18), width: 3, color: ink });
      k.drawLine({ p1: k.vec2(0, 8), p2: k.vec2(7, 18), width: 3, color: ink });
    },
  };
}

// 발판: 타입별 색만 다르게(지금은 normal만). 나중에 moving/breakable도 여기서 분기.
export function drawPlatformComp(k, type) {
  const color = type === "normal" ? k.rgb(95, 185, 95) : k.rgb(150, 150, 150);
  return {
    draw() {
      k.drawRect({
        width: TUNING.platformWidth,
        height: TUNING.platformHeight,
        anchor: "center",
        radius: 5,
        color,
      });
    },
  };
}

// 아이템: 임시로 동그라미 + 작은 날개 모양 선. 이미지 교체 지점.
export function drawItemComp(k, def) {
  const color = k.rgb(def.color[0], def.color[1], def.color[2]);
  return {
    draw() {
      k.drawCircle({ pos: k.vec2(0, 0), radius: 10, color });
      // 좌우 작은 날개 느낌
      k.drawLine({ p1: k.vec2(-10, -2), p2: k.vec2(-16, -7), width: 2, color });
      k.drawLine({ p1: k.vec2(10, -2), p2: k.vec2(16, -7), width: 2, color });
    },
  };
}
