# CLAUDE.md — 졸라맨 점프 (Doodle Prince)

8살 은찬이를 위한 두들점프 클론. 졸라맨이 공주를 구하러 끝없이 위로 올라간다.

## 프로젝트 목표
- 두들점프 핵심 메커니즘을 그대로: 자동 점프, 좌우 이동, 양옆 순환, 위로만 가는 카메라, 무한 절차생성 발판.
- 에셋 없이 선·도형으로 먼저 만들고, 나중에 이미지로 교체 가능하게 구조화.
- **손맛 숫자는 코드와 분리** — `config/tuning.js` 만 바꿔서 게임 느낌 조정.

## 기술 스택
- 엔진: [Kaplay](https://kaplayjs.com) — CDN 로드, 빌드 설정 없음.
- 정적 사이트. `index.html`을 브라우저로 열면 끝. 의존성 최소화.
- ES 모듈(`<script type="module">`)로 `src/`, `config/` 를 불러온다.

## 폴더 구조
```
doodle-prince/
├─ index.html        # 진입점. Kaplay CDN 로드 + main.js 실행
├─ src/              # 게임 로직
│  ├─ main.js        #   Kaplay 초기화 + 씬 등록 + 시작
│  ├─ player.js      #   졸라맨: 자동 점프, 좌우 이동, 양옆 순환
│  ├─ platform.js    #   발판 생성 / 무한 절차생성 / 재활용
│  ├─ item.js        #   아이템 스폰 + 효과 발동 (데이터는 config/items.js)
│  ├─ draw.js        #   선·도형으로 졸라맨/발판 그리기 (나중에 이미지 교체 지점)
│  └─ scenes/
│     ├─ game.js     #   게임 플레이 씬 (카메라, 점수, 게임오버 판정)
│     └─ gameover.js #   게임오버 + 다시하기
├─ config/
│  ├─ tuning.js      # ★ game feel 숫자 (중력/점프/이동/카메라/발판 간격)
│  └─ items.js       # ★ 아이템 정의 (데이터)
├─ assets/           # 나중에 이미지/사운드
├─ GDD.md            # 게임 디자인 문서
└─ CLAUDE.md         # 이 파일
```

## 자주 하는 작업 — 어느 파일을 고치나?

| 하고 싶은 것 | 고칠 파일 |
|---|---|
| 점프가 너무 낮다/높다, 너무 빠르다/느리다 | `config/tuning.js` |
| 좌우 이동이 굼뜨다 | `config/tuning.js` |
| 카메라가 너무 빨리/느리게 따라온다 | `config/tuning.js` |
| 발판 간격을 넓히고/좁히기 | `config/tuning.js` |
| **새 아이템 추가** | `config/items.js` 에 데이터 정의 → `src/item.js` 에 효과 로직 |
| 아이템 효과 지속시간/등장확률 | `config/items.js` |
| 졸라맨/발판 **모양**을 바꾸기 | `src/draw.js` |
| 그림을 이미지로 교체 | `src/draw.js` (그리는 함수만 교체) + `assets/` |
| 게임오버/다시하기 화면 | `src/scenes/gameover.js` |

## 새 캐릭터/아이템 추가 가이드
- **아이템**: `config/items.js` 에 `{ id, name, color, duration, spawnChance, desc }` 추가 →
  `src/item.js` 의 효과 함수(`applyEffect`)에 `case id:` 한 줄 추가. 끝.
- **캐릭터 외형**: `src/draw.js` 의 `drawPlayer()` 만 교체. 물리/조작은 `player.js` 그대로.

## 코드 컨벤션
- **config(바꿀 값) ↔ src(로직) 분리.** 매직넘버를 src에 직접 쓰지 말 것 → `tuning.js` 로.
- 함수는 짧게. 한 함수 = 한 가지 일.
- 주석은 한글. "무엇"보다 "왜"를 적는다.
- 파일/함수 이름은 영어 소문자 camelCase, 데이터 키는 명확하게.
- 좌표계: Kaplay는 y가 아래로 증가. "위로 올라간다"는 y가 **작아지는** 것.

## 실행 방법
`index.html`을 브라우저로 직접 열거나, 로컬 서버로 띄운다 (ES 모듈은 보통 서버 필요):
```
npx serve doodle-prince
# 또는
python -m http.server   # doodle-prince 폴더 안에서
```
