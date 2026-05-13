import sharp from 'sharp';
import { readFile } from 'fs/promises';

const CANVAS_W = 800;
const CANVAS_H = 600;

async function loadImageBuffer(source: string): Promise<Buffer> {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const res = await fetch(source, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`이미지 다운로드 실패: ${res.status} ${source}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(source);
}

// Python get_bbox()와 동일 로직: 불투명 + 비흰색 픽셀 기준 bounding box
function getBbox(
  data: Uint8Array,
  width: number,
  height: number,
  threshold = 235
): [number, number, number, number] | null {
  let rmin = height, rmax = -1, cmin = width, cmax = -1;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const i = (row * width + col) * 4;
      const alpha = data[i + 3];
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // is_opaque & not_white
      if (alpha > 10 && (r < threshold || g < threshold || b < threshold)) {
        if (row < rmin) rmin = row;
        if (row > rmax) rmax = row;
        if (col < cmin) cmin = col;
        if (col > cmax) cmax = col;
      }
    }
  }

  if (rmax === -1) return null;
  return [cmin, rmin, cmax, rmax];
}

export async function reprocessCarImage(opts: {
  source: string;
  widthRatio: number;  // 50~90
  vPosition: number;   // 40~70
}): Promise<Buffer> {
  const { source, widthRatio, vPosition } = opts;

  console.log(`소스 로드: ${source}`);
  const inputBuf = await loadImageBuffer(source);

  // RGBA raw pixel 추출
  const { data, info } = await sharp(inputBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  // bounding box 감지
  let bbox = getBbox(new Uint8Array(data), width, height);
  if (!bbox) {
    console.warn('[warn] 차량 감지 실패 — 원본 전체 기준으로 배치합니다');
    bbox = [0, 0, width, height];
  }

  const [cx1, cy1, cx2, cy2] = bbox;
  const carW = cx2 - cx1;
  const carH = cy2 - cy1;

  // Python place_on_canvas()와 동일한 스케일 계산
  const targetW = Math.floor(CANVAS_W * widthRatio / 100);
  const maxH = Math.floor(CANVAS_H * 0.75);
  const scale = Math.min(targetW / Math.max(carW, 1), maxH / Math.max(carH, 1));
  const newW = Math.round(carW * scale);
  const newH = Math.round(carH * scale);

  const pasteX = Math.floor((CANVAS_W - newW) / 2);
  const centerY = Math.floor(CANVAS_H * vPosition / 100);
  const pasteY = Math.min(Math.max(centerY - Math.floor(newH / 2), 0), CANVAS_H - newH);

  console.log(`캔버스 합성 (가로 ${widthRatio}%, 세로위치 ${vPosition}%)`);

  // 차량 영역 crop → resize → 흰 배경 800×600에 합성
  const carBuf = await sharp(inputBuf)
    .ensureAlpha()
    .extract({ left: cx1, top: cy1, width: carW, height: carH })
    .resize(newW, newH, { fit: 'fill', kernel: 'lanczos3' })
    .toBuffer();

  const resultBuf = await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: carBuf, left: pasteX, top: pasteY }])
    .webp({ quality: 90 })
    .toBuffer();

  return resultBuf;
}
