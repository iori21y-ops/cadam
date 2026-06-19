// Hand-written bundle entry for the cadam-web UI subset synced to claude.ai/design.
// The repo is a Next.js app with no library build, so this barrel re-exports
// only the scoped presentational components (src/components/ui + icons) instead
// of letting synth-entry pull in the whole app (admin tables, step flow, maps).
// Keep this in sync with componentSrcMap in config.json.

// ── ui ──
export { Button, ButtonLink } from '../src/components/ui/Button';
export { FilterPill } from '../src/components/ui/FilterPill';
export { SelectCard } from '../src/components/ui/SelectCard';
export { ConsultationSheet } from '../src/components/ui/ConsultationSheet';
export { QuoteButton } from '../src/components/ui/QuoteButton';

// ── icons ──
export { IconAIDiag } from '../src/components/icons/IconAIDiag';
export { IconCalculator } from '../src/components/icons/IconCalculator';
export { IconCar } from '../src/components/icons/IconCar';
export { IconClock24 } from '../src/components/icons/IconClock24';
export { IconCompare } from '../src/components/icons/IconCompare';
export { IconConsult } from '../src/components/icons/IconConsult';
export { IconContract } from '../src/components/icons/IconContract';
export { IconHome } from '../src/components/icons/IconHome';
export { IconLightning } from '../src/components/icons/IconLightning';
export { IconMenu } from '../src/components/icons/IconMenu';
export { IconMyPage } from '../src/components/icons/IconMyPage';
export { IconPhone } from '../src/components/icons/IconPhone';
export { IconPrice } from '../src/components/icons/IconPrice';
export { IconSearch } from '../src/components/icons/IconSearch';
export { IconShield } from '../src/components/icons/IconShield';
export { IconTailor } from '../src/components/icons/IconTailor';
export { LogoAnimated } from '../src/components/icons/LogoAnimated';
