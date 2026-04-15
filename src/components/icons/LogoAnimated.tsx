'use client';

interface LogoAnimatedProps {
  /** 높이(px). 기본 28 = h-7 */
  size?: number;
}

/**
 * RenTailor 헤더 로고 — 차량 실루엣 + 텍스트 + 밑줄이
 * 하나의 SVG 안에서 골드 빛줄기 애니메이션으로 연결된 통합 컴포넌트.
 *
 * 뷰박스: 0 0 210 32
 *   - 0~73   : 차량 아이콘 (원본 355×140 → scale(0.2056,0.2143))
 *   - 78~210 : "RenTailor" 텍스트 + 밑줄
 *
 * 애니메이션 흐름 (총 4.5s 반복):
 *   0~65%   : 차량 외곽선을 한 바퀴 (SVG animate, pathLength=1 기준)
 *   65~95%  : 차량 우측→밑줄 끝까지 직선 이동
 *   88~98%  : 끝점 스파클 반짝임
 */

const DUR = '4.5s';

// 차체 외곽선 path — 원본 좌표계 (transform 그룹 내에서 사용)
const CAR_PATH =
  'M1965 1144 c-176 -26 -308 -76 -571 -217 -99 -53 -106 -55 -288 -86 ' +
  '-356 -59 -556 -122 -639 -200 -62 -58 -88 -110 -95 -187 -7 -87 1 -110 40 ' +
  '-123 47 -15 242 -33 313 -29 56 3 60 4 60 28 0 25 0 25 -122 31 -146 8 -231 ' +
  '18 -237 28 -3 4 0 38 6 74 19 115 81 168 268 230 118 40 182 54 432 96 189 33 ' +
  '211 41 413 149 230 123 345 152 602 152 90 0 197 -5 236 -11 134 -20 339 -75 ' +
  '480 -130 43 -16 124 -41 181 -54 153 -36 156 -38 156 -82 0 -25 9 -52 26 -77 ' +
  '25 -37 26 -44 21 -132 -3 -50 -10 -101 -16 -112 -9 -17 -72 -41 -211 -81 -32 ' +
  '-10 -34 -45 -2 -49 30 -5 215 53 240 75 28 25 42 75 49 175 6 83 5 88 -25 140 ' +
  '-20 37 -28 62 -25 81 10 52 -14 70 -138 101 -63 16 -199 57 -304 92 -271 90 ' +
  '-413 116 -640 120 -99 1 -193 0 -210 -2z';

export function LogoAnimated({ size = 28 }: LogoAnimatedProps) {
  const viewW = 210;
  const viewH = 32;
  const displayW = Math.round((size * viewW) / viewH);

  return (
    <svg
      width={displayW}
      height={size}
      viewBox={`0 0 ${viewW} ${viewH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RenTailor"
      role="img"
    >
      <defs>
        {/* 텍스트 골드 그라데이션 */}
        <linearGradient id="la-goldText" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#7A6628" />
          <stop offset="50%"  stopColor="#B8923A" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>

        {/* 빛줄기 글로우 필터 */}
        <filter id="la-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* 스파클 글로우 필터 */}
        <filter id="la-sparkGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ─────────────────────────────────────────────────
          1. 차량 fill 본체
          원본 355×140 → scale(0.2056, 0.2143) 영역으로
      ───────────────────────────────────────────────── */}
      <g transform="translate(0,1) scale(0.2056,0.2143)">
        <g transform="translate(0,140) scale(0.1,-0.1)" fill="#C9A84C" stroke="none">
          {/* 차체 */}
          <path d={CAR_PATH} />
          {/* 작은 디테일 */}
          <path d="M1447 826 c-34 -14 -2 -18 63 -8 55 8 55 8 7 13 -26 2 -58 0 -70 -5z" />
          {/* 왼쪽 바퀴 */}
          <path
            className="la-wheel"
            d="M1004 680 c-55 -17 -127 -73 -158 -123 -77 -125 -7 -293 135 -327
83 -20 154 0 236 67 97 80 111 224 30 311 -59 63 -168 95 -243 72z m163 -86
c75 -55 94 -142 50 -225 -59 -112 -233 -127 -308 -26 -20 26 -24 44 -24 98
0 56 4 71 28 102 43 57 90 78 164 74 44 -2 71 -9 90 -23z"
          />
          {/* 오른쪽 바퀴 */}
          <path
            className="la-wheel"
            d="M2682 680 c-100 -41 -164 -133 -164 -238 0 -200 236 -290 390 -148
46 42 92 131 92 177 -1 83 -63 170 -146 205 -37 16 -137 18 -172 4z m130 -60
c105 -30 155 -136 109 -235 -62 -138 -257 -152 -320 -23 -49 103 -3 215 105
253 48 17 59 18 106 5z"
          />
          {/* 하단 바 */}
          <path d="M1320 345 c-7 -8 -10 -22 -6 -30 5 -13 76 -15 574 -15 600 0 603 0 586 44 -6 14 -59 16 -574 16 -490 0 -569 -2 -580 -15z" />
        </g>
      </g>

      {/* ─────────────────────────────────────────────────
          2. 차량 외곽선 본체 — #C9A84C, stroke-width 1.5
             (빛줄기와 동일 굵기, 색상만 다름)
      ───────────────────────────────────────────────── */}
      <g transform="translate(0,1) scale(0.2056,0.2143)">
        <g transform="translate(0,140) scale(0.1,-0.1)" fill="none">
          <path
            d={CAR_PATH}
            stroke="#C9A84C"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </g>

      {/* ─────────────────────────────────────────────────
          3. 차량 외곽선 빛줄기 오버레이
             - pathLength="1" 로 정규화 → 실제 path 길이 무관
             - dasharray: 빛줄기 5% / 어둠 95%
             - 0~65% 구간에서 한 바퀴
      ───────────────────────────────────────────────── */}
      <g transform="translate(0,1) scale(0.2056,0.2143)">
        <g transform="translate(0,140) scale(0.1,-0.1)" fill="none">
          <path
            d={CAR_PATH}
            stroke="#FFE082"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            pathLength="1"
            strokeDasharray="0.05 0.95"
            strokeDashoffset="1.05"
            opacity="0"
            filter="url(#la-glow)"
          >
            {/* 0%에서 dashoffset=1.05 (아직 안 시작), 65%에서 -0.05 (한 바퀴 완료) */}
            <animate
              attributeName="stroke-dashoffset"
              values="1.05;-0.05;1.05"
              keyTimes="0;0.65;1"
              calcMode="linear"
              dur={DUR}
              repeatCount="indefinite"
            />
            {/* 페이드인(0~3%), 유지(3~62%), 페이드아웃(62~65%), 숨김(65~100%) */}
            <animate
              attributeName="opacity"
              values="0;1;1;0;0"
              keyTimes="0;0.03;0.62;0.65;1"
              calcMode="linear"
              dur={DUR}
              repeatCount="indefinite"
            />
          </path>
        </g>
      </g>

      {/* ─────────────────────────────────────────────────
          4. "RenTailor" 텍스트
      ───────────────────────────────────────────────── */}
      <text
        x="78"
        y="22"
        fill="url(#la-goldText)"
        fontFamily="var(--font-display), 'Cormorant Garamond', serif"
        fontWeight="700"
        fontSize="17"
      >
        RenTailor
      </text>

      {/* ─────────────────────────────────────────────────
          5. 텍스트 밑줄 — 본체 (#C9A84C, 1.5)
      ───────────────────────────────────────────────── */}
      <path d="M78,27 L207,27" stroke="#C9A84C" strokeWidth="1.5" />

      {/* ─────────────────────────────────────────────────
          6. 연결선 + 밑줄 빛줄기
             M66,27 = 차량 아이콘 우측 끝 근처
             L207,27 = 밑줄 오른쪽 끝 (스파클 위치)
             65%에서 출발, 95%에서 끝점 도달
      ───────────────────────────────────────────────── */}
      <path
        d="M66,27 L207,27"
        stroke="#FFE082"
        strokeWidth="1.5"
        pathLength="1"
        strokeDasharray="0.05 0.95"
        strokeDashoffset="1.05"
        opacity="0"
        filter="url(#la-glow)"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="1.05;1.05;-0.05;1.05"
          keyTimes="0;0.65;0.95;1"
          calcMode="linear"
          dur={DUR}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0;1;1;0;0"
          keyTimes="0;0.65;0.68;0.90;0.95;1"
          calcMode="linear"
          dur={DUR}
          repeatCount="indefinite"
        />
      </path>

      {/* ─────────────────────────────────────────────────
          7. 끝점 스파클 (SVG animate 태그)
             빛줄기가 x=207 도달 ≈ 88~95% 구간에서 점화
      ───────────────────────────────────────────────── */}
      {/* 메인 circle */}
      <circle cx="207" cy="27" r="0" fill="#FFE082" filter="url(#la-sparkGlow)">
        <animate
          attributeName="r"
          values="0;0;3;0;0"
          keyTimes="0;0.88;0.92;0.97;1"
          calcMode="linear"
          dur={DUR}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0;1;0;0"
          keyTimes="0;0.88;0.92;0.97;1"
          calcMode="linear"
          dur={DUR}
          repeatCount="indefinite"
        />
      </circle>
      {/* 보조 circle 1 — 위 왼쪽 */}
      <circle cx="204" cy="25" r="0" fill="#FFE082" filter="url(#la-sparkGlow)">
        <animate
          attributeName="r"
          values="0;0;2;0;0"
          keyTimes="0;0.89;0.93;0.98;1"
          calcMode="linear"
          dur={DUR}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0;0.85;0;0"
          keyTimes="0;0.89;0.93;0.98;1"
          calcMode="linear"
          dur={DUR}
          repeatCount="indefinite"
        />
      </circle>
      {/* 보조 circle 2 — 위 오른쪽 */}
      <circle cx="210" cy="25" r="0" fill="#FFE082" filter="url(#la-sparkGlow)">
        <animate
          attributeName="r"
          values="0;0;1.8;0;0"
          keyTimes="0;0.90;0.94;0.99;1"
          calcMode="linear"
          dur={DUR}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0;0.75;0;0"
          keyTimes="0;0.90;0.94;0.99;1"
          calcMode="linear"
          dur={DUR}
          repeatCount="indefinite"
        />
      </circle>

      {/* 바퀴 은은한 펄스 (CSS만 유지) */}
      <style>{`
        .la-wheel {
          animation: la-wheelPulse 2s ease-in-out infinite;
        }
        @keyframes la-wheelPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.72; }
        }
      `}</style>
    </svg>
  );
}
