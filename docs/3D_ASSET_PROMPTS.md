# 별빛 관측 연구소 3D 행성 기본 이미지와 프롬프트

2D 행성 조사 화면 안에 들어갈 회전 가능한 행성 8종의 제작 기준이야. 배경·캐릭터·맵·달·별자리·엔딩은 이 3D 목록에 포함하지 않아. 지금은 이미지와 모델을 생성하지 않고, 제작에 사용할 목록과 프롬프트를 정리했어.

## 제작 범위와 순서

기본 이미지 8장으로 외형을 먼저 맞추고, **목성·토성·화성**부터 조작을 검증하는 순서를 제안해. 나머지 5개도 같은 뷰어를 재사용해. 태양은 행성이 아니므로 이 목록 밖의 2D 태양계 화면에서 별도로 다뤄.

행성은 기본 형태가 구체라서, 완성 이미지를 그대로 3D 변환하는 것보다 **코드로 만든 구체 + 표면 텍스처**, 토성은 **구체 + 별도 고리** 방식이 적합해. 아래 1:1 이미지는 외형 기준 이미지이며 구체에 바로 감는 텍스처는 아니야.

## 기본 이미지 목록

| 행성 | 제안 파일명 | 이미지에서 보여줄 특징 | 우선순위 |
|---|---|---|---|
| 목성 | jupiter_reference.png | 크림·황갈색 띠와 큰 소용돌이 | 1차 |
| 토성 | saturn_reference.png | 옅은 황색 구체와 넓고 얇은 고리 | 1차 |
| 화성 | mars_reference.png | 붉은 흙빛 표면과 어두운 영역 | 1차 |
| 수성 | mercury_reference.png | 회갈색의 충돌구 많은 암석 표면 | 2차 |
| 금성 | venus_reference.png | 지표가 드러나지 않는 옅은 크림색 구름층 | 2차 |
| 지구 | earth_reference.png | 바다·대륙·흰 구름 | 2차 |
| 천왕성 | uranus_reference.png | 과장하지 않은 옅은 청록색 구름층 | 2차 |
| 해왕성 | neptune_reference.png | 과장하지 않은 푸른빛 구름층 | 2차 |

표의 파일은 생성 예정 이름이야. 현재 폴더에 완성 파일이 있다는 뜻은 아니야. 태양계의 8행성 구성은 [NASA 행성 안내](https://science.nasa.gov/solar-system/planets/)를 기준으로 해.

## 모든 기본 이미지에 붙일 공통 프롬프트

아래 공통문 뒤에 각 행성의 개별문을 붙여 사용해. 한 번에 행성 한 개만 생성해.

```text
Create one isolated planet reference image for an elementary astronomy learning game. Square 1024 by 1024 composition. Show the entire spherical object centered with generous clear margins; keep the whole ring system inside the frame when applicable. Use a clean, gently simplified scientific illustration style compatible with a deep navy and teal 2D observatory interface. Preserve recognizable natural features; do not turn the planet into a character. Use broad neutral lighting that reveals the visible hemisphere with gentle shading and no dramatic night-side blackout. Plain neutral gray background for easy inspection. No floor, pedestal, telescope, room, stars, moons, orbital paths, labels, text, arrows, UI, faces, watermark, extreme glow, or exaggerated saturation. This is an appearance reference, not a measured scientific map and not a texture atlas.
```

기본 이미지는 외형 검토용이므로 중성 배경을 써. 실제 게임의 행성 뷰어 배경은 투명한 렌더 영역으로 처리해 2D 연구실 위에 얹어.

## 행성별 개별 프롬프트

### 목성

```text
Subject: Jupiter. Show a round gas giant with broad, gently irregular cream, tan and muted brown cloud bands running parallel to the equator. Include one recognizable reddish oval storm in the southern hemisphere, integrated into the cloud pattern rather than painted as a symbol. Keep the poles round and the silhouette smooth. Show no solid rocky ground. Omit the faint ring system in this visible-light teaching reference; never add prominent Saturn-like rings.
```

### 토성

```text
Subject: Saturn. Show a pale cream and muted golden gas giant with subtle horizontal cloud bands, surrounded by one coherent, broad, extremely thin concentric ring system. Use a three-quarter view that clearly shows both the upper ring surface and the separation between the globe and the rings. The rings share one plane, pass correctly behind and in front of the planet, and contain a restrained darker division. Keep every outer ring edge inside the frame. No thick torus, intersecting ring planes, floating fragments, or rocky land surface.
```

### 화성

```text
Subject: Mars. Show a spherical rocky world in muted rusty red, dusty ochre and darker brown tones. Include restrained surface markings and impact craters, with a small pale polar region if visible. Preserve a smooth planetary silhouette: landforms must not look like huge mountains protruding out of a tiny ball. No oceans, vegetation, artificial canals, glowing lava, buildings or rings. Avoid orange neon colors and fantasy geology.
```

### 수성

```text
Subject: Mercury. Show a nearly airless rocky sphere with a muted warm-gray to gray-brown surface, varied impact craters and subtle lighter ejecta markings. Use restrained topographic relief and a smooth global silhouette. No blue atmosphere, clouds, oceans, vegetation, rings or exaggerated mountain spikes. Keep the appearance suitable for a broad visual comparison, without claiming that this invented crater arrangement is an exact map.
```

### 금성

```text
Subject: Venus as seen in an illustrative visible-light exterior view. Show a pale cream to ivory sphere enclosed by a thick, softly textured cloud layer. Keep cloud contrast subtle. The rocky ground must not be visible through the clouds. No red exposed lava landscape, oceans, green continents, Saturn-like bands, rings or neon yellow glow. Do not mix radar surface mapping with the visible cloud appearance.
```

### 지구

```text
Subject: Earth. Show a spherical world with muted blue oceans, recognizable present-day continental shapes in green and tan, white polar ice and soft white cloud systems. Use real geography as the reference, not invented islands or duplicated continents. Do not bake a bright atmosphere glow into the silhouette. No political borders, country labels, city lights, Moon, rings or decorative orbit lines. Use a credible simplified teaching illustration rather than a toy marble.
```

### 천왕성

```text
Subject: Uranus. Show a smooth, pale cyan to blue-green ice giant with very subtle cloud-band variation. Keep the appearance low contrast and gently lit. No solid ground, oceans, continental shapes, cratered surface, bright neon glow or prominent Saturn-like rings. The faint rings are omitted from this simplified visible-light reference; this omission must not imply that Uranus has no rings.
```

### 해왕성

```text
Subject: Neptune. Show a softly modeled blue-cyan ice giant with restrained cloud-band variation and a few delicate pale cloud streaks. Keep saturation moderate; avoid the exaggerated electric-blue appearance of strongly processed imagery. No solid ground, continental shapes, lava or prominent Saturn-like rings. Do not rely on color alone as the identification clue. The faint ring system is omitted from this simplified visible-light reference.
```

## 실제 구체에 사용할 텍스처

기본 이미지의 배경과 명암을 그대로 구체에 감으면 회전할 때 부자연스러워. 표면 텍스처는 별도로 준비해. 정확한 지형·대륙이 필요한 최종 학습 자산은 출처와 사용 조건을 확인한 과학 자료를 우선하고, 생성 텍스처는 검수 전 시안으로 취급해.

행성별 `*_basecolor.png` 8장, 2048×1024의 2:1 위도·경도 전개도를 제안해. 다음 공통문에 위의 행성별 표면 묘사를 붙이되, 구체 렌더·배경·고리·시점 설명은 제거해.

```text
Create a flat full-sphere equirectangular base-color texture draft for [PLANET NAME], 2048 by 1024 pixels, exactly 2:1. The image must cover 360 degrees longitude and 180 degrees latitude with the equator at the horizontal centerline and the poles at the top and bottom edges. Align the left and right boundaries as a continuous wrap. Show only the planet's outer visible surface or cloud appearance, filling the full rectangular frame. No sphere silhouette, perspective, margins, backdrop, labels, rings, satellites, cast shadows, directional illumination, specular highlights or ambient occlusion. Lighting will be added by the 3D renderer. Keep colors restrained and the features coherent around the full globe. This is a draft learning-model texture and must be checked for seams, polar distortion and scientific plausibility before use.
```

목성·토성·금성·천왕성·해왕성의 텍스처는 고체 지면 지도가 아니라 외부에서 보이는 구름 외형을 표현해. 지구 대륙과 수성·화성 지형을 생성 결과만으로 정확한 관측자료라고 소개하지 않아.

### 토성 고리 추가 이미지

제안 파일명 `saturn_rings_rgba.png`, 1024×1024, 투명 배경. 토성 구체와 분리된 얇은 평면 고리용 이미지야. 투명 배경 지원 생성기에서는 투명 옵션도 켜야 해.

```text
Create a Saturn ring texture draft seen exactly perpendicular to its plane, as a perfect centered circular annulus. Square 1024 by 1024 image with true transparent background, a fully transparent circular central hole and transparent space outside the outer edge. Show delicate concentric ivory, pale beige and muted gray bands with one restrained darker division. Flat base color and alpha only: no planet, perspective, thickness, bevel, directional light, cast shadow, stars, text or glow. Keep the ring radially symmetric and entirely inside the frame. Do not draw a checkerboard pattern into the image.
```

이 이미지는 평면 좌표를 그대로 사용하는 고리 재질용이야. 다른 UV 방식을 쓰면 그 방식에 맞춰 고리 텍스처를 변환해야 해.

## 이미지에서 3D로 변환하는 도구를 사용할 경우

복잡한 배경이 있는 기존 시안을 통째로 넣지 말고, 위에서 준비한 단일 행성 기본 이미지만 입력해. 정형 구체는 코드 생성이 우선이며 다음 문장은 변환 도구를 선택할 때의 보조 지시문이야.

```text
Build one lightweight game-ready planet from the supplied isolated reference. Preserve a perfectly round sphere and use color texture for small surface or cloud details; do not convert shadows into dents or protrusions. Keep the object centered at the origin with its pivot at the sphere center. No background geometry, floor, pedestal, labels, stars or moons. For Saturn only, create the globe and a thin, separate concentric ring mesh as separate objects with consistent orientation; do not fuse them into one thick body. Keep geometry modest, provide UVs and separate reusable materials, and export GLB when supported. Do not add animation, characters or extra objects.
```

## 화면에 넣기 전 확인

- 한 번에 행성 하나만 3D로 렌더하고, 화면을 떠나면 렌더링을 멈춰.
- 드래그 회전과 확대·축소가 가능하고, 확대 버튼도 제공해.
- 이름은 처음에 숨길 수 있지만 관측 기록과 후보 판단은 읽을 수 있는 2D UI로 유지해.
- 스캔 표시는 UI로 그려. 텍스처 안에 정답 핀·이름·문구를 굽지 않아.
- 행성 간 화면상 크기는 비교용 확대율이므로 실제 크기 비율처럼 보이게 설명하지 않아.
- WebGL을 쓸 수 없는 경우 검수된 여러 방향의 2D 이미지와 동일한 관측 기록 기능으로 진행할 수 있게 해.
- 토성의 고리 앞뒤 가림, 텍스처 경계선, 지구 대륙, 금성의 구름층, 과장된 행성 색을 점검해.

현재 목록은 제작안이야. 과학 이미지의 세부 외형·색·투영과 최종 수업 문구는 실제 자산 제작 단계에서 공식 관측자료와 대조해야 해.
