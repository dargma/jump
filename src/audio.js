// 배경음악 + 효과음: 에셋 없이 Web Audio API로 직접 합성한다.
// ★ 나중에 음원 파일로 바꾸려면 이 파일의 함수 속만 교체하면 된다.
// 주의: 브라우저는 "사용자 입력 후"에야 소리를 낸다 → ensureAudio()를 입력 때 호출.

const MASTER_VOLUME = 0.25; // 전체 볼륨(0~1)
const BGM_VOLUME = 0.12;    // 배경음악 볼륨(효과음보다 작게)

let ctx = null;     // AudioContext
let master = null;  // 전체 볼륨 노브
let bgmTimer = null;

// 오디오 깨우기(입력 이벤트에서 호출). 처음엔 컨텍스트를 만든다.
export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// 한 음 재생(오실레이터 1개 + 부드러운 감쇠)
function tone(freq, startAt, dur, type = "square", vol = 0.5) {
  if (!ctx) return;
  const t = ctx.currentTime + startAt;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur); // 똑 떨어지게
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur);
}

// 점프: 통! (살짝 올라가는 두 음)
export function playJump() {
  tone(440, 0, 0.12, "square", 0.4);
  tone(660, 0.04, 0.12, "square", 0.3);
}

// 아이템 획득: 반짝 딩동
export function playItem() {
  tone(880, 0, 0.12, "triangle", 0.5);
  tone(1320, 0.1, 0.18, "triangle", 0.5);
}

// 아야!: 큰 추락 데미지. 짧고 익살스러운 '뿅' 하강음.
export function playOuch() {
  tone(330, 0, 0.1, "sawtooth", 0.4);
  tone(196, 0.08, 0.16, "sawtooth", 0.4);
}

// 게임오버: 점점 내려가는 슬픈 음
export function playGameOver() {
  tone(440, 0, 0.25, "sawtooth", 0.4);
  tone(330, 0.18, 0.3, "sawtooth", 0.4);
  tone(220, 0.4, 0.5, "sawtooth", 0.4);
}

// 배경음악: 밝은 멜로디를 반복(간단 시퀀서)
const BGM_NOTES = [523, 659, 784, 659, 587, 698, 587, 523]; // 도미솔미 레파레도
const BGM_STEP = 0.28; // 한 음 길이(초)

export function startBGM() {
  if (!ctx || bgmTimer) return;
  let i = 0;
  const step = () => {
    tone(BGM_NOTES[i % BGM_NOTES.length], 0, BGM_STEP * 0.9, "triangle", BGM_VOLUME);
    i++;
  };
  step();
  bgmTimer = setInterval(step, BGM_STEP * 1000);
}

export function stopBGM() {
  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}
