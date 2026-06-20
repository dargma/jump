// ★ 고를 수 있는 캐릭터 = 데이터. 머리카락 색으로 구분(밤에도 잘 보이는 밝은 색).
// 새 캐릭터는 여기에 한 줄 추가하면 시작화면에 자동으로 나타난다.
// hair: 머리색. bald: 옆머리만(반머리). mustache: 콧수염.
// style:"taekwon" → 도복 입고 점프마다 태권도 발차기. belt: 띠·머리띠 색.
export const CHARACTERS = [
  { id: "blue",    name: "파랑이",   hair: [70, 150, 255] },
  { id: "taekwon", name: "태권소년", hair: [55, 48, 58], style: "taekwon", belt: [220, 45, 45] },
  { id: "green",   name: "초록이",   hair: [70, 200, 120] },
  { id: "uncle",   name: "아저씨",   hair: [120, 120, 130], bald: true, mustache: true, suit: true },
];

// 시작화면에서 고른 캐릭터(게임/다시하기에서 공유).
export const selected = { index: 0 };
