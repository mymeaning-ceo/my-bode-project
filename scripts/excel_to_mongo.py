import os
import sys
import pandas as pd
from pymongo import MongoClient
import traceback
from pathlib import Path
import re
from dotenv import load_dotenv
from typing import Union, IO

# ─────────────────────────────────────────────
# ① .env 파일에서 환경변수 불러오기 (MONGO_URI 포함)
# ─────────────────────────────────────────────
load_dotenv()

# ─────────────────────────────────────────────
# ② 공통 유틸 함수 정의
# ─────────────────────────────────────────────

# DC율(예: "40%", "0.4")을 정형화: "40%" 형식으로 출력
PERCENT_RE = re.compile(r"^\s*([0-9]+(?:\.[0-9]+)?)\s*%?\s*$")
def format_percent(val) -> str:
    if pd.isna(val):
        return ""
    s = str(val).strip()
    m = PERCENT_RE.match(s)
    if not m:
        return s
    num = float(m.group(1))
    if num <= 1:
        num *= 100
    return f"{num:.0f}%"

# 숫자를 정수로 변환 (소수 또는 문자열 포함)
def to_int(val):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None

# NaN → 빈 문자열, 그 외 → 문자열.strip()
def safe_str(val) -> str:
    return "" if pd.isna(val) else str(val).strip()

# ─────────────────────────────────────────────
# ③ CSV(비정규) 데이터 정규화 처리 함수
# ─────────────────────────────────────────────

GROUP_COLS = ["호칭-색상", "단위", "할당", "재고량", "DC율", "최초출고일"]
BASE_COLS  = ["유형", "품목번", "품명"]

def transform_csv_irregular(path: Union[str, Path], encoding="utf-8") -> list[dict]:
    df = pd.read_csv(path, skiprows=1, sep=",", encoding=encoding)
    df.columns = [str(c).strip().replace("\n", " ") for c in df.columns]

    for col in BASE_COLS:
        if col in df.columns:
            df[col] = df[col].ffill()

    group_count = (len(df.columns) - len(BASE_COLS)) // len(GROUP_COLS)
    records = []

    for _, row in df.iterrows():
        base = {
            "type": safe_str(row["유형"]),
            "item_code": safe_str(row["품목번"]),
            "item_name": safe_str(row["품명"]),
        }

        for i in range(group_count):
            keys = [k if i == 0 else f"{k}.{i}" for k in GROUP_COLS]
            if keys[0] not in df.columns:
                continue

            spec = safe_str(row.get(keys[0]))
            if not spec or spec.lower() == "nan":
                continue

            size, color = (spec.split("-", 1) + [""])[:2] if "-" in spec else (spec, "")

            record = {
                **base,
                "size_color": spec,
                "size": size.strip(),
                "color": color.strip(),
                "unit": safe_str(row.get(keys[1])),
                "allocation": safe_str(row.get(keys[2])),
                "qty": to_int(row.get(keys[3])),
                "dc_rate": format_percent(row.get(keys[4])),
                "first_release_date": pd.to_datetime(row.get(keys[5]), errors="coerce").to_pydatetime()
                if pd.notna(row.get(keys[5])) else None,
            }

            records.append(record)

    return records

# ─────────────────────────────────────────────
# ④ Excel(.xlsx) 파일 정규화 처리 함수
# ─────────────────────────────────────────────
def transform_excel(path: Union[str, Path, IO]) -> list[dict]:
    df = pd.read_excel(path, header=1, engine="openpyxl")
    df.columns = [str(c).strip().replace("\n", " ") for c in df.columns]

    for col in ["유형", "품목번", "품명"]:
        df[col] = df[col].ffill()

    group_count = (len(df.columns) - 3) // 6  # base 3, group 6개 단위

    records = []
    for _, row in df.iterrows():
        base = {
            "type": safe_str(row["유형"]),
            "item_code": safe_str(row["품목번"]),
            "item_name": safe_str(row["품명"]),
        }

        for i in range(group_count):
            keys = [k if i == 0 else f"{k}.{i}" for k in ["호칭-색상", "단위", "할당", "재고량", "DC율", "최초출고일"]]
            spec = safe_str(row.get(keys[0]))
            if not spec:
                continue

            size, color = (spec.split("-", 1) + [""])[:2] if "-" in spec else (spec, "")

            records.append({
                **base,
                "size_color": spec,
                "size": size.strip(),
                "color": color.strip(),
                "unit": safe_str(row.get(keys[1])),
                "allocation": safe_str(row.get(keys[2])),
                "qty": to_int(row.get(keys[3])),
                "dc_rate": format_percent(row.get(keys[4])),
                "first_release_date": pd.to_datetime(row.get(keys[5]), errors="coerce").to_pydatetime()
                if pd.notna(row.get(keys[5])) else None
            })

    return records

# ─────────────────────────────────────────────
# ⑤ 파일 확장자에 따라 분기 처리
# ─────────────────────────────────────────────
def transform_file(path: Union[str, Path, IO]) -> list[dict]:
    path_str = str(path).lower()
    if path_str.endswith((".xls", ".xlsx")):
        return transform_excel(path)
    elif path_str.endswith(".csv"):
        return transform_csv_irregular(path)
    else:
        raise ValueError(f"지원하지 않는 파일 형식: {path}")

# ─────────────────────────────────────────────
# ⑥ 메인 실행부: 파일 변환 → MongoDB 저장
# ─────────────────────────────────────────────
def main():
    if len(sys.argv) < 4:
        print("❌ 사용법: python file_to_mongo.py <file_path> <db_name> <collection_name>")
        sys.exit(1)

    file_path, db_name, collection_name = sys.argv[1:4]
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("❌ 환경 변수 MONGO_URI이 설정되지 않았습니다.")
        sys.exit(1)

    try:
        # 🔧 수정 내용: 확장자에 따라 엑셀/CSV를 자동 판단하여 처리
        docs = transform_file(file_path)
    except Exception as e:
        print("❌ Transform error:", e, file=sys.stderr)
        traceback.print_exc()
        sys.exit(2)

    try:
        with MongoClient(mongo_uri) as client:
            col = client[db_name][collection_name]
            if docs:
                col.delete_many({})  # 기존 데이터 전체 삭제
                col.insert_many(docs)
                print(f"✅ MongoDB 저장 완료: {len(docs)}건")
            else:
                print("⚠️ 변환된 데이터가 없습니다.")
    except Exception as e:
        print("❌ MongoDB 저장 실패:", e, file=sys.stderr)
        traceback.print_exc()
        sys.exit(3)

if __name__ == "__main__":
    main()
