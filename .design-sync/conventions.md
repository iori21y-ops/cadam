# Rentailor UI — conventions

This is the **Rentailor** (rentailor.co.kr) UI kit — a Korean long-term car-rental
service. The look is premium-minimal: deep **navy** + **gold** on white, generous
rounding, soft shadows. Build with the real components below; style your own layout
glue with the Tailwind utility tokens listed here. Korean copy is the default.

## Styling idiom: Tailwind v4 + brand theme tokens

Components are styled with **Tailwind utility classes** bound to a custom theme. Use
these brand tokens (not raw hex) so everything stays on-brand. The full token set
lives in the bundled stylesheet — read `_ds/<folder>/_ds_bundle.css` before styling.

**Color utilities** (each works as `bg-*`, `text-*`, `border-*`):

| Token | Value | Use |
|---|---|---|
| `primary` | `#0D1B2A` navy | primary buttons, headings, key UI |
| `accent` | `#C9A84C` gold | brand accent, highlights, selected marks |
| `surface` | `#FFFFFF` | cards |
| `surface-secondary` | `#F7F8FA` | page / muted surfaces |
| `text` | `#0D1B2A` | body text |
| `text-sub` | `#4A5568` | secondary text |
| `text-muted` | `#9CA3AF` | tertiary / placeholder |
| `border` / `border-solid` | `#E5E7EB` | dividers, inputs |
| `success` `#10B981` · `danger` `#EF4444` · `kakao` `#FEE500` | states / Kakao CTA |

(`brand-navy`/`brand-gold` are aliases of `primary`/`accent` — use those.)

**Fonts**: the brand faces (Pretendard sans, Cormorant serif) are loaded by the host
app at runtime and are **not shipped in this bundle**, so cards render in a system
sans fallback. Use `font-sans` for body; don't depend on a specific brand face.

**Brand-effect utility classes** (defined in the stylesheet, use directly):
`cta-gold` (animated gold CTA), `text-gold-gradient` (gold gradient text),
`shimmer-gold`, `card-glow-selected` (selected-card glow), `glass` (frosted panel),
`vehicle-card-gold`, and `hero-fade-1`…`hero-fade-4` (staggered entrance).

## Components

Prefer these over hand-rolled equivalents — they carry the brand styling:
- **Button** — `variant` (`primary`/`secondary`/`surface`/`outline`/`ghost`/`kakao`/`danger`),
  `size` (`sm`/`md`/`lg`), `fullWidth`. `ButtonLink` is the `<a>` twin.
- **QuoteButton** — the lead-capture CTA; opens a **ConsultationSheet** on click.
- **ConsultationSheet** — bottom-sheet lead form (name/phone + privacy consent).
- **FilterPill** — rounded filter chip; `active` fills navy.
- **SelectCard** — selectable option card with a gold check; `selected`, `compact`,
  `vertical`, `color` (accent override).
- **Icon\*** (IconCar, IconPrice, IconHome, IconShield, …) + **LogoAnimated** — animated
  gold-gradient SVGs; `size` (px). Self-contained.

Per-component API + usage is in each component's `.d.ts` and `.prompt.md` — read those.

## Build snippet

```tsx
// A quote section: brand layout glue (utilities) + real components.
<section className="bg-surface-secondary rounded-3xl p-7">
  <h2 className="text-2xl font-bold text-primary">내게 딱 맞는 견적</h2>
  <p className="mt-1 text-sm text-text-sub">조건을 선택하면 무료로 비교해 드립니다.</p>
  <div className="mt-5 flex flex-col gap-3">
    <SelectCard selected>장기렌터카</SelectCard>
    <SelectCard>오토리스</SelectCard>
  </div>
  <div className="mt-6">
    <QuoteButton fullWidth size="lg" />
  </div>
</section>
```
