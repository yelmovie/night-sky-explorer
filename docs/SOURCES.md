# 과학 자료와 에셋 출처

확인일: 2026-10-22. 자료를 바탕으로 초등 관찰 활동용 문장을 새로 구성했다. 아래 링크는 제작·교사 검토용 출처이며 학생 활동은 외부 페이지 이동 없이 진행한다.

## 교육과정 대조

- [교육부 고시 제2022-33호 공식 게시](https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&search=): 2022-12-22 고시, 과학과는 별책9에 해당함을 확인했다.
- [경기도교육청 「깊이있는 수업 프레임워크 부록(3~4학년군)」](https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202411110127574203.pdf): 부록2 인쇄85쪽의 [4과13-01~03]을 제공 PRD의 동일 코드·문장과 대조해 일치를 확인했다. 교육부 첨부 ZIP의 고시본 자체를 다시 내려받아 대조했다는 뜻은 아니다.

프로젝트에 제공된 원문은 `references/documents/starlight-observation-lab_PRD.md` 53·60·67행에 보존돼 있다. 이 게임의 필수 범위는 달의 모습·표면·여러 날 변화 관찰, 태양과 행성 조사, 별의 정의·북극성 주변 배열 관찰이다. 원인 설명, 행성의 구체적인 물리량, 계절별 별자리 추론을 필수 평가로 추가하지 않는다. 세부 활동과 관찰 근거는 `PRD.md`의 목표–활동 매핑을 따른다.

## 과학 자료

- [NASA · About the Planets](https://science.nasa.gov/solar-system/planets/): 태양과 8개 행성, 행성 순서와 주요 외형 특징.
- [NASA · Solar System Facts](https://science.nasa.gov/solar-system/solar-system-facts/): 태양계 구성과 태양의 위치.
- [NASA · Moon Phases](https://science.nasa.gov/moon/moon-phases/): 달의 밝은 부분 변화. 이 앱의 시점은 29.53일 주기를 단순화한 학습 시퀀스이며 실제 날짜의 관측 예보가 아니다.
- [NASA · Sun Facts](https://science.nasa.gov/sun/facts/): 태양은 별이며 스스로 빛을 내는 천체라는 비교 자료.
- [HYG v4.1 · David Nash / Astronomy Nexus](https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md): `src/stars.json`의 13개 별 RA(시간), Dec(도), 겉보기 등급, HIP 식별자. 좌표 기준은 J2000.

## 별 좌표 라이선스

HYG v4.1 데이터는 David Nash의 **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)** 자료다. `src/stars.json`의 발췌·변환 데이터와 별 좌표 투영 자료에도 같은 라이선스가 적용된다. 이 표기는 프로젝트의 다른 원본 자산에 권리를 부여하지 않는다.

원본 CSV: https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv

변경: 카시오페이아자리 주요 5별·북두칠성 7별·북극성만 추출, 필요한 5필드만 보존, 한국어 표시명 추가, 북극 중심 평면으로 투영. 감마 카시오페이아는 카탈로그의 `Cih`/HIP 4427로 식별한다. 연결선은 좌표 데이터와 별도로 구현한 일반적인 학습용 패턴이며 별자리 경계선은 아니다. 북두칠성은 큰곰자리의 일부다. 특정 장소·날짜의 지평좌표를 재현하지 않는다.

`scripts/fetch-stars.py`는 공개 CSV를 스트림으로 읽어 해당 별만 추출한다. 전체 카탈로그를 프로젝트에 저장하지 않는다. 데이터 조회는 개발 시에만 수행했다.

## 그래픽

- 사용자가 제공한 원본: `references/images/backgrounds/chatgpt_generated_31.png`, `branding/chatgpt_generated_41.png`, `characters/chatgpt_generated_42.png`, `characters/chatgpt_generated_43.png`.
- 위 4개를 `public/assets`에 서비스 복사하고 원본은 보존했다. 포즈 시트는 CSS 표시 영역으로 사용한다.
- 새 지도·학생·달토끼·행성8종·망원경 프레임·복구돔은 OpenAI built-in image_gen 생성물13종이다. 원본·SHA256·생성일·서비스 파일은 `references/generated/manifest.json`, 프롬프트는 `ASSET_PRODUCTION_V2.md`·`planet-generation-prompts.json`에 있다.
- 지도와 보행 그림을 Canvas로 합성하고, 달 표면·위상은 SVG 모형, 선택3D 행성은 절차적 학습 텍스처를 쓴다. NASA 촬영 사진이나 검증된 실제 지표 지도라고 표시하지 않는다.
- Jua는 한국어·라틴 WOFF2를 self-host한다. Woowahan Brothers Corp.(2017), SIL Open Font License1.1 원문은 `public/assets/fonts/Jua-OFL.txt`에 동봉했다.
- 제공된 로고·배경·NPC의 외부 배포 권리는 확인하지 않았다. 현재 범위는 로컬 MVP다.
- Three.js: MIT, Vite: MIT. 의존성의 상세 고지는 각 패키지 LICENSE에 있다.
