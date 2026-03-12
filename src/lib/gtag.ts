declare global {
  interface Window {
    gtag: (
      ...args: [string, string, ...Record<string, string | number | boolean>[]]
    ) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function pageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined' || !GA_ID) return;
  window.gtag?.('config', GA_ID, {
    page_path: pagePath,
    ...(pageTitle && { page_title: pageTitle }),
  });
}

export function event(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined' || !GA_ID) return;
  window.gtag?.('event', eventName, params ?? {});
}

// PRD 10.2 이벤트 정의에 따른 헬퍼 함수들
export const gtag = {
  stepView: (stepNumber: number, stepName: string) =>
    event('step_view', { step_number: stepNumber, step_name: stepName }),
  stepComplete: (stepNumber: number, selectedValue: string) =>
    event('step_complete', { step_number: stepNumber, selected_value: selectedValue }),
  stepBack: (fromStep: number, toStep: number) =>
    event('step_back', { from_step: fromStep, to_step: toStep }),
  leaveIntent: (currentStep: number) =>
    event('leave_intent', { current_step: currentStep }),
  leaveIntentStay: (currentStep: number) =>
    event('leave_intent_stay', { current_step: currentStep }),
  leaveIntentExit: (currentStep: number) =>
    event('leave_intent_exit', { current_step: currentStep }),
  formSubmit: (carBrand?: string, carModel?: string) =>
    event('form_submit', { car_brand: carBrand ?? '', car_model: carModel ?? '' }),
  formSubmitSuccess: (carBrand?: string, carModel?: string, leadScore?: number) =>
    event('form_submit_success', {
      car_brand: carBrand ?? '',
      car_model: carModel ?? '',
      lead_score: leadScore ?? 0,
    }),
  formSubmitError: (errorType: string) =>
    event('form_submit_error', { error_type: errorType }),
  resultKakaoClick: () => event('result_kakao_click'),
  resultCallClick: () => event('result_call_click'),
  resultRetry: () => event('result_retry'),
  seoPageView: (carSlug: string, carBrand: string) =>
    event('seo_page_view', { car_slug: carSlug, car_brand: carBrand }),
  seoCtaClick: (carSlug: string, ctaType: string) =>
    event('seo_cta_click', { car_slug: carSlug, cta_type: ctaType }),
  infoCtaClick: (section: string) => event('info_cta_click', { section }),
  quickFormSubmit: () => event('quick_form_submit'),
};
