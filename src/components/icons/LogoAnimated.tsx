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
 *   - 0~73   : 차량 아이콘 (원본 355×140 → scale(0.205, 0.2))
 *   - 78~210 : "RenTailor" 텍스트 + 밑줄
 */
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
        <filter id="la-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* 스파클 글로우 필터 */}
        <filter id="la-sparkGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ─────────────────────────────────────────────────
          1. 차량 아이콘 — fill 본체
          원본 355×140 → 73×30 영역으로 스케일
          scale(73/355, 30/140) ≈ scale(0.2056, 0.2143)
          원본 g transform: translate(0,140) scale(0.1,-0.1)
          합성: translate(0,1) scale(0.2056,0.2143) 안에
                translate(0,140) scale(0.1,-0.1)
      ───────────────────────────────────────────────── */}
      <g transform="translate(0,1) scale(0.2056,0.2143)">
        <g transform="translate(0,140) scale(0.1,-0.1)" fill="#C9A84C" stroke="none">
          {/* 차체 */}
          <path d="M1965 1144 c-176 -26 -308 -76 -571 -217 -99 -53 -106 -55 -288 -86
-356 -59 -556 -122 -639 -200 -62 -58 -88 -110 -95 -187 -7 -87 1 -110 40
-123 47 -15 242 -33 313 -29 56 3 60 4 60 28 0 25 0 25 -122 31 -146 8 -231
18 -237 28 -3 4 0 38 6 74 19 115 81 168 268 230 118 40 182 54 432 96 189 33
211 41 413 149 230 123 345 152 602 152 90 0 197 -5 236 -11 134 -20 339 -75
480 -130 43 -16 124 -41 181 -54 153 -36 156 -38 156 -82 0 -25 9 -52 26 -77
25 -37 26 -44 21 -132 -3 -50 -10 -101 -16 -112 -9 -17 -72 -41 -211 -81 -32
-10 -34 -45 -2 -49 30 -5 215 53 240 75 28 25 42 75 49 175 6 83 5 88 -25 140
-20 37 -28 62 -25 81 10 52 -14 70 -138 101 -63 16 -199 57 -304 92 -271 90
-413 116 -640 120 -99 1 -193 0 -210 -2z" />
          {/* 작은 디테일 */}
          <path d="M1447 826 c-34 -14 -2 -18 63 -8 55 8 55 8 7 13 -26 2 -58 0 -70 -5z" />
          {/* 왼쪽 바퀴 */}
          <path className="la-wheel" d="M1004 680 c-55 -17 -127 -73 -158 -123 -77 -125 -7 -293 135 -327 83
-20 154 0 236 67 97 80 111 224 30 311 -59 63 -168 95 -243 72z m163 -86 c75
-55 94 -142 50 -225 -59 -112 -233 -127 -308 -26 -20 26 -24 44 -24 98 0 56 4
71 28 102 43 57 90 78 164 74 44 -2 71 -9 90 -23z" />
          {/* 오른쪽 바퀴 */}
          <path className="la-wheel" d="M2682 680 c-100 -41 -164 -133 -164 -238 0 -200 236 -290 390 -148
46 42 92 131 92 177 -1 83 -63 170 -146 205 -37 16 -137 18 -172 4z m130 -60
c105 -30 155 -136 109 -235 -62 -138 -257 -152 -320 -23 -49 103 -3 215 105
253 48 17 59 18 106 5z" />
          {/* 하단 바 */}
          <path d="M1320 345 c-7 -8 -10 -22 -6 -30 5 -13 76 -15 574 -15 600 0 603 0
586 44 -6 14 -59 16 -574 16 -490 0 -569 -2 -580 -15z" />
        </g>
      </g>

      {/* ─────────────────────────────────────────────────
          2. 차량 외곽선 — 빛줄기 애니메이션용 오버레이
          vector-effect 로 stroke 두께 고정
      ───────────────────────────────────────────────── */}
      <g transform="translate(0,1) scale(0.2056,0.2143)">
        <g transform="translate(0,140) scale(0.1,-0.1)" fill="none">
          {/* 차체 외곽선 */}
          <path
            className="la-car-light"
            d="M1965 1144 c-176 -26 -308 -76 -571 -217 -99 -53 -106 -55 -288 -86
-356 -59 -556 -122 -639 -200 -62 -58 -88 -110 -95 -187 -7 -87 1 -110 40
-123 47 -15 242 -33 313 -29 56 3 60 4 60 28 0 25 0 25 -122 31 -146 8 -231
18 -237 28 -3 4 0 38 6 74 19 115 81 168 268 230 118 40 182 54 432 96 189 33
211 41 413 149 230 123 345 152 602 152 90 0 197 -5 236 -11 134 -20 339 -75
480 -130 43 -16 124 -41 181 -54 153 -36 156 -38 156 -82 0 -25 9 -52 26 -77
25 -37 26 -44 21 -132 -3 -50 -10 -101 -16 -112 -9 -17 -72 -41 -211 -81 -32
-10 -34 -45 -2 -49 30 -5 215 53 240 75 28 25 42 75 49 175 6 83 5 88 -25 140
-20 37 -28 62 -25 81 10 52 -14 70 -138 101 -63 16 -199 57 -304 92 -271 90
-413 116 -640 120 -99 1 -193 0 -210 -2z"
            stroke="#FFE082"
            strokeWidth="14"
            vectorEffect="non-scaling-stroke"
            filter="url(#la-glow)"
          />
          {/* 하단 바 외곽선 */}
          <path
            className="la-bar-light"
            d="M1320 345 c-7 -8 -10 -22 -6 -30 5 -13 76 -15 574 -15 600 0 603 0
586 44 -6 14 -59 16 -574 16 -490 0 -569 -2 -580 -15z"
            stroke="#FFE082"
            strokeWidth="14"
            vectorEffect="non-scaling-stroke"
            filter="url(#la-glow)"
          />
        </g>
      </g>

      {/* ─────────────────────────────────────────────────
          3. "RenTailor" 텍스트
          x=78, 기준선 y=22
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
          4. 텍스트 밑줄 — 본체
      ───────────────────────────────────────────────── */}
      <path
        d="M78,27 L207,27"
        stroke="#C9A84C"
        strokeWidth="1.5"
      />

      {/* ─────────────────────────────────────────────────
          5. 밑줄 빛줄기 애니메이션
      ───────────────────────────────────────────────── */}
      <path
        className="la-underline-light"
        d="M78,27 L207,27"
        stroke="#FFE082"
        strokeWidth="2.5"
        filter="url(#la-glow)"
      />

      {/* ─────────────────────────────────────────────────
          6. 끝점 스파클 (밑줄 오른쪽 끝, x=207, y=27)
      ───────────────────────────────────────────────── */}
      <circle
        className="la-spark-main"
        cx="207" cy="27" r="0"
        fill="#FFE082"
        filter="url(#la-sparkGlow)"
      />
      <circle
        className="la-spark-1"
        cx="205" cy="25" r="0"
        fill="#FFE082"
        filter="url(#la-sparkGlow)"
      />
      <circle
        className="la-spark-2"
        cx="209" cy="25.5" r="0"
        fill="#FFE082"
        filter="url(#la-sparkGlow)"
      />

      {/* ─────────────────────────────────────────────────
          애니메이션 CSS
          총 주기: 4.5s
          0~65%  : 빛줄기가 차량 외곽선을 흐름
          65~100%: 빛줄기가 텍스트 밑줄을 흐름 + 스파클
      ───────────────────────────────────────────────── */}
      <style>{`
        /* 바퀴 은은한 펄스 */
        .la-wheel {
          animation: la-wheelPulse 2s ease-in-out infinite;
        }
        @keyframes la-wheelPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.72; }
        }

        /* 차량 본체 외곽선 빛줄기
           dasharray: 짧은 밝은 구간(90) + 긴 어두운 구간(910)
           dashoffset: 1000→-200 으로 이동 → 빛이 앞으로 흘러감
           0~65% 구간만 진행, 나머지는 pause (대신 opacity 0)
        */
        .la-car-light {
          stroke-dasharray: 90 910;
          stroke-dashoffset: 1000;
          opacity: 0;
          animation: la-carLight 4.5s ease-in-out infinite;
          will-change: stroke-dashoffset, opacity;
        }
        @keyframes la-carLight {
          0%   { stroke-dashoffset: 1000; opacity: 0; }
          5%   { opacity: 1; }
          60%  { stroke-dashoffset: -100; opacity: 1; }
          65%  { stroke-dashoffset: -100; opacity: 0; }
          100% { stroke-dashoffset: -100; opacity: 0; }
        }

        /* 하단 바 */
        .la-bar-light {
          stroke-dasharray: 90 910;
          stroke-dashoffset: 1000;
          opacity: 0;
          animation: la-barLight 4.5s ease-in-out infinite;
          will-change: stroke-dashoffset, opacity;
        }
        @keyframes la-barLight {
          0%   { stroke-dashoffset: 1000; opacity: 0; }
          30%  { opacity: 0; }
          35%  { opacity: 1; }
          60%  { stroke-dashoffset: -100; opacity: 1; }
          65%  { stroke-dashoffset: -100; opacity: 0; }
          100% { stroke-dashoffset: -100; opacity: 0; }
        }

        /* 텍스트 밑줄 빛줄기
           dasharray: 80 920, 총 길이 1000으로 가정
           65~100% 구간에서 밑줄 전체(실제 약 129px)를 훑음
           dashoffset: 1000 → -200
        */
        .la-underline-light {
          stroke-dasharray: 80 920;
          stroke-dashoffset: 1000;
          opacity: 0;
          animation: la-underlineLight 4.5s ease-in-out infinite;
          will-change: stroke-dashoffset, opacity;
        }
        @keyframes la-underlineLight {
          0%,  63% { stroke-dashoffset: 1000; opacity: 0; }
          68%       { opacity: 1; }
          93%       { stroke-dashoffset: -200; opacity: 1; }
          97%       { stroke-dashoffset: -200; opacity: 0; }
          100%      { stroke-dashoffset: 1000; opacity: 0; }
        }

        /* 스파클 — 메인 (끝점 도달 ≈ 전체 주기 92% 지점) */
        .la-spark-main {
          animation: la-sparkMain 4.5s ease-in-out infinite;
        }
        @keyframes la-sparkMain {
          0%,  88% { r: 0; opacity: 0; }
          92%       { r: 3.5; opacity: 1; }
          98%       { r: 0; opacity: 0; }
          100%      { r: 0; opacity: 0; }
        }

        .la-spark-1 {
          animation: la-spark1 4.5s ease-in-out infinite;
        }
        @keyframes la-spark1 {
          0%,  89%  { r: 0; opacity: 0; }
          93%        { r: 2.2; opacity: 0.85; }
          98%        { r: 0; opacity: 0; }
          100%       { r: 0; opacity: 0; }
        }

        .la-spark-2 {
          animation: la-spark2 4.5s ease-in-out infinite;
        }
        @keyframes la-spark2 {
          0%,  90%  { r: 0; opacity: 0; }
          94%        { r: 2; opacity: 0.75; }
          99%        { r: 0; opacity: 0; }
          100%       { r: 0; opacity: 0; }
        }
      `}</style>
    </svg>
  );
}
