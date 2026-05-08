#!/usr/bin/env python3
"""
차량 이미지 재처리 스크립트
소스: Supabase URL(360 프레임) 또는 로컬 백업 파일
출력: 800×600 흰 배경, 차량 크기/위치 정규화

사용법:
  python3 scripts/reprocess_car_image.py \
    --source <URL or path> \
    --output <output.webp> \
    --width-ratio 72 \
    --v-position 55
"""

import argparse
import io
import sys
import urllib.request
from typing import Optional, Tuple
import numpy as np
from PIL import Image

try:
    from rembg import remove as rembg_remove
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False


CANVAS_W, CANVAS_H = 800, 600


def load_image(source: str) -> Image.Image:
    if source.startswith('http://') or source.startswith('https://'):
        with urllib.request.urlopen(source, timeout=30) as resp:
            data = resp.read()
        return Image.open(io.BytesIO(data)).convert('RGBA')
    else:
        return Image.open(source).convert('RGBA')


def remove_background(img: Image.Image) -> Image.Image:
    if not REMBG_AVAILABLE:
        print('[warn] rembg 없음 — 배경 제거 건너뜀', file=sys.stderr)
        return img
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    result = rembg_remove(buf.read())
    return Image.open(io.BytesIO(result)).convert('RGBA')


def get_bbox(img_rgba: Image.Image, threshold: int = 235) -> Optional[Tuple[int, int, int, int]]:
    arr = np.array(img_rgba)
    alpha = arr[:, :, 3]
    rgb = arr[:, :, :3]
    is_opaque = alpha > 10
    not_white = np.any(rgb < threshold, axis=2)
    mask = is_opaque & not_white
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not rows.any() or not cols.any():
        return None
    row_idx = np.where(rows)[0]
    col_idx = np.where(cols)[0]
    if len(row_idx) == 0 or len(col_idx) == 0:
        return None
    rmin = row_idx[0].item()
    rmax = row_idx[-1].item()
    cmin = col_idx[0].item()
    cmax = col_idx[-1].item()
    return cmin, rmin, cmax, rmax


def place_on_canvas(car: Image.Image, bbox: Tuple[int, int, int, int], width_ratio: float, v_position: float) -> Image.Image:
    cx1, cy1, cx2, cy2 = bbox
    car_w = cx2 - cx1
    car_h = cy2 - cy1

    target_w = int(CANVAS_W * width_ratio / 100)
    max_h = int(CANVAS_H * 0.75)

    scale = min(target_w / max(car_w, 1), max_h / max(car_h, 1))
    new_w = int(car_w * scale)
    new_h = int(car_h * scale)

    cropped = car.crop((cx1, cy1, cx2, cy2))
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new('RGB', (CANVAS_W, CANVAS_H), (255, 255, 255))
    paste_x = (CANVAS_W - new_w) // 2
    center_y = int(CANVAS_H * v_position / 100)
    paste_y = center_y - new_h // 2
    paste_y = max(0, min(paste_y, CANVAS_H - new_h))

    canvas.paste(resized, (paste_x, paste_y), resized)
    return canvas


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--width-ratio', type=float, default=72)
    parser.add_argument('--v-position', type=float, default=55)
    args = parser.parse_args()

    print(f'소스 로드: {args.source}')
    img = load_image(args.source)

    print('배경 제거 중...')
    img_nobg = remove_background(img)

    bbox = get_bbox(img_nobg)
    if bbox is None:
        print('[warn] 차량 감지 실패 — 원본 전체 기준으로 배치합니다', file=sys.stderr)
        bbox = (0, 0, img_nobg.width, img_nobg.height)

    print(f'캔버스 합성 (가로 {args.width_ratio}%, 세로위치 {args.v_position}%)')
    canvas = place_on_canvas(img_nobg, bbox, args.width_ratio, args.v_position)

    canvas.save(args.output, 'WEBP', quality=90)
    print(f'저장 완료: {args.output}')


if __name__ == '__main__':
    main()
