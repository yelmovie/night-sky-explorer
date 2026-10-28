# TRD — 별빛 관측 연구소

- **Project:** Starlight Observation Lab
- **Repository:** `starlight-observation-lab`
- **Topic ID:** `topic-13-night-sky`
- **Target:** Tablet-first Web / PWA-ready
- **Structure:** 5 Stages / 10 Screens
- **Primary stack:** Vite + TypeScript + Phaser 3 + Three.js + HTML/CSS/SVG/Canvas
- **Persistence:** IndexedDB 우선 + localStorage 폴백
- **Backend:** None required
- **Architecture:** Screen 단위 Runtime 전환 + DOM Overlay + EventBus
- **3D Screens:** 01(light), 06(core), 07(core), 09(light), 10(core/reuse)
- **문서 버전:** 1.0
- **작성일:** 2026-08-25

---

## 1. 기술 목표

1. Android 학교 태블릿과 iPad Safari에서 안정적으로 실행한다.
2. Phaser와 Three.js는 현재 Screen에 필요한 Runtime만 활성화한다.
3. 3D는 공간 관찰·회전·배치가 학습에 직접 필요한 Screen에만 사용한다.
4. 모든 한글 학습 UI는 DOM/CSS/SVG로 구현한다.
5. 천문 콘텐츠와 학습 규칙은 렌더 코드와 분리된 versioned JSON으로 관리한다.
6. 관측·예측·증거·별자리 패턴을 serializable state로 저장한다.
7. 외부 앱, GPS, 카메라, 기기 센서를 필수 요구하지 않는다.
8. DeviceOrientation은 선택 기능이며 manual drag fallback을 항상 제공한다.
9. 백엔드 없이도 단독 실행·이어하기가 가능하다.
10. Science World 허브와는 `MissionResult` 계약으로 결합한다.
11. 실제 관측자료/학습모형/학습용 시간 시퀀스를 데이터 레벨에서 구분한다.
12. 화면 전환 시 RAF, WebGL 자원, listener, timer, tween, Audio node가 누적되지 않게 한다.

---

## 2. 권장 기술 스택

```text
Vite
TypeScript (strict: true)

Phaser 3
  - Screen 02, 03, 04, 05, 08
  - pan/drag, pinch proxy, mask, timeline, capture, 2D/2.5D interaction

Three.js
  - Screen 01, 06, 07, 09, 10
  - observatory diorama, planet viewer, solar-system builder, star dome, final restoration

HTML / CSS / SVG
  - 모든 한글 텍스트
  - HUD / MissionPanel / ResearchNotebook
  - EvidencePanel / TimelineControls
  - Modal / Toast / Settings / ResultPanel

Canvas 2D
  - 관측 썸네일
  - 별자리 학생 trace
  - 결과 카드 PNG

IndexedDB
  - lesson state
  - observation metadata
  - prediction/evidence/trace

localStorage
  - small settings
  - IndexedDB 실패 시 최소 진행 폴백

Web Audio API
  - BGM / SFX

PWA / Service Worker
  - 앱 셸 및 필수 저용량 자산 캐시
```

대형 물리엔진은 필수 의존성으로 추가하지 않는다.

---

## 3. 런타임 아키텍처

```text
Science World Hub
        │ portal enter
        ▼
TopicHost
├─ TopicRouter
├─ TopicStateMachine
├─ TopicEventBus
├─ RuntimeManager
│  ├─ PhaserRuntime
│  ├─ ThreeRuntime
│  └─ CanvasOverlayRuntime
├─ DOMOverlayManager
├─ AssetManager
├─ AudioManager
├─ DeviceCapabilities
├─ ObservationService
├─ SaveService
├─ RecoveryMissionService
└─ MissionResultAdapter
        │
        ▼
Starlight Observation Lab
        │
        └─ MissionResult → Science World Hub
```

### Runtime 원칙
- Screen 진입 시 필요한 renderer만 resume한다.
- 숨겨진 renderer는 단순 opacity 0이 아니라 animation loop 자체를 중지한다.
- Three.js 종료 시 geometry/material/texture/controls/mixer/listener를 dispose한다.
- Phaser 종료 시 timer/tween/input/event listener를 제거한다.
- DOM modal/panel은 Screen 전환 시 명시적으로 unmount한다.

---

## 4. 레이어 구조

```html
<div id="lesson-shell">
  <div id="three-root" aria-hidden="true"></div>
  <div id="phaser-root" aria-hidden="true"></div>
  <canvas id="annotation-layer"></canvas>
  <div id="ui-overlay"></div>
</div>
```

- `three-root`: 3D 장면
- `phaser-root`: 2D/2.5D 상호작용
- `annotation-layer`: 학생 선·마킹·결과 썸네일
- `ui-overlay`: 접근 가능한 한글 UI

---

## 5. Screen별 Runtime

| Screen | Runtime | 3D 수준 | 핵심 |
|---|---|---|---|
| 01 | Three.js + DOM | light | 연구소 허브 |
| 02 | Phaser + DOM | 2.5D | 망원경 조준·초점 |
| 03 | Phaser + SVG + DOM | 2.5D | 달 표면 확대·비교 |
| 04 | Phaser + DOM | none | 달 시간 시퀀스 |
| 05 | Phaser + SVG + DOM | none | 예측·중첩 비교 |
| 06 | Three.js + DOM | core | 행성 회전·스캔 |
| 07 | Three.js + DOM | core | 태양계 모형 구성 |
| 08 | Phaser + SVG + DOM | 2.5D | 별/행성 근거 판별 |
| 09 | Three.js + Canvas/SVG + DOM | light | 별자리 관측 돔 |
| 10 | Three.js + DOM | core reuse | 오류복구·최종 복구 |

Screen 09에서 별 연결선은 Three.js line보다 Canvas/SVG overlay를 우선하여 수정·접근성·저장을 단순화한다.

---

## 6. 권장 디렉터리 구조

```text
starlight-observation-lab/
├─ public/
│  ├─ assets/
│  │  ├─ bg/
│  │  ├─ ui/
│  │  ├─ moon/
│  │  ├─ planets/
│  │  ├─ stars/
│  │  ├─ props/
│  │  ├─ fx/
│  │  ├─ audio/
│  │  └─ models/
│  │     ├─ observatory_hub.glb
│  │     └─ dome_interior.glb
│  └─ manifest.webmanifest
├─ src/
│  ├─ app/
│  │  ├─ bootstrap.ts
│  │  ├─ router.ts
│  │  └─ TopicAdapter.ts
│  ├─ core/
│  │  ├─ EventBus.ts
│  │  ├─ RuntimeManager.ts
│  │  ├─ AssetManager.ts
│  │  ├─ AudioManager.ts
│  │  ├─ DeviceCapabilities.ts
│  │  └─ DisposableRegistry.ts
│  ├─ state/
│  │  ├─ StarlightState.ts
│  │  ├─ StarlightStore.ts
│  │  ├─ migrations.ts
│  │  └─ persistence.ts
│  ├─ content/
│  │  ├─ lesson.manifest.json
│  │  ├─ stages.json
│  │  ├─ moon_observation_sequence.json
│  │  ├─ planet_observation_data.json
│  │  ├─ solar_system_model.json
│  │  ├─ star_planet_evidence.json
│  │  ├─ constellation_data.json
│  │  ├─ feedback.json
│  │  └─ recovery_rules.json
│  ├─ services/
│  │  ├─ ObservationService.ts
│  │  ├─ MoonTimelineService.ts
│  │  ├─ PlanetEvidenceService.ts
│  │  ├─ SolarSystemBuilderService.ts
│  │  ├─ StarPlanetClaimService.ts
│  │  ├─ ConstellationService.ts
│  │  ├─ RecoveryMissionService.ts
│  │  ├─ SaveService.ts
│  │  └─ MissionResultAdapter.ts
│  ├─ screens/
│  │  ├─ P01ObservatoryHub/
│  │  ├─ P02MoonAcquire/
│  │  ├─ P03MoonSurface/
│  │  ├─ P04MoonTimeline/
│  │  ├─ P05MoonPrediction/
│  │  ├─ P06PlanetViewer/
│  │  ├─ P07SolarSystemBuilder/
│  │  ├─ P08StarPlanetEvidence/
│  │  ├─ P09ConstellationDome/
│  │  └─ P10FinalRestoration/
│  ├─ ui/
│  │  ├─ ProgressBar.ts
│  │  ├─ ResearchNotebook.ts
│  │  ├─ EvidencePanel.ts
│  │  ├─ MissionPanel.ts
│  │  ├─ RewardModal.ts
│  │  ├─ Toast.ts
│  │  ├─ BottomBar.ts
│  │  └─ SettingsPanel.ts
│  └─ types/
│     ├─ astronomy.ts
│     ├─ events.ts
│     ├─ mission.ts
│     └─ state.ts
└─ docs/
   ├─ PRD.md
   ├─ TRD.md
   ├─ CONTENT_VALIDATION.md
   ├─ ASSET_MANIFEST.md
   └─ TEST_PLAN.md
```

기존 Science World 코드 구조가 이미 안정적이면 이름을 강제로 개편하지 말고 책임 경계만 적용한다.

---

## 7. 핵심 상태 모델

```ts
interface StarlightLessonState {
  schemaVersion: number;
  currentPage: string;
  unlockedStages: number[];
  completedStages: number[];
  stageAttempts: Record<string, number>;
  moonSurface: MoonSurfaceRecord;
  moonTimeline: MoonTimelineRecord;
  planetResearch: PlanetResearchRecord;
  solarSystem: SolarSystemRecord;
  starPlanet: StarPlanetRecord;
  constellation: ConstellationRecord;
  misconceptionTags: string[];
  settings: LessonSettings;
  updatedAt: string;
}
```

```ts
interface MoonSurfaceRecord {
  acquired: boolean;
  focusScore: number;
  observedRegions: Array<{
    id: string;
    x: number;
    y: number;
    zoom: number;
    tags: string[];
    snapshotId?: string;
  }>;
  comparisonCompleted: boolean;
}
```

```ts
interface MoonTimelineRecord {
  observedSteps: Array<{
    stepId: string;
    phaseKey: string;
    capturedAt: string;
  }>;
  predictions: Array<{
    targetStepId: string;
    predictedShape: number;
    actualShape: number;
    similarity: number;
    revised: boolean;
  }>;
}
```

```ts
interface PlanetEvidence {
  planetId: string;
  evidenceIds: string[];
  selectedClaim?: string;
  confirmed: boolean;
}
```

```ts
interface ConstellationRecord {
  observationSetId: string;
  studentEdges: Array<[string, string]>;
  referenceEdgesViewed: boolean;
  observedConstellationIds: string[];
  sensorModeUsed: boolean;
}
```

내부 `similarity`, shape value 등은 학생에게 천문 수치로 가르치기 위한 값이 아니라 UI 비교/복구용 데이터다.

---

## 8. 콘텐츠 JSON 정책

### `moon_observation_sequence.json`
필드 예:
- `stepId`
- `phaseKey`
- `displayAsset`
- `observationHint`
- `namedCheckpoint`
- `sequenceOrder`

실시간 천문 계산을 쓰지 않는 기본 버전은 실제 날짜 대신 검수된 **학습용 관측 시퀀스**를 사용한다.

### `planet_observation_data.json`
필드 예:
- `planetId`
- `displayName`
- `textureAsset`
- `surfaceAppearanceTags`
- `evidenceHotspots`
- `grade4SafeFacts`
- `excludedFacts`

정확한 물리량은 핵심 판정 데이터에 넣지 않는다.

### `constellation_data.json`
필드 예:
- 검수된 `starId`
- `position` 또는 RA/Dec 기반 좌표
- `referenceEdges`
- `constellationId`
- `sourceNote`
- `grade4Scope: "polaris_vicinity_observation"`

별자리 위치를 시각 디자이너가 임의로 만들어서는 안 된다.

---

## 9. EventBus 계약

```ts
type LessonEvent =
  | { type: "page:enter"; pageId: string }
  | { type: "page:ready"; pageId: string }
  | { type: "observation:add"; category: string; payload: unknown }
  | { type: "moon:captured"; regionId: string }
  | { type: "moon:predictionSaved"; targetId: string }
  | { type: "moon:predictionVerified"; targetId: string; similarity: number }
  | { type: "planet:evidenceAdded"; planetId: string; evidenceId: string }
  | { type: "planet:claimSubmitted"; planetId: string; claimId: string }
  | { type: "solarSystem:modelChanged"; payload: unknown }
  | { type: "starPlanet:claimSubmitted"; targetId: string; claim: string }
  | { type: "constellation:traceChanged"; edgeCount: number }
  | { type: "stage:complete"; stage: number }
  | { type: "save:request" }
  | { type: "audio:play"; key: string }
  | { type: "lesson:complete"; result: MissionResult };
```

규칙:
- DOM UI가 Phaser/Three 객체에 직접 접근하지 않는다.
- payload는 serializable하게 유지한다.
- Stage 완료/보상 이벤트에는 idempotency guard를 둔다.

---

## 10. Screen 구현 상세

### P01 Observatory Hub
Three.js:
- 고정 3/4 카메라
- 5개 장치 hotspot
- Raycaster
- Stage 상태에 따른 emissive/light 변경
- 자유 이동 없음

DOM:
- 제목/진행도
- Stage 목표
- 연구노트
- 이어하기

P10에서 동일 scene을 재사용할 수 있도록 `worldState: damaged | restoring | restored`로 구성한다.

### P02 Moon Acquire
Phaser:
- panorama pan
- circular telescope mask
- pinch scale
- circular drag focus
- capture

판정:
- 달 중심이 관측 원 안
- zoom 범위 적정
- focus threshold 통과
- 짧은 유지시간 충족

fallback:
- +/- 확대 버튼
- focus slider/키보드

### P03 Moon Surface
- 고해상도 달 자료
- ROI magnifier
- annotation pin
- crop snapshot
- A/B comparison board

정답 좌표 하나 대신 `validObservationZones`를 polygon/mask로 넓게 정의한다.

### P04 Moon Timeline
- timeline scrubber
- 검수된 phase sequence
- capture
- 개인 관측 달력

실제 천문 계산을 사용하지 않으면 `학습용 시간 압축 관측` 표시를 강제한다.

### P05 Moon Prediction
- prediction mask editor
- prediction lock
- actual reveal
- alpha overlay
- optional revise

픽셀 일치율은 보너스 자기점검에만 쓰고 벌점형 점수로 사용하지 않는다.

### P06 Planet Viewer
Three.js:
- 공통 sphere geometry
- 행성별 texture/material
- 제한된 orbit/rotate
- pinch zoom
- raycast hotspot
- ring mesh

성능상 8개의 개별 고폴리 GLB보다 texture 기반 공통 mesh를 우선한다.

### P07 Solar System Builder
Three.js:
- 태양 중심
- 학습용 orbit slot
- select→slot 또는 drag placement
- previous evidence panel
- full model rotate

`isNotToScale: true`를 데이터와 UI에서 강제한다.

### P08 Star / Planet Evidence
Phaser + SVG:
- starfield pan/zoom
- target select
- evidence panel
- claim→reason line connection

`claim + reason` 쌍을 검증한다.

### P09 Constellation Dome
Three.js:
- inverted sphere 또는 Point cloud
- 북극성 주변 관측 view
- manual drag rotate
- optional orientation

Canvas/SVG:
- student edge
- reference edge
- overlay

센서 데이터는 저장하지 않는다.

### P10 Final Restoration
- P01 3D scene 재사용
- misconception tag 기반 최대 3개 micro mission
- 5 data core 연결
- dome open
- DOM result panel
- Canvas 결과 카드 export

---

## 11. 달 변화 표현 엔진

달 변화는 **천체역학 원인을 설명하는 물리 시뮬레이션**으로 만들지 않는다.

권장:
- 검수된 `phaseKey` 시퀀스
- 중간 단계는 mask interpolation
- 교과서 용어는 검수된 checkpoint에서만 표시
- 태양-지구-달 궤도 배치로 원인을 설명하는 화면은 본편에서 제외

내부 key 예:
```text
waxing_crescent
first_quarter
waxing_gibbous
full
waning_gibbous
last_quarter
waning_crescent
```

---

## 12. 별/행성 판별 엔진

```ts
interface StarPlanetChallenge {
  id: string;
  observationType: "star" | "planet";
  evidenceIds: string[];
  requiredReasonId: string;
  displayAsset: string;
}
```

금지 근거:
- “더 크게 보이면 별”
- “더 밝으면 무조건 행성”
- 화면상의 스타일 차이만으로 판정

필수 핵심 근거:
- 별은 스스로 빛을 내는 천체

---

## 13. 태양계 모형 정확성 정책

- 태양 + 8개 행성
- 시각적 특징은 단순화 가능하지만 잘못된 특징 추가 금지
- 실제 거리·크기 축척 시뮬레이션은 기본 구현하지 않음
- `isNotToScale=true` 필수
- 행성 텍스처는 자체 제작 검수본 또는 적법한 라이선스 자료 사용
- 실제 사진 사용 시 출처 기록
- stylized texture 사용 시 “학습모형” 표시

---

## 14. 별자리 정확성 정책

필수:
- 4학년 범위는 **북극성 주변 별자리 관찰**
- star position / constellation name / reference edge를 검수된 데이터로 관리
- 미술적 편의를 위해 위치 관계를 과도하게 왜곡하지 않음

선택 구현:
- 실제 RA/Dec → unit vector 변환
- 밝기 표시만 가독성을 위해 비선형 조절 가능

```ts
interface StarPoint {
  id: string;
  position: [number, number, number];
  magnitudeDisplay: number;
}

interface ConstellationEdge {
  from: string;
  to: string;
}
```

---

## 15. 저장 정책

### IndexedDB stores
```text
lesson_state
observation_snapshots
result_cards
```

### localStorage
```text
starlight.settings
starlight.progress.fallback
starlight.schemaVersion
```

### 저장 시점
- page checkpoint
- stage complete
- 관측 캡처
- prediction verification
- `visibilitychange → hidden`

### migration
- `schemaVersion` 필수
- 알 수 없는 필드는 무시
- 손상된 state는 전부 삭제하지 말고 `lastGoodCheckpoint` 복구 우선

---

## 16. Route Guard

```text
/p01 → always
/p02 → Stage 1 unlocked
/p03 → P02 checkpoint
/p04 → Stage 1 complete
/p05 → P04 checkpoint
/p06 → Stage 2 complete
/p07 → P06 checkpoint
/p08 → Stage 3 complete
/p09 → Stage 4 complete
/p10 → Stage 5 complete
```

교사용 전체 해금은 Science World 공통 flag만 사용한다.

---

## 17. MissionResult 계약

```ts
interface MissionResult {
  topicId: "topic-13-night-sky";
  completed: boolean;
  completedStages: number[];
  achievementKeys: string[];
  evidenceSummary: {
    moonRegionsObserved: number;
    moonPredictionsVerified: number;
    planetsInvestigated: number;
    starPlanetClaimsVerified: number;
    constellationsObserved: number;
  };
  misconceptionTags: string[];
  completedAt: string;
}
```

학생 이름·실제 위치는 포함하지 않는다.

---

## 18. 에셋 정책

### 3D
- GLB/glTF
- Meshopt/Draco 선택
- KTX2 선택
- 화면별 lazy load
- 반복 sphere geometry 공유

### 2D
- WebP 우선
- alpha 필요한 UI/FX는 PNG/WebP alpha
- 달 표면 확대용 자료는 충분한 원본 해상도 확보

### UI
- SVG 우선
- 텍스트가 박힌 이미지 금지

권장 주요 자산:
```text
observatory_hub.glb
dome_interior.glb
moon_full_highres.webp
moon_surface_detail.webp
moon_phase_masks.webp
planet_mercury.webp
planet_venus.webp
planet_earth.webp
planet_mars.webp
planet_jupiter.webp
planet_saturn.webp
planet_uranus.webp
planet_neptune.webp
saturn_ring.webp
starfield_tile.webp
constellation_data.json
result_frame.webp
```

---

## 19. 오디오

권장:
- Main BGM
- Stage 1~5 BGM 또는 테마 변주
- telescope move
- focus lock
- capture
- scan
- hologram snap
- evidence connect
- constellation trace
- dome open

규칙:
- 첫 사용자 제스처 전 autoplay 금지
- mute 상태에서도 모든 피드백 이해 가능
- 효과음이 정답 여부의 유일 신호가 되지 않음

---

## 20. 성능 예산

보수적 목표:
- 1024×576 이상 가로형 태블릿
- 저사양 기기 30fps 우선
- DPR 상한 1.5~2.0
- 초기 Screen 자산 6MB 내외 목표
- 개별 핵심 3D Screen 추가 다운로드 8MB 이하 목표
- 전체 핵심 자산 35MB 이하 권장

최적화:
- lazy loading
- renderer/texture dispose
- offscreen animation stop
- texture atlas
- shared geometry
- `THREE.Points`/instancing for stars
- particle 수 제한
- postprocessing 최소화

---

## 21. 접근성

- pointer + mouse + keyboard fallback
- 주요 터치 타깃 44px 이상
- 색만으로 상태 구분 금지
- `prefers-reduced-motion`
- 별 선택 확대 hit area
- 3D 상태를 DOM text와 동기화
- 타이머 기반 실패 없음
- sensor permission 없이 완주 가능
- pinch 없이 +/- 버튼 가능

---

## 22. 개인정보/권한

수집하지 않음:
- 학생 실명 지속 저장
- 이메일
- 학교/학급
- GPS
- 카메라 영상
- 마이크
- DeviceOrientation raw log

결과 카드 이름 입력은 렌더 직전 메모리에서만 사용하고 저장하지 않는다.

---

## 23. 테스트 전략

### Unit
- MoonTimelineService
- MoonPrediction similarity/validation
- PlanetEvidenceService
- SolarSystemBuilderService
- StarPlanetClaimService
- ConstellationService
- RecoveryMissionService
- state migration

### Content validation
- 본편 standard code가 `[4과13-01..03]` 이외로 확장되지 않는지 검사
- 6학년 코드가 core assessment JSON에 들어오지 않는지 검사
- 행성 8개 구성 검증
- `isNotToScale` 누락 검사
- constellation edge의 star id 존재 검사
- 별/행성 이유 key 검수

### Route smoke
- P01→P10 정상
- 새로고침 복구
- 직접 URL 우회 차단
- teacher unlock 별도

### Device
- Android Chrome
- iPad Safari
- Windows Chrome/Edge
- orientation denied
- reduced motion
- audio muted

### Stress
- 빠른 연타
- Screen 왕복 20회
- modal 연속 열기
- hidden/visible 반복
- WebGL context loss 대응 가능 시 확인

---

## 24. 교육 검수 체크리스트

- [ ] [4과13-01] 달 모양·표면·변화 관찰이 실제 행동으로 구현됨
- [ ] [4과13-02] 태양계 구성원과 태양·행성 조사가 구현됨
- [ ] [4과13-03] 별 정의와 북극성 주변 별자리 관찰이 구현됨
- [ ] 달 위상 원인을 필수 설명하지 않음
- [ ] 달 자전·공전/뒷면 이유를 본편 평가하지 않음
- [ ] 북극성 “찾기” 상위 학년 활동을 필수 평가하지 않음
- [ ] 실제/모형/학습용 시퀀스 구분 표시
- [ ] 태양계가 실제 축척이라고 오해할 표현 없음
- [ ] 별자리 좌표/edge 데이터 검수됨
- [ ] UFO/외계인 추측을 과학 사실로 다루지 않음

---

## 25. 완료 판정 기준

- [ ] 10 Screens end-to-end 실행
- [ ] 5 Stages 순차 해금
- [ ] 최소 10종 이상의 의미 있는 상호작용 구현
- [ ] P06/P07 3D 조작이 학습 판정과 연결
- [ ] P09 sensor fallback 확인
- [ ] P10 개인 오류복구 최대 3개
- [ ] 저장/복구 동작
- [ ] MissionResult 반환
- [ ] 한글을 WebGL texture에 굽지 않음
- [ ] 화면 전환 후 renderer/listener 누수 없음
- [ ] 실제 `package.json` scripts와 문서의 install/typecheck/lint/test/build 명령 일치
- [ ] 태블릿 성능/접근성 검수 기록 남김

---

## 26. 기술 비목표

- N-body simulation
- 실시간 천문력/GPS 기반 스카이맵
- AR 카메라 합성
- 실시간 멀티플레이
- 서버 계정
- 무거운 physics engine
- 모든 Screen 3D화
- Stellarium/Sky Tonight UI 재현
