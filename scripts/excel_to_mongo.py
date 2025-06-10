import os, sys, pandas as pd
from pymongo import MongoClient
import traceback
import re


def transform(excel_bytes):
    df = pd.read_excel(excel_bytes, header=1)
    [re.sub(r'\s+', '', str(c).replace('\n', '')) for c in df.columns]
    start_col = 2 + 6  # I column index start of first group
    group_cnt = (df.shape[1] - start_col) // 6
    records = []

    for _, row in df.iterrows():
        for g in range(group_cnt):
            off = start_col + g*6
            sub = row.iloc[off:off+6]  # [호칭-색상, 단위, 탑당(지점명), 재고량, DC율, 최초출고일]
            site = sub.iloc[2]
            qty  = sub.iloc[3]
            spec = sub.iloc[0]
            if pd.notna(site) and pd.notna(qty):
                records.append({
                    'item_code': row['품목번호'],
                    'item_name': row['품명'],
                    'spec'     : spec,
                    'site'     : str(site).strip(),
                    'qty'      : int(qty)
                })
    return records


def main():
    if len(sys.argv) < 2:
        print("Usage: python excel_to_mongo.py <excel_path>")
        sys.exit(1)

    excel_path = sys.argv[1]
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    client = MongoClient(mongo_uri)
    col = client['stockdb']['stock']

         try:
        with open(excel_path, 'rb') as f:
            docs = transform(f)
    except Exception as e:
        print("\u274C Transform error:", e, file=sys.stderr)
        traceback.print_exc()
        sys.exit(2)

    if docs:
        col.delete_many({})  # 전체 교체. 필요 시 조건 변경
        col.insert_many(docs)
        print(f"\u2705 Inserted {len(docs)} docs into MongoDB")
    else:
        print("\u26A0\uFE0F No data parsed from the Excel file") the Excel file")


if __name__ == "__main__":
    main()
