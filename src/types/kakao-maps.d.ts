declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: object) => KakaoMap;
        Marker: new (options: object) => KakaoMarker;
        MarkerImage: new (src: string, size: object, options?: object) => object;
        MarkerClusterer: new (options: object) => KakaoClusterer;
        InfoWindow: new (options: object) => KakaoInfoWindow;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Size: new (w: number, h: number) => object;
        Point: new (x: number, y: number) => object;
        event: {
          addListener: (target: object, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

interface KakaoMap {
  getBounds: () => KakaoBounds;
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
}
interface KakaoLatLng { getLat: () => number; getLng: () => number; }
interface KakaoBounds {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
}
interface KakaoMarker { setMap: (map: KakaoMap | null) => void; }
interface KakaoClusterer { clear: () => void; addMarkers: (markers: KakaoMarker[]) => void; }
interface KakaoInfoWindow { open: (map: KakaoMap, marker: KakaoMarker) => void; close: () => void; }

export {};
