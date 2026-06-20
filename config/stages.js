// ★ 스테이지 정의 = 데이터. 3개 스테이지를 모두 통과하면 공주를 만난다.
//   climb      : 이 스테이지에서 올라야 하는 점수(높이)
//   sky        : 배경 하늘색 [r,g,b] (스테이지 사이를 부드럽게 전환)
//   dark       : 0(낮)~1(밤). 1에 가까울수록 별이 보이고 졸라맨이 밝게 그려진다
//   reward     : 클리어 시 가방에 넣어주는 아이템 {item, n} (다음 스테이지에서 사용)
//   rewardText : 보상 안내 문구
//   story      : 스테이지 진입 때 보여줄 이야기 한 줄
export const STAGES = [
  { name: "풀숲",     climb: 350, sky: [165, 210, 238], dark: 0.0,  reward: { item: "wing",   n: 2 }, rewardText: "날개 2개 획득!", story: "풀숲을 지나 하늘로 올라가자!" },
  { name: "노을 하늘", climb: 350, sky: [250, 165, 120], dark: 0.15, reward: { item: "rocket", n: 1 }, rewardText: "로켓 획득!",    story: "노을 구름을 넘어 더 높이!" },
  { name: "우주",     climb: 350, sky: [16, 18, 40],    dark: 1.0,  reward: null,                     rewardText: "",            story: "별빛 우주 끝에 공주가 기다려!" },
];

// 시작·엔딩 이야기
export const STORY = {
  intro: "공주가 하늘 성에 갇혔어요!  졸라맨이 구하러 출발!",
  ending: "졸라맨이 공주를 구했어요!  오래오래 행복하게!",
};
