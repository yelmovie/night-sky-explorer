# 별빛 관측 연구소 · 3D 기본 그림과 고도화 에셋

2026-10-22 제작안. 메인·시설 내부·엔딩은 2D, 선택 지도만 2.5D 픽셀 RPG. 실제 3D로 전환할 대상은 3장 조사대 안의 행성 8개다. 현재는 생성한 기본 그림으로 관찰하고 기존 구체 뷰어는 선택적으로 사용할 수 있게 한다.

## 필요한 이미지 13종

|파일|용도|형식|3D 전환|
|---|---|---|---|
|world.png|길과 여섯 시설이 연결된 전체 숲 지도|16:9 픽셀아트|전환하지 않음|
|student.png|주인공 학생 보행 4방향×4프레임|투명 시트|전환하지 않음|
|rabbit-walk.png|달토끼 동행 보행 4방향×4프레임|투명 시트|전환하지 않음|
|mercury.png|수성의 충돌 구덩이 비교|투명 정사각|구체+텍스처|
|venus.png|금성의 구름 외형 비교|투명 정사각|구체+구름 재질|
|earth.png|지구의 바다·대륙·구름 비교|투명 정사각|구체+검수된 지도|
|mars.png|화성의 붉은 표면·무늬 비교|투명 정사각|구체+텍스처|
|jupiter.png|목성의 줄무늬·소용돌이 비교|투명 정사각|구체+구름 재질|
|saturn.png|토성의 고리·대기 관찰|투명 정사각|구체+분리 고리|
|uranus.png|천왕성 외형 자유 관찰|투명 정사각|구체+대기 재질|
|neptune.png|해왕성 외형 자유 관찰|투명 정사각|구체+대기 재질|
|telescope-frame.png|CSS 원만 있던 망원경의 실제 장비 외관|투명 정사각|전환하지 않음|
|dome-restored.png|내 기록으로 복구한 중앙 돔 보상 장면|16:9 2D|전환하지 않음|

## 행성 생성 공통 프롬프트

Create ONE isolated high-quality educational planet reference image on a TRUE transparent RGBA background. Square composition 1024x1024. A single perfectly round complete planetary globe, centered, with generous 15 percent clear margin; Saturn rings must also fit. Sophisticated soft 2D game illustration with scientifically credible materials and restrained colors, coherent gentle illumination from upper left, enough detail for elementary students to compare. This is an illustrated model, not a real telescope photograph. No text, labels, stars, orbit lines, moons, pedestal, groundplane, UI, glow outlines, watermarks or checkerboard. Subject:



### mercury

Mercury: muted warm-gray cratered rocky globe with many fine impact craters and subtle lighter markings, smooth sphere silhouette, no clouds or atmosphere.

### venus

Venus: pale cream ivory sphere entirely enclosed by a thick softly textured cloud layer, very subtle cloud contrast. No visible rocky ground or lava.

### earth

Earth: blue oceans, recognizable present-day African and Eurasian continental shapes at center, green and tan land, Antarctic white polar ice and soft white cloud systems. Accurate credible simplified modern geography, no invented islands.

### mars

Mars: muted rusty red and dusty ochre rocky sphere, darker brown surface markings, restrained impact craters and tiny pale polar cap. No oceans, giant protruding mountains or lava.

### jupiter

Jupiter: warm cream and muted tawny broad horizontal atmospheric cloud bands, a small oval rusty Great Red Spot south of the equator. Gas giant cloud exterior, no solid surface. Do not add a prominent ring.

### saturn

Saturn: pale cream and muted golden sphere with delicate horizontal atmospheric cloud bands, encircled by ONE coherent broad extremely thin concentric flat ring system. Three-quarter view shows separation between globe and rings, and proper ring occlusion passing behind and in front. Restrained darker Cassini division. All rings entirely inside frame with ample margin. No thick torus or intersecting planes.

### uranus

Uranus: smooth pale cyan blue-green ice giant, restrained subtle atmospheric band variation, gently lit, not turquoise ocean or solid ground. Omit faint rings in this teaching reference, no prominent Saturn-like rings.

### neptune

Neptune: moderately saturated blue-cyan ice giant with subdued cloud-band variation and a few pale cloud streaks. Not electric cobalt blue. No continents or solid ground. Omit faint rings.

## 지도 프롬프트

One coherent 16:9 high-quality crisp-pixel 2.5D RPG observatory forest seen diagonally from above, emerald forest and sapphire blue-hour shadows, warm cream sandy trails and tiny amber lanterns. Paths connect the lower entrance to telescope observatory left, calendar hut upper left, planetary laboratory upper right, starlight deck right, northern lookout lower right, and glass dome at center. Wide continuous readable paths, clear front doors, streams along outer edges, flower beds, benches and brass science props. Full-rectangle terrain, no floating diamond island, UI, text, labels or characters. Initially quiet dark windows. Walking routes and door coordinates will be validated against the actual image.

## 보행 시트 프롬프트

Transparent crisp pixel RPG sheet, equal 4x4 cells. Four rows down/left/right/up, four complete walk-cycle frames per row. Same scale, aligned foot baselines and generous cell padding; no clipping, grids, labels or baked checkerboard. Student: dark bob hair, navy star-clasp cloak, cream shirt, teal satchel, brown boots. Rabbit: retain supplied Moon Rabbit's cream floppy ears, navy gold-trimmed cloak, crescent beret and research satchel. Rabbit uses supplied pose sheet as identity reference. The companion follows the player's actual trail.

## 망원경 프레임 프롬프트

Single front-facing circular telescope eyepiece instrument frame in elegant navy enamel and antique brass, cute sophisticated 2D educational-game illustration. Clear large circular opening at center, truly transparent both inside the opening and outside instrument. No lens image, moon, stars, text, labels, gauges or UI. Narrow detailed rim with four tiny bolts, understated brass highlight and readable dimensional thickness, square composition with full rim inside margins. Observation image is rendered separately inside the opening.

## 복구된 돔 프롬프트

One 16:9 sophisticated soft 2D storybook observatory interior at night: open glass dome frames a peaceful star-filled sky, brass telescope, five research stations and a central glass-and-brass recording core, amber lamps and small cyan status lights now lit. Calm central upper space for live result text. Navy, muted teal, cream, antique gold palette. No characters, text, certificate, UI, giant floating planets or collage. The restored object is the research lab, not the night sky itself.

## 3D 제작 인계

기본 그림을 단일 행성 참고로 사용한다. 정형 구체는 코드로 만들고, 표면의 명암을 깊이로 오인하지 않는다. 중심 피벗·낮은 폴리곤·독립 재질·GLB를 권장한다. 토성 구체와 얇은 고리를 별도 메시로 만든다. 생성한 그림을 그대로 구체 텍스처로 감지 않는다. 최종 지구 대륙·행성 표면·색은 공식 자료로 검수하고 별도의 2:1 basecolor를 준비한다.

## 재미·학습 고도화

관찰2회와 비교2회, 늘어난 사례, 처음 생각과 수정 생각의 보존, 시설 불빛 복구, 학생+달토끼 동행, 선택 응용 도전, 실제 다섯 증거로 여는 중앙 돔을 묶는다. 시간 제한과 오답 벌점 대신 조작 결과와 새 단서를 사용한다. 달 위상·별 좌표·태양계 순서·문구·버튼은 이미지에 굽지 않고 코드로 유지한다.

