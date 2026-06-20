// 선·도형으로 그리는 곳. ★ 나중에 이미지로 바꾸려면 이 파일의 함수만 교체.
// (예: drawPlayerComp -> k.sprite("zolaman") 컴포넌트로 교체)
// 각 함수는 Kaplay '컴포넌트(draw 메서드 포함)'를 돌려준다.
// draw() 안의 좌표 (0,0) 은 그 게임오브젝트의 pos(중심)다.
import { TUNING } from "../config/tuning.js";

// 졸라맨: 동그란 머리 + 관절(무릎/팔꿈치) 있는 팔다리.
// 점프 단계(세로 속도 this.vy)에 따라 자세가 바뀌어 "진짜 뛰는" 느낌을 준다.
export function drawPlayerComp(k) {
  return {
    draw() {
      const hurt = (this.hurtT || 0) > 0;
      const ink = hurt ? k.rgb(220, 70, 70) : k.rgb(35, 35, 50); // 아프면 빨개짐
      const vy = this.vy || 0;
      const n = Math.max(-1, Math.min(1, vy / 700)); // -1 상승 ~ 0 정점 ~ +1 하강
      const pose = poseFor(n);

      k.pushTransform();
      if (hurt) k.pushScale(k.vec2(1.35, 0.65)); // 납작 찌그러짐

      // 로켓 불꽃(발밑에서 펄럭)
      if (this.rocketOn) {
        const f = 6 + Math.abs(Math.sin(k.time() * 30)) * 8;
        k.drawPolygon({ pts: [k.vec2(-6, 18), k.vec2(6, 18), k.vec2(0, 18 + f)], color: k.rgb(255, 150, 40) });
        k.drawPolygon({ pts: [k.vec2(-3, 18), k.vec2(3, 18), k.vec2(0, 18 + f * 0.6)], color: k.rgb(255, 230, 90) });
      }

      // 머리 + 몸통
      k.drawCircle({ pos: k.vec2(0, -14), radius: 7, fill: false, outline: { width: 3, color: ink } });
      k.drawLine({ p1: k.vec2(0, -7), p2: k.vec2(0, 8), width: 3, color: ink });

      // 머리카락: 여러 가닥이 곡선으로 휘날린다. 떨어질 때 솟구치고 오를 때 처짐.
      drawHair(k, vy, ink);

      // 좌우 팔다리(왼쪽 s=-1, 오른쪽 s=+1). 관절을 거쳐 두 선으로 그린다.
      for (const s of [-1, 1]) {
        // 팔: 어깨(0,-4) → 팔꿈치 → 손
        k.drawLine({ p1: k.vec2(0, -4), p2: k.vec2(s * pose.elbow[0], pose.elbow[1]), width: 3, color: ink });
        k.drawLine({ p1: k.vec2(s * pose.elbow[0], pose.elbow[1]), p2: k.vec2(s * pose.hand[0], pose.hand[1]), width: 3, color: ink });
        // 다리: 엉덩이(0,8) → 무릎 → 발
        k.drawLine({ p1: k.vec2(0, 8), p2: k.vec2(s * pose.knee[0], pose.knee[1]), width: 3, color: ink });
        k.drawLine({ p1: k.vec2(s * pose.knee[0], pose.knee[1]), p2: k.vec2(s * pose.foot[0], pose.foot[1]), width: 3, color: ink });
      }

      k.popTransform();
    },
  };
}

// 머리카락: 두피의 여러 뿌리에서 4마디 곡선이 뻗어나가며 휘날린다.
// flow>0(하강): 공기저항으로 위로 솟구침 / flow<0(상승): 아래로 처짐.
function drawHair(k, vy, ink) {
  const t = k.time();
  const flow = Math.max(-1.3, Math.min(1.3, vy / 550));
  const roots = [-6, -3.5, -1, 1, 3.5, 6];
  const seg = 4;
  for (const rx of roots) {
    const dir = rx >= 0 ? 1 : -1;
    let prev = k.vec2(rx, -19);
    for (let j = 1; j <= seg; j++) {
      const up = -19 - j * (4 + flow * 3);           // 위로 뻗음(하강일수록 더)
      const wave = Math.sin(t * 7 + rx * 0.8 - j * 0.7) * (1.8 * j); // 휘날리는 파동
      const out = dir * j * 1.2;                       // 끝으로 갈수록 바깥으로
      const cur = k.vec2(rx + out + wave, up);
      k.drawLine({ p1: prev, p2: cur, width: Math.max(1.2, 2.4 - j * 0.25), color: ink });
      prev = cur;
    }
  }
}

// 점프 단계별 포즈 키프레임(왼쪽 기준 오프셋; 오른쪽은 x부호 반전).
const PUSH = { elbow: [6, -9], hand: [9, -15], knee: [3, 14], foot: [4, 21] };  // 박차고 오름: 팔 위로, 다리 쭉
const APEX = { elbow: [11, -3], hand: [14, -5], knee: [8, 10], foot: [5, 13] }; // 정점: 팔 벌리고 다리 오무림
const LAND = { elbow: [8, 3], hand: [10, 8], knee: [6, 15], foot: [9, 22] };    // 착지 준비: 팔 내리고 다리 펼침

// n<0(상승)이면 APEX→PUSH, n>0(하강)이면 APEX→LAND 로 보간.
function poseFor(n) {
  return n < 0 ? lerpPose(APEX, PUSH, -n) : lerpPose(APEX, LAND, n);
}

function lerpN(a, b, t) {
  return a + (b - a) * t;
}
function lerpPose(a, b, t) {
  const p = {};
  for (const key of ["elbow", "hand", "knee", "foot"]) {
    p[key] = [lerpN(a[key][0], b[key][0], t), lerpN(a[key][1], b[key][1], t)];
  }
  return p;
}

// 발판: 타입별 색만 다르게(지금은 normal만). 나중에 moving/breakable도 여기서 분기.
// 발판: 종류(def)에 따라 색·모양이 다르다. 트램펄린엔 스프링, 구름은 몽글몽글.
export function drawPlatformComp(k, def) {
  const col = k.rgb(def.color[0], def.color[1], def.color[2]);
  return {
    draw() {
      if (def.id === "cloud") {
        const w = col;
        k.drawCircle({ pos: k.vec2(-18, 1), radius: 9, color: w });
        k.drawCircle({ pos: k.vec2(-6, -4), radius: 11, color: w });
        k.drawCircle({ pos: k.vec2(8, -3), radius: 11, color: w });
        k.drawCircle({ pos: k.vec2(20, 1), radius: 8, color: w });
        return;
      }
      k.drawRect({ width: TUNING.platformWidth, height: TUNING.platformHeight, anchor: "center", radius: 5, color: col });
      if (def.id === "spring") {
        // 트램펄린 스프링(콩 점프 표시)
        const s = k.rgb(90, 90, 110);
        k.drawLine({ p1: k.vec2(-8, -7), p2: k.vec2(-8, -14), width: 2, color: s });
        k.drawLine({ p1: k.vec2(8, -7), p2: k.vec2(8, -14), width: 2, color: s });
        k.drawLine({ p1: k.vec2(-12, -14), p2: k.vec2(12, -14), width: 3, color: s });
      }
    },
  };
}

// 코인: 반짝이는 금화(점수 보너스). 천천히 반짝.
export function drawCoinComp(k) {
  return {
    draw() {
      const shine = 0.6 + Math.abs(Math.sin(k.time() * 3)) * 0.4;
      k.drawCircle({ pos: k.vec2(0, 0), radius: 9, color: k.rgb(255, 205, 60) });
      k.drawCircle({ pos: k.vec2(0, 0), radius: 9, fill: false, outline: { width: 2, color: k.rgb(210, 150, 30) } });
      k.drawCircle({ pos: k.vec2(-3, -3), radius: 2.4, color: k.rgb(255, 255, 255), opacity: shine });
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

// 공주: 졸라맨이 아니라 긴 머리 + 왕관 + 드레스의 귀여운 캐릭터.
// 둥실둥실 + 머리카락 살랑 + 반짝이 애니메이션(시간 기반).
export function drawPrincessComp(k) {
  return {
    draw() {
      const tt = k.time();
      const bob = Math.sin(tt * 2) * 3;    // 위아래 둥실
      const sway = Math.sin(tt * 1.6) * 2; // 머리카락 살랑

      const hair = k.rgb(54, 42, 66);
      const skin = k.rgb(255, 226, 200);
      const dress = k.rgb(246, 138, 190);
      const dress2 = k.rgb(232, 110, 170);
      const gold = k.rgb(255, 206, 84);
      const cheek = k.rgb(255, 150, 170);
      const ink = k.rgb(60, 45, 60);
      const white = k.rgb(255, 255, 255);

      k.pushTransform();
      k.pushTranslate(k.vec2(0, bob));

      // 긴 머리(뒤 블롭 + 좌우로 흘러내리는 머리카락)
      k.drawCircle({ pos: k.vec2(0, -13), radius: 16, color: hair });
      k.drawPolygon({ pts: [k.vec2(-15, -14), k.vec2(-22 + sway, 10), k.vec2(-15, 40), k.vec2(-7, 38)], color: hair });
      k.drawPolygon({ pts: [k.vec2(15, -14), k.vec2(22 + sway, 10), k.vec2(15, 40), k.vec2(7, 38)], color: hair });

      // 드레스(어깨→아래로 넓어지는 사다리꼴) + 밑단
      k.drawPolygon({ pts: [k.vec2(-9, 2), k.vec2(9, 2), k.vec2(24, 42), k.vec2(-24, 42)], color: dress });
      k.drawPolygon({ pts: [k.vec2(-24, 42), k.vec2(24, 42), k.vec2(20, 36), k.vec2(-20, 36)], color: dress2 });

      // 팔
      k.drawLine({ p1: k.vec2(-8, 4), p2: k.vec2(-16, 16), width: 4, color: skin });
      k.drawLine({ p1: k.vec2(8, 4), p2: k.vec2(16, 16), width: 4, color: skin });

      // 얼굴 + 앞머리(이마 위 돔)
      k.drawCircle({ pos: k.vec2(0, -12), radius: 13, color: skin });
      k.drawPolygon({ pts: [k.vec2(-14, -10), k.vec2(-12, -22), k.vec2(0, -25), k.vec2(12, -22), k.vec2(14, -10)], color: hair });

      // 볼터치 / 큰 눈 / 미소
      k.drawCircle({ pos: k.vec2(-7, -9), radius: 2.4, color: cheek, opacity: 0.8 });
      k.drawCircle({ pos: k.vec2(7, -9), radius: 2.4, color: cheek, opacity: 0.8 });
      k.drawCircle({ pos: k.vec2(-5, -13), radius: 2.6, color: ink });
      k.drawCircle({ pos: k.vec2(5, -13), radius: 2.6, color: ink });
      k.drawCircle({ pos: k.vec2(-4.2, -13.8), radius: 0.9, color: white });
      k.drawCircle({ pos: k.vec2(5.8, -13.8), radius: 0.9, color: white });
      k.drawLine({ p1: k.vec2(-3, -7), p2: k.vec2(0, -5), width: 1.6, color: ink });
      k.drawLine({ p1: k.vec2(0, -5), p2: k.vec2(3, -7), width: 1.6, color: ink });

      // 왕관(받침 + 뾰족 3개 + 보석)
      k.drawRect({ width: 18, height: 5, pos: k.vec2(0, -23), anchor: "center", color: gold });
      for (const sx of [-6, 0, 6]) {
        k.drawPolygon({ pts: [k.vec2(sx - 3, -25), k.vec2(sx, -31), k.vec2(sx + 3, -25)], color: gold });
      }
      k.drawCircle({ pos: k.vec2(0, -31), radius: 1.4, color: k.rgb(255, 120, 170) });

      k.popTransform();

      // 반짝이(주변에서 깜빡)
      const tw = (ph) => 2 + Math.abs(Math.sin(tt * 3 + ph)) * 3;
      sparkle(k, -28, -20, tw(0), gold);
      sparkle(k, 30, -6, tw(1.5), gold);
      sparkle(k, 22, 26, tw(2.7), gold);
    },
  };
}

// 4방향 반짝이 한 개
function sparkle(k, x, y, s, color) {
  k.drawLine({ p1: k.vec2(x, y - s), p2: k.vec2(x, y + s), width: 2, color });
  k.drawLine({ p1: k.vec2(x - s, y), p2: k.vec2(x + s, y), width: 2, color });
}

// 하늘 구름(동그라미 뭉치). 배경에서 천천히 흐른다.
export function drawCloudComp(k) {
  const w = k.rgb(255, 255, 255);
  return {
    draw() {
      k.drawRect({ width: 42, height: 14, pos: k.vec2(0, 6), anchor: "center", radius: 7, color: w, opacity: 0.92 });
      k.drawCircle({ pos: k.vec2(-13, 1), radius: 11, color: w, opacity: 0.92 });
      k.drawCircle({ pos: k.vec2(0, -5), radius: 14, color: w, opacity: 0.92 });
      k.drawCircle({ pos: k.vec2(13, 1), radius: 11, color: w, opacity: 0.92 });
    },
  };
}

// 새: 'ㅅ' 모양 두 날개가 펄럭인다(시간 기반). 좌우 대칭이라 방향 상관없다.
export function drawBirdComp(k) {
  const c = k.rgb(80, 90, 120);
  return {
    draw() {
      const flap = Math.sin(k.time() * 8 + (this.phase || 0)) * 3; // 날갯짓(개체마다 위상)
      k.drawLine({ p1: k.vec2(-8, 0), p2: k.vec2(0, -3 - flap), width: 2, color: c });
      k.drawLine({ p1: k.vec2(0, -3 - flap), p2: k.vec2(8, 0), width: 2, color: c });
    },
  };
}

// 하트(HUD 체력). this.filled 가 false면 빈(회색) 하트.
export function drawHeartComp(k) {
  return {
    draw() {
      const c = this.filled ? k.rgb(230, 70, 90) : k.rgb(205, 205, 215);
      k.drawCircle({ pos: k.vec2(-4, -2), radius: 5, color: c });
      k.drawCircle({ pos: k.vec2(4, -2), radius: 5, color: c });
      k.drawPolygon({ pts: [k.vec2(-8.5, 0.5), k.vec2(8.5, 0.5), k.vec2(0, 10)], color: c });
    },
  };
}
