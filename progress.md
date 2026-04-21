# 렌테일러 가격 표시 작업 진행상황

## 완료
- [x] CLAUDE.md: price_ranges → pricing 테이블명 수정
- [x] CLAUDE.md: 3.6 가격 표시 체계 섹션 추가 (수동 견적가 방식 확정)
- [x] CLAUDE.md: 컬럼 분류표 정리 (segment, name_en, image_key → 수동 수집)
- [x] CLAUDE.md: 변경 이력 기록

## 미완료
- [ ] pricing 테이블 구조 확인 (컬럼명, 데이터타입)
- [ ] 인기차종 vehicle_id 목록 확인 (is_popular = true인 차량)
- [ ] pricing 테이블 기존 데이터 확인 (빈 데이터인지, 0인지)
- [ ] 인기차종별 실제 견적가 수집 (캐피탈사 견적서 기반)
- [ ] pricing 테이블에 견적가 INSERT (60개월/연1만km/보증금0% 기준)
- [ ] 사이트에서 "월 0만원" → 실제 가격 표시 확인
- [ ] n8n 워크플로우 price_ranges 참조 여부 확인 및 수정

## 향후 과제 (보류)
- [ ] 실제 견적서에서 잔존가치율 역산
- [ ] 차급별 잔존가치 테이블 구축
- [ ] PMT 자동 계산 엔진 적용 (cadam_pricing_engine v0.2 → v3)
