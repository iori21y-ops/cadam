'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';
import { useKakaoLoader } from '@/hooks/useKakaoLoader';

// ─── 타입 ───────────────────────────────────────────────────
type TabKey = 'ev' | 'gas' | 'repair';

interface Bounds {
  latMin: number; latMax: number;
  lngMin: number; lngMax: number;
}

// ─── 상수 ───────────────────────────────────────────────────
const TABS: { key: TabKey; label: string }[] = [
  { key: 'ev',     label: '⚡ 충전소' },
  { key: 'gas',    label: '⛽ 주유소' },
  { key: 'repair', label: '🔧 정비소' },
];

const EV_STATUS: Record<string, { label: string; color: string }> = {
  '2': { label: '충전가능', color: '#22c55e' },
  '3': { label: '충전중',   color: '#3b82f6' },
  '4': { label: '운영중단', color: '#ef4444' },
  '5': { label: '점검중',   color: '#f59e0b' },
  '9': { label: '알수없음', color: '#9ca3af' },
};

const EV_CHARGER_TYPE: Record<string, string> = {
  '01': 'DC차데모',               '02': 'AC완속',
  '03': 'DC차데모+AC3상',         '04': 'DC차데모+DC콤보',
  '05': 'DC차데모+AC3상+DC콤보',  '06': 'DC콤보',
  '07': 'AC3상',                  '08': 'DC차데모+DC콤보+AC3상',
  '09': 'AC완속+DC완속',
};

const TAB_LABEL: Record<TabKey, string> = {
  ev: '충전소', gas: '주유소', repair: '정비소',
};

const SOURCE_LABEL: Record<TabKey, string> = {
  ev:     '출처: 환경부 전기차 충전소 공공데이터 · 지도: 카카오맵',
  gas:    '출처: 카카오 로컬 API · 지도: 카카오맵',
  repair: '출처: 공공데이터포털 자동차관리사업체 · 지도: 카카오맵',
};

// ─── 헬퍼 ───────────────────────────────────────────────────
function makeMarkerSvg(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
    <circle cx="6" cy="6" r="4.5" fill="${color}" stroke="white" stroke-width="1.5"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function buildInfoContent(item: Record<string, string>, tab: TabKey): string {
  const wrap = (body: string) =>
    `<div style="padding:10px;font-size:13px;line-height:1.65;min-width:190px;max-width:260px">${body}</div>`;

  if (tab === 'ev') {
    const statusColor = EV_STATUS[item.status_code]?.color ?? '#9ca3af';
    const statusLabel = EV_STATUS[item.status_code]?.label ?? item.status_code;
    return wrap(`
      <strong style="font-size:14px;display:block;margin-bottom:4px">${item.station_name}</strong>
      <p style="color:#6b7280;margin:0 0 8px;font-size:12px">${item.address}</p>
      <table style="font-size:12px;border-collapse:collapse;width:100%">
        <tr><td style="color:#9ca3af;padding-right:8px">충전기종류</td><td>${EV_CHARGER_TYPE[item.charger_type] ?? item.charger_type}</td></tr>
        <tr><td style="color:#9ca3af">출력</td><td>${item.output_kw ? item.output_kw + ' kW' : '-'}</td></tr>
        <tr><td style="color:#9ca3af">운영기관</td><td>${item.operator ?? '-'}</td></tr>
        <tr><td style="color:#9ca3af">상태</td><td style="color:${statusColor};font-weight:600">${statusLabel}</td></tr>
      </table>`);
  }

  if (tab === 'gas') {
    return wrap(`
      <strong style="font-size:14px;display:block;margin-bottom:2px">${item.name}</strong>
      ${item.brand ? `<span style="color:#f59e0b;font-size:12px">${item.brand}</span>` : ''}
      <p style="color:#6b7280;margin:4px 0;font-size:12px">${item.road_address ?? item.address ?? ''}</p>
      ${item.phone ? `<p style="font-size:12px;margin:2px 0">📞 ${item.phone}</p>` : ''}
      ${item.place_url ? `<a href="${item.place_url}" target="_blank" rel="noopener" style="font-size:12px;color:#3b82f6">카카오맵 보기 →</a>` : ''}`);
  }

  return wrap(`
    <strong style="font-size:14px;display:block;margin-bottom:2px">${item.shop_name}</strong>
    ${item.shop_type ? `<span style="color:#3b82f6;font-size:12px">${item.shop_type}</span>` : ''}
    <p style="color:#6b7280;margin:4px 0;font-size:12px">${item.road_address ?? ''}</p>
    ${item.phone ? `<p style="font-size:12px;margin:2px 0">📞 ${item.phone}</p>` : ''}`);
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────
export default function KakaoMap() {
  const kakaoState = useKakaoLoader();
  const mapRef      = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapObj      = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers     = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterer   = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openInfoWin = useRef<any>(null);
  const abortCtrl   = useRef<AbortController | null>(null);

  const [tab,        setTab]        = useState<TabKey>('ev');
  const [bounds,     setBounds]     = useState<Bounds | null>(null);
  const [count,      setCount]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError,   setGeoError]   = useState('');

  // 지도 초기화 (카카오 SDK 로드 완료 후 1회)
  useEffect(() => {
    if (kakaoState !== 'ready' || !mapRef.current || mapObj.current) return;

    const { kakao } = window;
    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 5,
    });
    mapObj.current = map;

    clusterer.current = new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 5,
      styles: [{
        width: '40px', height: '40px',
        background: 'rgba(59,130,246,0.85)',
        borderRadius: '50%',
        color: '#fff',
        textAlign: 'center',
        lineHeight: '40px',
        fontSize: '13px',
        fontWeight: 'bold',
      }],
    });

    const updateBounds = () => {
      const b  = map.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      setBounds({ latMin: sw.getLat(), latMax: ne.getLat(), lngMin: sw.getLng(), lngMax: ne.getLng() });
    };

    kakao.maps.event.addListener(map, 'idle', updateBounds);
    updateBounds();
  }, [kakaoState]);

  // 마커 전체 제거
  const clearAll = useCallback(() => {
    if (openInfoWin.current) { openInfoWin.current.close(); openInfoWin.current = null; }
    if (clusterer.current)   clusterer.current.clear();
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];
  }, []);

  // 탭 변경
  const handleTabChange = useCallback((newTab: TabKey) => {
    setTab(newTab);
    setCount(0);
    clearAll();
  }, [clearAll]);

  // 데이터 fetch + 마커 렌더
  useEffect(() => {
    if (!bounds || !mapObj.current || kakaoState !== 'ready') return;

    abortCtrl.current?.abort();
    const ctrl = new AbortController();
    abortCtrl.current = ctrl;

    const p = new URLSearchParams({
      lat_min: bounds.latMin.toString(), lat_max: bounds.latMax.toString(),
      lng_min: bounds.lngMin.toString(), lng_max: bounds.lngMax.toString(),
    });
    const url = tab === 'ev'     ? `/api/ev-chargers?${p}&type=all`
              : tab === 'gas'    ? `/api/gas-stations?${p}`
              : `/api/repair-shops?${p}`;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res   = await fetch(url, { signal: ctrl.signal });
        const json  = await res.json();
        const items = (json.data ?? []) as Record<string, string>[];

        clearAll();
        setCount(items.length);

        const { kakao } = window;
        const map        = mapObj.current!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newMarkers: any[] = [];

        for (const item of items) {
          const lat = tab === 'repair' ? parseFloat(item.latitude) : parseFloat(item.lat);
          const lng = tab === 'repair' ? parseFloat(item.longitude) : parseFloat(item.lng);
          if (!lat || !lng) continue;

          const color = tab === 'ev'     ? (EV_STATUS[item.status_code]?.color ?? '#9ca3af')
                      : tab === 'gas'    ? '#f59e0b'
                      : '#3b82f6';

          const markerImage = new kakao.maps.MarkerImage(
            makeMarkerSvg(color),
            new kakao.maps.Size(12, 12),
            { offset: new kakao.maps.Point(6, 6) },
          );
          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(lat, lng),
            image: markerImage,
          });

          const content = buildInfoContent(item, tab);
          kakao.maps.event.addListener(marker, 'click', () => {
            const iw = new kakao.maps.InfoWindow({ content, removable: true });
            if (openInfoWin.current) openInfoWin.current.close();
            iw.open(map, marker);
            openInfoWin.current = iw;
          });

          newMarkers.push(marker);
        }

        markers.current = newMarkers;
        if (tab === 'repair') {
          clusterer.current?.addMarkers(newMarkers);
        } else {
          newMarkers.forEach(m => m.setMap(map));
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') { clearAll(); setCount(0); }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [bounds, tab, kakaoState, clearAll]);

  // 내 위치
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('이 브라우저는 위치 조회를 지원하지 않습니다.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { kakao } = window;
        const map = mapObj.current;
        if (map) {
          map.setCenter(new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
          map.setLevel(4);
        }
        setGeoLoading(false);
      },
      () => { setGeoError('위치 접근이 거부되었습니다.'); setGeoLoading(false); },
      { timeout: 8000 },
    );
  }, []);

  if (kakaoState === 'error') {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border-solid bg-surface" style={{ height: '560px' }}>
        <p className="text-text-sub text-sm">지도를 불러오지 못했습니다. 페이지를 새로고침 해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 탭 + 내 위치 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border-solid text-text-sub hover:bg-surface-hover'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-surface border border-border-solid text-text-sub hover:bg-surface-hover transition-colors disabled:opacity-50"
        >
          {geoLoading
            ? <span className="inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
            : <Navigation size={14} />}
          내 위치
        </button>
      </div>

      {geoError && <p className="text-sm text-red-500">{geoError}</p>}

      {/* 지도 컨테이너 */}
      <div className="relative rounded-xl overflow-hidden border border-border-solid" style={{ height: '560px' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* SDK 로딩 오버레이 */}
        {kakaoState !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
            <div className="flex flex-col items-center gap-3 text-text-sub">
              <div className="w-8 h-8 border-2 border-t-transparent border-primary rounded-full animate-spin" />
              <span className="text-sm">지도를 불러오는 중…</span>
            </div>
          </div>
        )}

        {/* 개수 배지 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <span className="bg-white/90 text-text-main text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-border-solid">
            {loading ? '검색 중…' : `${count}개 ${TAB_LABEL[tab]}`}
          </span>
        </div>

        {/* 충전소 상태 범례 */}
        {tab === 'ev' && (
          <div className="absolute bottom-8 left-3 z-[1000] bg-white/90 rounded-lg px-3 py-2 shadow-sm border border-border-solid">
            <div className="flex flex-col gap-1">
              {(['2','3','4','5'] as const).map(code => (
                <div key={code} className="flex items-center gap-1.5 text-xs text-gray-700">
                  <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white shadow-sm"
                    style={{ background: EV_STATUS[code].color }} />
                  {EV_STATUS[code].label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 출처 */}
      <p className="text-xs text-text-sub text-right">{SOURCE_LABEL[tab]}</p>
    </div>
  );
}
