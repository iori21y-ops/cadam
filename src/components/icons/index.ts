// ═══════════════════════════════════════════════════════════════
// 골드 애니메이션 아이콘 시스템 — Barrel Export
// ═══════════════════════════════════════════════════════════════

// 네비게이션 8종
export { IconHome } from './IconHome';
export { IconCar } from './IconCar';
export { IconCalculator } from './IconCalculator';
export { IconConsult } from './IconConsult';
export { IconMyPage } from './IconMyPage';
export { IconSearch } from './IconSearch';
export { IconPhone } from './IconPhone';
export { IconMenu } from './IconMenu';

// 서비스 특징 8종
export { IconTailor } from './IconTailor';
export { IconShield } from './IconShield';
export { IconPrice } from './IconPrice';
export { IconLightning } from './IconLightning';
export { IconCompare } from './IconCompare';
export { IconClock24 } from './IconClock24';
export { IconContract } from './IconContract';
export { IconAIDiag } from './IconAIDiag';

// 기존 단색 아이콘 (RentailorIcons.tsx) — 이름 충돌 방지를 위해 Simple 접미사 사용
export {
  IconCarCompact,
  IconCarSedan,
  IconCarSUV,
  IconCarPremium,
  IconCarMinivan,
  IconCarElectric,
  IconInstallment,
  IconLease,
  IconLongRent,
  IconCash,
  IconDiagnosis,
  IconTarget,
  IconCalendar,
  IconRoad,
  IconPhone as IconPhoneSimple,
  IconKakao,
  IconLink,
  IconShield as IconShieldSimple,
  IconBolt,
  IconTrophy,
  IconCheck,
  IconWarning,
  IconTip,
  IconBudget,
  IconMemo,
  RenderIcon,
  ICON_MAP,
} from './RentailorIcons';

// 타입 재 export
export type { IconProps } from './IconHome';
