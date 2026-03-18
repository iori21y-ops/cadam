import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보 처리방침 | 카담(CADAM)',
  description: '카담 장기렌터카 서비스의 개인정보 수집 및 이용에 관한 안내입니다.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-white">
      <main className="px-5 py-8 pb-16 max-w-[720px] mx-auto">
        <h1 className="text-2xl font-bold text-text mb-8">
          개인정보 처리방침
        </h1>

        <p className="text-sm text-gray-600 mb-10 leading-relaxed">
          카담(CADAM)은 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고
          이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여
          다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </p>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            1. 수집하는 개인정보 항목
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-gray-900">필수:</strong> 이름,
              연락처(휴대폰 번호)
            </li>
            <li>
              <strong className="text-gray-900">자동 수집:</strong> 접속 기기
              정보, 유입 경로, IP 해시(비식별 처리)
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            2. 수집 및 이용 목적
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>장기렌터카 상담 견적 제공 및 상담사 연결</li>
            <li>서비스 개선을 위한 통계 분석 (비식별 처리)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            3. 보유 및 이용 기간
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>상담 완료 후 1년간 보유 후 파기</li>
            <li>
              단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안 보존
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            4. 동의 거부 권리
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            개인정보 수집에 대한 동의를 거부할 권리가 있습니다. 동의 거부 시
            상담 신청이 제한될 수 있습니다.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            5. 개인정보 처리 위탁
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            원활한 서비스 제공을 위해 아래 업체에 개인정보 처리 업무를 위탁하고
            있습니다.
          </p>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>이메일 발송: Resend Inc.</li>
            <li>호스팅: Vercel Inc.</li>
            <li>데이터베이스: Supabase Inc.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            6. 개인정보 보호책임자
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            (사업자 정보 확정 후 기입)
          </p>
        </section>

        <p className="text-xs text-gray-400 mt-12">
          본 개인정보 처리방침은 2025년 3월 11일부터 적용됩니다. 실제 운영 시
          법률 검토 후 수정될 수 있습니다.
        </p>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:underline"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            견적 화면으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
