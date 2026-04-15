'use client';

/**
 * GoldDefs — 공통 골드 SVG gradient 정의
 * layout.tsx <body> 바로 안에 한 번만 렌더링한다.
 * 하위 SVG에서 url(#gold-g1), url(#gold-g2), url(#gold-gw) 로 참조 가능.
 */
export function GoldDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: 'absolute', overflow: 'hidden', width: 0, height: 0 }}
    >
      <defs>
        {/* gold-g1: 메인 애니메이션 linearGradient */}
        <linearGradient id="gold-g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B6914">
            <animate
              attributeName="stop-color"
              values="#8B6914;#F0D060;#C9A84C;#8B6914"
              dur="3s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#C9A84C">
            <animate
              attributeName="stop-color"
              values="#C9A84C;#8B6914;#F0D060;#C9A84C"
              dur="3s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* gold-g2: 밝은 골드 (보조용) */}
        <linearGradient id="gold-g2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#B8923A" />
          <stop offset="100%" stopColor="#F0D060" />
        </linearGradient>

        {/* gold-gw: radialGradient 은은한 후광 */}
        <radialGradient id="gold-gw" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F0D060" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#F0D060" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
