// One curriculum source for content, teacher guidance and regression tests.
export const standards = [
  [
    "[4과13-01]",
    "달의 모양과 표면, 달의 위상변화를 관찰하여 밤하늘 관찰에 흥미를 가질 수 있다."
  ],
  [
    "[4과13-02]",
    "태양계 구성원을 알고, 태양과 행성을 조사할 수 있다."
  ],
  [
    "[4과13-03]",
    "별의 정의를 알고, 북극성 주변의 별자리를 관찰할 수 있다."
  ]
];
export const curriculumSource = {
  "title": "교육부 고시 제2022-33호 별책 9 과학과 교육과정",
  "url": "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&search=",
  "checkedAt": "2026-11-10",
  "method": "기존 보존 고시본 HWP 추출 텍스트와 문구 대조. 교사 현장 검수와 구분.",
  "needsReview": true,
  "reviewer": null,
  "license": "교육부 고시문 인용. 과학 자료·에셋의 이용 조건은 각각 별도."
};
export const learningObjectives = [
  {
    "chapter": 1,
    "standardCodes": [
      "[4과13-01]"
    ],
    "objective": "달 표면의 두 곳을 관찰하고 같은 점과 다른 점을 설명해요.",
    "evidence": "서로 다른 배율 사진 2장과 두 표면 비교 기록",
    "misconception": "확대해 크게 보이는 것과 달 자체의 크기가 달라지는 것을 구분해요.",
    "boundary": "달 표면은 학습 모형이며 실제 관측 사진이 아니에요."
  },
  {
    "chapter": 2,
    "standardCodes": [
      "[4과13-01]"
    ],
    "objective": "여러 날의 달 모양을 기록하고 예상과 관찰을 비교해요.",
    "evidence": "전반·후반 6시점 기록, 14일·24일 예상 및 수정 설명",
    "misconception": "구름에 가려 보이지 않는 것과 달의 모양 변화를 구분해요.",
    "boundary": "달 변화의 원인은 필수 평가하지 않으며 날짜는 실제 관측 예보가 아니에요."
  },
  {
    "chapter": 3,
    "standardCodes": [
      "[4과13-02]"
    ],
    "objective": "태양과 행성을 조사하고 표면적인 특징을 자료로 설명해요.",
    "evidence": "6행성 근거 기록과 태양·8행성 순서 모형",
    "misconception": "색 하나로 이름을 정하지 않고 둘 이상의 관찰 자료를 살펴봐요.",
    "boundary": "행성 크기·거리 비율과 물리량 암기를 평가하지 않아요. 무리 나누기는 자료 적용 확장이에요."
  },
  {
    "chapter": 4,
    "standardCodes": [
      "[4과13-03]"
    ],
    "objective": "빛의 근원을 자료로 확인해 별과 행성을 구분해요.",
    "evidence": "8천체의 분류와 빛의 근원 근거 연결",
    "misconception": "밝게 보이는 행성도 별이라고 단정하지 않아요. 태양도 별이에요.",
    "boundary": "망원경이나 눈으로 태양을 직접 관측하지 않아요."
  },
  {
    "chapter": 5,
    "standardCodes": [
      "[4과13-03]"
    ],
    "objective": "북극성 주변 별 배열을 관찰하고 내 연결 패턴을 비교해요.",
    "evidence": "두 영역 6별 관찰, 각각의 자유 연결과 비교 설명",
    "misconception": "별자리 선은 사람이 그은 표시이며 북두칠성은 큰곰자리의 일부예요.",
    "boundary": "기준선 일치를 정답으로 채점하지 않고 계절별 별자리 추론을 평가하지 않아요."
  }
].map(item => ({ ...item, needsReview: true, reviewer: null, source: curriculumSource.url }));
