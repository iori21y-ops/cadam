import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '사업자 절세 진단 | 렌테일러',
  description: '장기렌트로 연간 얼마나 절세할 수 있는지 1분 만에 확인하세요. 법인·개인 사업자 맞춤 세무 진단. 업종·매출·차량 현황 기반 자동 계산.',
  openGraph: {
    title: '사업자 절세 진단 | 렌테일러',
    description: '장기렌트로 연간 절세 혜택을 1분 만에 확인. 법인·개인 사업자 맞춤 진단.',
  },
};

export default function TaxSimulatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
