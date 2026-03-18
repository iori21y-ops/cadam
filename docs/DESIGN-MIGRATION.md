# 카담(CADAM) Apple 디자인 마이그레이션 가이드

## 1. 비교: Before → After

### 전체 톤
| 항목 | Before (현재) | After (Apple 스타일) |
|------|---------------|---------------------|
| 느낌 | 진하고 무거운 네이비 | 가볍고 밝은 미니멀 |
| 배경 | 흰색 #FFFFFF | 라이트그레이 #F5F5F7 |
| 히어로 | 진한 그래디언트 (navy→blue) | 깨끗한 흰색/그레이 + 큰 타이포 |
| 카드 | border-2 + hover:border-accent | 그림자 기반 + hover:scale |
| 네비 | 흰 배경 + 둥근 pill 버튼 | 반투명 글래스 + backdrop-blur |
| 버튼 | rounded-lg + accent 배경 | rounded-2xl + #007AFF |
| 폰트 | Pretendard (유지) | Pretendard (유지, 무게만 조정) |

### 색상 체계
| 용도 | Before | After |
|------|--------|-------|
| primary (주 액센트) | #1B3A5C (네이비) | #007AFF (Apple Blue) |
| accent (보조) | #2E86C1 | 제거 (primary로 통일) |
| 배경 | #FFFFFF | #F5F5F7 |
| 카드 | #FFFFFF + border | #FFFFFF + shadow |
| 텍스트 (제목) | gray-900 | #1D1D1F |
| 텍스트 (본문) | gray-600 | #86868B |
| 텍스트 (보조) | gray-400 | #AEAEB2 |
| success | #27AE60 (유지) | #34C759 (Apple Green) |
| warning | #F39C12 (유지) | #FF9500 (Apple Orange) |
| danger | #E74C3C (유지) | #FF3B30 (Apple Red) |
| kakao | #FEE500 (유지) | #FEE500 (유지) |

---

## 2. globals.css 변경

```css
@import "tailwindcss";

:root {
  --background: #F5F5F7;
  --foreground: #1D1D1F;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  
  /* === Apple Design System === */
  --color-primary: #007AFF;
  --color-success: #34C759;
  --color-warning: #FF9500;
  --color-danger: #FF3B30;
  --color-kakao: #FEE500;
  
  /* 텍스트 */
  --color-text: #1D1D1F;
  --color-text-sub: #86868B;
  --color-text-muted: #AEAEB2;
  
  /* 표면 */
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F5F5F7;
  --color-border: rgba(0, 0, 0, 0.06);
  
  /* 진단 모듈 전용 */
  --color-finance: #007AFF;
  --color-vehicle: #5856D6;
  --color-option: #E04DBF;
  --color-calculator: #FF9500;
  --color-rent: #34C759;
  
  /* 폰트 */
  --font-sans: var(--font-pretendard), -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: ui-monospace, monospace;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* 기존 scrollbar 스타일 유지 */
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-thin { scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent; }
.scrollbar-thin::-webkit-scrollbar { height: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 9999px; }

/* Apple glass effect utility */
.glass {
  background: rgba(245, 245, 247, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Slide animation */
@keyframes slide { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.animate-slide { animation: slide linear infinite; }
```

---

## 3. 컴포넌트별 마이그레이션

### 3.1 NavBar.tsx

**Before:**
```tsx
<nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
  <Link className="text-sm font-extrabold text-primary">카담(CADAM)</Link>
  <Link className="px-4 py-2 rounded-full text-[13px] font-semibold border border-gray-200">
```

**After:**
```tsx
<nav className="sticky top-0 z-50 glass border-b border-border">
  <div className="min-w-[360px] max-w-[1024px] mx-auto px-5 py-3.5 flex items-center gap-4">
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <span className="text-xl">🚘</span>
      <span className="text-[15px] font-bold text-text">카담</span>
    </Link>
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap ${
            isActive
              ? 'bg-primary text-white'
              : 'text-text-sub hover:text-primary hover:bg-primary/5'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  </div>
</nav>
```

핵심 변경: `bg-white` → `glass`, `border-gray-200` → `border-border`, `text-primary`(네이비) → `text-text` + `text-primary`(블루)

### 3.2 메인 페이지 (page.tsx)

**Before:** 진한 그래디언트 히어로 + border 카드
**After:** 밝은 배경 히어로 + 그림자 카드

```tsx
{/* Hero - Apple 스타일 */}
<section className="flex flex-col items-center justify-center px-5 py-20 min-h-[45vh] text-center">
  <div className="text-5xl mb-6">🚘</div>
  <h1 className="text-3xl sm:text-4xl font-bold text-text tracking-tight leading-tight mb-3">
    장기렌터카,<br/>카담에서 가장 쉽게
  </h1>
  <p className="text-base text-text-sub mb-8 max-w-sm">
    현대·기아·제네시스 45종 최저가 견적을 비교해 보세요
  </p>
  <Link
    href="/quote"
    className="px-8 py-3.5 rounded-2xl font-bold text-white bg-primary hover:opacity-90 transition-all shadow-lg shadow-primary/20"
  >
    무료 견적 받기
  </Link>
</section>

{/* 서비스 카드 - Apple 스타일 */}
<section className="px-5 py-12">
  <div className="flex flex-col gap-3 max-w-lg mx-auto">
    {MAIN_CARDS.map((card) => (
      <Link
        key={card.id}
        href={card.href}
        className="w-full text-left p-6 rounded-2xl bg-surface shadow-sm hover:shadow-md hover:scale-[1.01] transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center text-2xl shrink-0">
            {card.emoji}
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-text">{card.title}</h3>
            <p className="text-[13px] text-text-sub mt-1">{card.description}</p>
          </div>
          <svg className="w-5 h-5 text-text-muted shrink-0" viewBox="0 0 20 20">
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </Link>
    ))}
  </div>
</section>

{/* 인기 차종 */}
<section className="px-5 py-12">
  <h2 className="text-xl font-bold text-text mb-6 text-center">인기 차종</h2>
  <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
    {POPULAR_SLUGS.map((slug) => (
      <Link
        key={slug}
        href={`/cars/${slug}`}
        className="px-4 py-2.5 rounded-xl bg-surface shadow-sm text-[13px] font-semibold text-text-sub hover:text-primary hover:shadow-md transition-all"
      >
        {vehicle.model}
      </Link>
    ))}
  </div>
</section>
```

### 3.3 Footer.tsx

**Before:** `bg-gray-100`
**After:** 
```tsx
<footer className="py-8 px-5 text-center border-t border-border">
  <p className="text-[13px] text-text-muted mb-2">운영시간: 평일 09:00 ~ 18:00</p>
  <p className="text-[13px] text-text-muted mb-2">
    연락처: <a href={telHref} className="text-primary font-semibold">{PHONE}</a>
  </p>
  ...
  <p className="text-[11px] text-text-muted mt-4">© 카담(CADAM)</p>
</footer>
```

### 3.4 layout.tsx

**Before:** `bg-white`
**After:** `bg-surface-secondary` (= #F5F5F7)

```tsx
<body className={`${pretendard.className} antialiased bg-surface-secondary`}>
```

### 3.5 카드/버튼 공통 패턴

**카드:**
```
Before: rounded-2xl border-2 border-gray-200 bg-white hover:border-accent
After:  rounded-2xl bg-surface shadow-sm hover:shadow-md hover:scale-[1.01] transition-all
```

**Primary 버튼:**
```
Before: rounded-lg bg-accent text-white font-bold
After:  rounded-2xl bg-primary text-white font-semibold shadow-lg shadow-primary/20
```

**Secondary 버튼:**
```
Before: border border-gray-200 text-gray-700 hover:border-accent
After:  bg-surface-secondary text-text-sub hover:text-primary rounded-xl
```

**Active pill:**
```
Before: bg-accent text-white border border-accent
After:  bg-primary text-white
```

---

## 4. 견적 플로우 스텝 컴포넌트 (components/steps/)

기본 원칙: 기존 로직과 스텝 순서는 유지, 디자인만 변경.

### StepLayout.tsx 변경 포인트
- 프로그레스 바: `bg-accent` → `bg-primary`
- 뒤로가기 버튼: `text-accent` → `text-primary`
- 배경: `bg-white` → `bg-surface-secondary`

### Step 카드들 공통
- 선택 카드: `border-2 + hover:border-accent` → `bg-surface shadow-sm + 선택 시 bg-primary text-white`
- 라디오/체크: `accent` → `primary`

---

## 5. 관리자 페이지 (admin/)

관리자 페이지는 기능 위주이므로 최소한의 변경만 적용:
- `text-primary`(네이비) → `text-text`
- `text-accent` → `text-primary`(블루)
- `border-accent` → `border-primary`
- `bg-accent` → `bg-primary`
- 카드: `border border-gray-200` → `shadow-sm`

---

## 6. 영향 받는 파일 전체 목록

### 반드시 수정
| 파일 | 변경 내용 |
|------|-----------|
| `globals.css` | 전체 색상 체계 교체 (위 2번 참조) |
| `layout.tsx` | `bg-white` → `bg-surface-secondary` |
| `page.tsx` (메인) | 히어로 + 카드 전체 리디자인 |
| `NavBar.tsx` | glass 효과 + 색상 변경 |
| `Footer.tsx` | 배경/색상 변경 |

### 색상 치환 (일괄 치환 가능)
| 파일 | 치환 |
|------|------|
| `components/steps/*.tsx` 전체 | `accent` → `primary`, `text-gray-*` → `text-text-*` |
| `components/cars/*.tsx` 전체 | 동일 |
| `components/admin/*.tsx` 전체 | 동일 |
| `app/quote/page.tsx` | 동일 |
| `app/popular-estimates/*.tsx` | 동일 |
| `app/info/page.tsx` | 동일 |
| `app/promotions/page.tsx` | 동일 |
| `app/cars/[slug]/page.tsx` | 동일 |
| `app/admin/*.tsx` 전체 | 동일 |
| `app/result/page.tsx` | 동일 |

### 일괄 치환 명령 (참고)
```
text-primary → text-text (제목용이었던 곳)
text-accent → text-primary (링크/액센트였던 곳)
bg-accent → bg-primary
border-accent → border-primary
hover:border-accent → hover:shadow-md
hover:text-accent → hover:text-primary
bg-gradient-to-br from-primary to-accent → (제거, 밝은 배경으로)
```

주의: `text-primary`가 기존에는 네이비(#1B3A5C)였는데, 새 시스템에서는 블루(#007AFF)로 바뀝니다. 제목에 사용했던 `text-primary`는 `text-text`로 변경해야 합니다.

---

## 7. Cursor 프롬프트 순서

### Step 1: globals.css 교체
```
globals.css를 이 가이드의 2번 섹션 내용으로 교체해줘.
기존 scrollbar, animation은 유지하고 색상 체계와 @theme inline만 변경.
```

### Step 2: layout.tsx 수정
```
src/app/layout.tsx의 body className에서 bg-white를 bg-surface-secondary로 변경해줘.
```

### Step 3: NavBar 리디자인
```
src/components/NavBar.tsx를 Apple 스타일로 변경해줘.
이 가이드의 3.1 NavBar 섹션을 참고.
glass 클래스(backdrop-filter blur)를 사용하고, 기존 nav 항목은 유지.
진단 관련 항목 '자동차 진단'을 NAV_ITEMS에 추가하고 href="/diagnosis"로 설정.
```

### Step 4: 메인 페이지 리디자인
```
src/app/page.tsx를 Apple 스타일로 변경해줘.
이 가이드의 3.2 메인 페이지 섹션을 참고.
MAIN_CARDS에 진단 카드를 추가:
{ id: 'diagnosis', href: '/diagnosis', emoji: '🎯', title: '내게 맞는 상품 진단', 
  description: '금융상품·차종·옵션을 1분 진단으로 추천받으세요', cta: '진단 시작하기' }
히어로는 그래디언트 제거하고 밝은 배경 + 큰 타이포로 변경.
```

### Step 5: 일괄 색상 치환
```
src/components/ 와 src/app/ 전체에서 다음 치환을 적용해줘:
- bg-accent → bg-primary
- text-accent → text-primary  
- border-accent → border-primary
- hover:border-accent → hover:border-primary
- from-primary to-accent → (그래디언트 제거, 단색으로)
제목에 사용된 text-primary(기존 네이비)는 text-text로 변경.
```

### Step 6: Footer 리디자인
```
Footer.tsx를 이 가이드 3.3에 맞게 변경.
```

### Step 7: 카드/버튼 스타일 통일
```
모든 컴포넌트에서:
- border-2 border-gray-200 카드 → shadow-sm 기반으로 변경
- rounded-lg 버튼 → rounded-2xl
- hover:border-accent → hover:shadow-md hover:scale-[1.01]
```
