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
  "checkedAt": "2026-11-12",
  "method": "교육부 고시 페이지와 경기도교육청 2025 초등 학교교육과정 편성 안내 PDF 66~67쪽에서 성취기준·해설 대조.",
  "supportingSource": "https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202412300909035131.pdf",
  "needsReview": true,
  "reviewer": null,
  "license": "교육부 고시문 인용. 과학 자료·에셋의 이용 조건은 각각 별도."
};
// Each observation and explanation page carries one short, visible science idea.
export const pageConcepts = {
  s1a: { standard: '[4과13-01]', concept: '배율을 높이면 같은 달이 더 크게 보여요.' },
  s1b: { standard: '[4과13-01]', concept: '달 표면에는 밝은 곳, 어두운 곳, 구덩이가 있어요.' },
  s2a: { standard: '[4과13-01]', concept: '달의 모양은 약 한 달마다 되풀이돼요.' },
  s2b: { standard: '[4과13-01]', concept: '여러 날의 기록으로 달의 다음 모습을 예상해요.' },
  s3a: { standard: '[4과13-02]', concept: '행성마다 표면, 구름, 고리의 모습이 달라요.' },
  s3b: { standard: '[4과13-02]', concept: '태양 주위를 여덟 행성이 돌아요.' },
  s4a: { standard: '[4과13-03]', concept: '반사는 빛이 물체에 닿아 되돌아오는 거예요.' },
  s4b: { standard: '[4과13-03]', concept: '별은 스스로 빛나요. 행성은 태양빛을 반사해요.' },
  s5a: { standard: '[4과13-03]', concept: '북극성은 북쪽 하늘을 찾는 길잡이예요.' },
  s5b: { standard: '[4과13-03]', concept: '별자리는 별들을 이어 떠올린 모양이에요.' },
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
    "boundary": "행성 크기·거리·성분 암기를 평가하지 않아요. 성분별 묶기는 선택 탐구이며 완료 조건에서 제외해요."
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
