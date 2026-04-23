import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/constants/brand';

export const metadata: Metadata = {
  title: BRAND.privacy.title,
  description: BRAND.privacy.description,
};

const EFFECTIVE_DATE = '2026년 4월 23일';
const OWNER_EMAIL = 'cadam21y@gmail.com';

export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-white">
      <main className="px-5 py-8 pb-24 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-text mb-2">개인정보 처리방침</h1>
        <p className="text-xs text-gray-500 mb-8">시행일: {EFFECTIVE_DATE}</p>

        <p className="text-sm text-gray-600 mb-10 leading-relaxed">
          {BRAND.nameWithEn}은 「개인정보 보호법」 및 관련 법령에 따라 이용자의
          개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수
          있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </p>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            1. 수집하는 개인정보 항목
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-gray-900">필수:</strong> 이름,
              연락처(휴대폰 번호 또는 이메일)
            </li>
            <li>
              <strong className="text-gray-900">선택:</strong> 관심 차종, 선호
              약정 기간/주행거리, 월 예산 등 견적에 필요한 정보
            </li>
            <li>
              <strong className="text-gray-900">자동 수집:</strong> 접속 기기
              정보, 유입 경로, IP 해시(비식별 처리), 쿠키
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            2. 수집 및 이용 목적
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>장기렌터카 상담 연결 및 맞춤 견적 제공</li>
            <li>이용자 요청에 맞춘 차량/상품 안내</li>
            <li>서비스 개선을 위한 통계 분석 (비식별 처리)</li>
            <li>부정 이용 방지 및 관련 법령에 따른 의무 이행</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            3. 보유 및 이용 기간
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>상담 완료 시점부터 1년간 보관 후 지체 없이 파기</li>
            <li>이용자의 동의 철회 또는 삭제 요청 시 즉시 파기</li>
            <li>
              관련 법령상 보관 의무가 있는 항목(예: 전자상거래법상 계약·청약철회
              기록 5년, 소비자 불만·분쟁 처리 기록 3년)은 해당 기간까지 별도
              보관
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            4. 제3자 제공
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            서비스는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만
            이용자가 캐피탈사의 공식 견적을 요청하는 경우, <strong>사전 동의를
            받은 범위 내</strong>에서 최소한의 항목(이름, 연락처, 관심 차종)을
            해당 캐피탈사에 전달할 수 있습니다. 제공 내역은 동의 시점과 항목을
            기록·보관하며, 이용자는 언제든 제공 동의를 철회할 수 있습니다.
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
            6. 파기 절차 및 방법
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>전자 파일: 복구 불가능한 방법으로 영구 삭제</li>
            <li>종이 문서: 분쇄기로 파쇄 또는 소각</li>
            <li>보관 기간 경과, 처리 목적 달성, 동의 철회 시 즉시 파기</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            7. 이용자의 권리
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            이용자는 언제든 아래 권리를 행사할 수 있습니다.
          </p>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>개인정보 열람 요청</li>
            <li>오류 정정 및 삭제 요청</li>
            <li>처리 정지 요청</li>
            <li>수집·이용·제공에 대한 동의 철회</li>
          </ul>
          <p className="text-sm text-gray-700 leading-relaxed mt-3">
            요청은 아래 개인정보보호 책임자 연락처로 접수하시면 지체 없이
            처리합니다. 동의 거부 시 상담 신청이 제한될 수 있습니다.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            8. 안전성 확보 조치
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>전송 구간 암호화(HTTPS/TLS) 및 저장 시 접근 통제</li>
            <li>관리자 권한 최소화 및 접근 기록 보관</li>
            <li>개인정보 처리 시스템 정기 점검</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            9. 쿠키(Cookie) 이용 안내
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            서비스는 이용자 편의 제공 및 사용 통계 분석을 위하여 쿠키를
            사용합니다. 이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있으며,
            이 경우 서비스 일부 기능 이용에 제한이 있을 수 있습니다.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            10. 개인정보 보호책임자
          </h2>
          <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed">
            <p>개인정보 관련 문의·불만 처리·피해 구제 등은 아래로 연락해 주시기 바랍니다.</p>
            <p className="mt-2">
              이메일: <a href={`mailto:${OWNER_EMAIL}`} className="text-accent underline">{OWNER_EMAIL}</a>
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            11. 분쟁 조정 안내
          </h2>
          <ul className="space-y-1 text-sm text-gray-700 leading-relaxed list-disc list-inside">
            <li>개인정보분쟁조정위원회 (1833-6972, www.kopico.go.kr)</li>
            <li>개인정보침해신고센터 (118, privacy.kisa.or.kr)</li>
            <li>대검찰청 사이버수사과 (1301, www.spo.go.kr)</li>
            <li>경찰청 사이버수사국 (182, ecrm.police.go.kr)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            12. 방침 변경
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            본 방침은 법령·정책 또는 서비스 변경에 따라 개정될 수 있으며, 변경
            시 시행 7일 전 홈페이지 공지사항을 통해 사전 안내합니다. 중요한
            변경은 개별 고지 또는 명시적 동의 절차를 거칩니다.
          </p>
        </section>

        <p className="text-xs text-gray-400 mt-12">
          본 개인정보 처리방침은 {EFFECTIVE_DATE}부터 적용됩니다. 실제 운영 시
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
