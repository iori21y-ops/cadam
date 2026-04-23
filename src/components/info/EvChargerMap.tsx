'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

// ─── 타입 ───────────────────────────────────────────────
interface Charger {
  id: number;
  station_id: string;
  station_name: string;
  address: string;
  lat: number;
  lng: number;
  charger_type: string;
  output_kw: string;
  operator: string;
  status_code: string;
}

type TypeFilter = 'all' | 'fast' | 'slow';

interface BoundsState {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

// ─── 코드 매핑 ───────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string }> = {
  '2':  { label: '충전가능', color: '#22c55e' },
  '3':  { label: '충전중',   color: '#3b82f6' },
  '4':  { label: '운영중단', color: '#ef4444' },
  '5':  { label: '점검중',   color: '#f59e0b' },
  '9':  { label: '알수없음', color: '#9ca3af' },
};

const CHARGER_TYPE: Record<string, string> = {
  '01': 'DC차데모',
  '02': 'AC완속',
  '03': 'DC차데모+AC3상',
  '04': 'DC차데모+DC콤보',
  '05': 'DC차데모+AC3상+DC콤보',
  '06': 'DC콤보',
  '07': 'AC3상',
  '08': 'DC차데모+DC콤보+AC3상',
  '09': 'AC완속+DC완속',
};

const DEFAULT_CENTER: [number, number] = [37.5665, 126.9780]; // 서울 시청

function createMarkerIcon(statusCode: string) {
  const color = STATUS[statusCode]?.color ?? '#9ca3af';
  return L.divIcon({
    className: '',
    html: `<div style="width:11px;height:11px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
    iconSize: [11, 11],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  });
}

// ─── 지도 내부 컴포넌트 ─────────────────────────────────
function BoundsLoader({ onBoundsChange }: { onBoundsChange: (b: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });
  useEffect(() => {
    const t = setTimeout(() => onBoundsChange(map.getBounds()), 150);
    return () => clearTimeout(t);
  // 초기 1회만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function CenterController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView(target, 15, { animate: true });
  }, [target, map]);
  return null;
}

// ─── 메인 컴포넌트 ───────────────────────────────────────
export default function EvChargerMap() {
  const [chargers, setChargers]     = useState<Charger[]>([]);
  const [loading, setLoading]       = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [bounds, setBounds]         = useState<BoundsState | null>(null);
  const [geoTarget, setGeoTarget]   = useState<[number, number] | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError]     = useState('');

  const abortRef = useRef<AbortController | null>(null);

  // bounds 또는 typeFilter 변경 시 데이터 로드
  useEffect(() => {
    if (!bounds) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const params = new URLSearchParams({
      lat_min: bounds.latMin.toString(),
      lat_max: bounds.latMax.toString(),
      lng_min: bounds.lngMin.toString(),
      lng_max: bounds.lngMax.toString(),
      type:    typeFilter,
    });

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/ev-chargers?${params}`, { signal: ctrl.signal });
        const json = await res.json();
        setChargers(json.data ?? []);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setChargers([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [bounds, typeFilter]);

  const handleBoundsChange = useCallback((b: L.LatLngBounds) => {
    setBounds({
      latMin: b.getSouth(),
      latMax: b.getNorth(),
      lngMin: b.getWest(),
      lngMax: b.getEast(),
    });
  }, []);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('이 브라우저는 위치 조회를 지원하지 않습니다.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoTarget([pos.coords.latitude, pos.coords.longitude]);
        setGeoLoading(false);
      },
      () => {
        setGeoError('위치 접근이 거부되었습니다.');
        setGeoLoading(false);
      },
      { timeout: 8000 },
    );
  }, []);

  const LEGEND = [
    { code: '2', label: '충전가능' },
    { code: '3', label: '충전중' },
    { code: '4', label: '운영중단' },
    { code: '5', label: '점검중' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* 필터 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(['all', 'fast', 'slow'] as TypeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                typeFilter === f
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border-solid text-text-sub hover:bg-surface-hover'
              }`}
            >
              {f === 'all' ? '전체' : f === 'fast' ? '⚡ 급속' : '🔌 완속'}
            </button>
          ))}
        </div>

        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-surface border border-border-solid text-text-sub hover:bg-surface-hover transition-colors disabled:opacity-50"
        >
          {geoLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
          ) : (
            <Navigation size={14} />
          )}
          내 위치
        </button>
      </div>

      {geoError && (
        <p className="text-sm text-red-500">{geoError}</p>
      )}

      {/* 지도 컨테이너 */}
      <div className="relative rounded-xl overflow-hidden border border-border-solid" style={{ height: '560px' }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BoundsLoader onBoundsChange={handleBoundsChange} />
          <CenterController target={geoTarget} />

          {chargers.map((c) => (
            <Marker
              key={`${c.station_id}-${c.id}`}
              position={[c.lat, c.lng]}
              icon={createMarkerIcon(c.status_code)}
            >
              <Popup minWidth={220}>
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold text-base mb-1">{c.station_name}</p>
                  <p className="text-gray-500 flex items-start gap-1 mb-2">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    <span>{c.address}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                    <span className="text-gray-400">충전기종류</span>
                    <span>{CHARGER_TYPE[c.charger_type] ?? c.charger_type}</span>
                    <span className="text-gray-400">출력</span>
                    <span>{c.output_kw ? `${c.output_kw} kW` : '-'}</span>
                    <span className="text-gray-400">운영기관</span>
                    <span>{c.operator ?? '-'}</span>
                    <span className="text-gray-400">상태</span>
                    <span
                      className="font-medium"
                      style={{ color: STATUS[c.status_code]?.color }}
                    >
                      {STATUS[c.status_code]?.label ?? c.status_code}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* 충전소 수 배지 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <span className="bg-white/90 text-text-main text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-border-solid">
            {loading ? '검색 중…' : `${chargers.length}개 충전소`}
          </span>
        </div>

        {/* 범례 */}
        <div className="absolute bottom-8 left-3 z-[1000] bg-white/90 rounded-lg px-3 py-2 shadow-sm border border-border-solid">
          <div className="flex flex-col gap-1">
            {LEGEND.map(({ code, label }) => (
              <div key={code} className="flex items-center gap-1.5 text-xs text-gray-700">
                <div
                  className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white shadow-sm"
                  style={{ background: STATUS[code].color }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 데이터 출처 */}
      <p className="text-xs text-text-sub text-right">
        출처: 환경부 전기차 충전소 공공데이터 · 지도: OpenStreetMap
      </p>
    </div>
  );
}
