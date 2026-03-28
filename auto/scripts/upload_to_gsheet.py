#!/usr/bin/env python3
"""
CADAM 데이터 → Google Sheets 자동 업로드
CSV 5개 파일을 "CADAM_데이터" 스프레드시트의 각 시트에 입력
"""

import gspread
import csv
import os
import sys
import time

# ====== 설정 ======
SPREADSHEET_NAME = "CADAM_데이터"
SERVICE_ACCOUNT_PATH = os.path.expanduser("~/cadam/config/google-service-account.json")

# CSV 파일 → 시트 이름 매핑 (순서 유지)
SHEET_MAP = [
    ("차량DB.csv", "차량DB"),
    ("가격DB.csv", "가격DB"),
    ("FAQ.csv", "FAQ"),
    ("이용방법DB.csv", "이용방법DB"),
    ("스케줄.csv", "스케줄"),
]


def authenticate():
    if os.path.exists(SERVICE_ACCOUNT_PATH):
        gc = gspread.service_account(filename=SERVICE_ACCOUNT_PATH)
        print(f"✅ 서비스 계정 인증 성공")
        return gc
    else:
        print(f"❌ 서비스 계정 키 없음: {SERVICE_ACCOUNT_PATH}")
        sys.exit(1)


def read_csv(filepath):
    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append(row)
    return rows


def format_headers(spreadsheet, worksheet):
    """헤더 행을 굵게 + 연한 파란색 배경으로 서식 적용"""
    worksheet_id = worksheet.id
    requests = [
        # Bold
        {
            "repeatCell": {
                "range": {
                    "sheetId": worksheet_id,
                    "startRowIndex": 0,
                    "endRowIndex": 1,
                },
                "cell": {
                    "userEnteredFormat": {
                        "textFormat": {"bold": True},
                        "backgroundColor": {
                            "red": 0.81,
                            "green": 0.89,
                            "blue": 0.95,
                            "alpha": 1,
                        },
                    }
                },
                "fields": "userEnteredFormat(textFormat,backgroundColor)",
            }
        }
    ]
    spreadsheet.batch_update({"requests": requests})


def main():
    csv_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))

    gc = authenticate()

    # 스프레드시트 열기 또는 생성
    try:
        spreadsheet = gc.open(SPREADSHEET_NAME)
        print(f"📄 기존 스프레드시트 열기: {SPREADSHEET_NAME}")
    except gspread.SpreadsheetNotFound:
        spreadsheet = gc.create(SPREADSHEET_NAME)
        print(f"📄 새 스프레드시트 생성: {SPREADSHEET_NAME}")

    existing_sheets = [ws.title for ws in spreadsheet.worksheets()]
    print(f"📋 기존 시트: {existing_sheets}")

    results = []

    for csv_filename, sheet_name in SHEET_MAP:
        csv_path = os.path.join(csv_dir, csv_filename)

        if not os.path.exists(csv_path):
            print(f"⚠️  {csv_filename} 파일 없음 — 건너뜀")
            continue

        data = read_csv(csv_path)
        if not data:
            print(f"⚠️  {csv_filename} 비어있음 — 건너뜀")
            continue

        rows = len(data)
        cols = max(len(row) for row in data)

        # 시트 생성 또는 열기
        if sheet_name in existing_sheets:
            worksheet = spreadsheet.worksheet(sheet_name)
            worksheet.clear()
            print(f"🔄 시트 '{sheet_name}' 초기화")
        else:
            worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=rows + 10, cols=cols + 2)
            print(f"➕ 시트 '{sheet_name}' 생성")

        # 데이터 일괄 업로드
        worksheet.update(range_name="A1", values=data)
        print(f"✅ '{sheet_name}' 업로드 완료: {rows}행 × {cols}열 (헤더 포함)")

        # 헤더 서식 적용
        try:
            format_headers(spreadsheet, worksheet)
            print(f"🎨 '{sheet_name}' 헤더 서식 적용")
        except Exception as e:
            print(f"⚠️  '{sheet_name}' 서식 적용 실패: {e}")

        results.append((sheet_name, rows - 1, cols))  # 헤더 제외 데이터 행수

        # API 쿼터 보호
        time.sleep(2)

    # 기본 Sheet1 삭제
    try:
        default_sheet = spreadsheet.worksheet("Sheet1")
        if len(spreadsheet.worksheets()) > 1:
            spreadsheet.del_worksheet(default_sheet)
            print("🗑️  기본 Sheet1 삭제")
    except (gspread.WorksheetNotFound, gspread.exceptions.APIError):
        pass

    print(f"\n{'='*50}")
    print(f"🎉 완료! Google Sheets '{SPREADSHEET_NAME}' 업로드 결과:")
    print(f"{'='*50}")
    for sheet_name, data_rows, cols in results:
        print(f"  📊 {sheet_name}: 데이터 {data_rows}행 × {cols}열")
    print(f"\n📎 URL: {spreadsheet.url}")


if __name__ == "__main__":
    main()
