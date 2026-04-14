import { TermsComparisonTable } from '@/components/info/TermsComparisonTable';

export const metadata = {
  title: '약관 비교 | 카담',
  description:
    '장기렌터카·운용리스 주요 약관(중도해지·초과운행·승계수수료 등)을 회사별로 한눈에 비교합니다.',
};

export default function TermsComparisonPage() {
  return <TermsComparisonTable />;
}
