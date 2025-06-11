
import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import re

load_dotenv()

def safe_str(val) -> str:
    return "" if pd.isna(val) else str(val).strip()

def format_percent(val) -> str:
    if pd.isna(val):
        return ""
    s = str(val).strip()
    m = re.match(r"^\s*([0-9]+(?:\.[0-9]+)?)\s*%?\s*$", s)
    if not m:
        return s
    num = float(m.group(1))
    if num <= 1:
        num *= 100
    return f"{num:.0f}%"

def to_int(val):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None

def transform_csv_irregular(file_path):
    df = pd.read_csv(file_path, skiprows=1, sep=",", encoding="utf-8")

    base_cols = ["유형", "품목번", "품명"]
    group_keys = ["호칭-색상", "단위", "할당", "재고량", "DC율", "최초출고일"]
    group_count = (len(df.columns) - len(base_cols)) // len(group_keys)

    for col in base_cols:
        df[col] = df[col].ffill()

    records = []
    for _, row in df.iterrows():
        base = {
            "type": safe_str(row["유형"]),
            "item_code": safe_str(row["품목번"]),
            "item_name": safe_str(row["품명"]),
        }

        for i in range(group_count):
            keys = []
            for k in group_keys:
                colname = k if i == 0 else f"{k}.{i}"
                keys.append(colname)

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

def main():
    import sys
    if len(sys.argv) < 4:
        print("사용법: python file_to_mongo.py <csv_path> <db_name> <collection_name>")
        return

    csv_path, db_name, col_name = sys.argv[1:4]
    mongo_uri = os.getenv("DB_URL")

    docs = transform_csv_irregular(csv_path)
    with MongoClient(mongo_uri) as client:
        col = client[db_name][col_name]
        col.delete_many({})
        if docs:
            col.insert_many(docs)
            print(f"✅ 업로드 완료: {len(docs)}건")
        else:
            print("⚠️ 변환된 데이터가 없습니다.")

if __name__ == "__main__":
    main()
