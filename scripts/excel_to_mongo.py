import os
import sys
import pandas as pd
from pymongo import MongoClient
import traceback

def transform(excel_bytes):
    df = pd.read_excel(excel_bytes, header=1)
    df.columns = df.columns.str.strip().str.replace('\n', '')
    start_col = 2 + 6  # I column index (first group starts from 9th column)
    group_cnt = (df.shape[1] - start_col) // 6
    records = []

    for _, row in df.iterrows():
        for g in range(group_cnt):
            off = start_col + g * 6
            sub = row.iloc[off:off + 6]  # [호칭-색상, 단위, 탑당(지점명), 재고량, DC율, 최초출고일]
            if len(sub) < 4:
                continue
            site = sub.iloc[2]
            qty = sub.iloc[3]
            spec = sub.iloc[0]
            if pd.notna(site) and pd.notna(qty):
                try:
                    records.append({
                        'item_code': row['품목번호'],
                        'item_name': row['품명'],
                        'spec': spec,
                        'site': str(site).strip(),
                        'qty': int(float(qty))
                    })
                except Exception as e:
                    print("⚠️ 데이터 파싱 오류:", e, file=sys.stderr)
                    continue
    return records

def main():
    if len(sys.argv) < 5:
        print("❌ 사용법: python excel_to_mongo.py <excel_path> <mongo_uri> <db_name> <collection_name>")
        sys.exit(1)

    excel_path, mongo_uri, db_name, collection_name = sys.argv[1:5]

    try:
        with open(excel_path, 'rb') as f:
            docs = transform(f)
    except Exception as e:
        print("❌ 엑셀 변환 중 오류:", e, file=sys.stderr)
        traceback.print_exc()
        sys.exit(2)

    try:
        client = MongoClient(mongo_uri)
        col = client[db_name][collection_name]

        if docs:
            col.delete_many({})
            col.insert_many(docs)
            print(f"✅ MongoDB 저장 완료: {len(docs)}건")
        else:
            print("⚠️ 엑셀에서 변환된 데이터가 없습니다.")
    except Exception as e:
        print("❌ MongoDB 저장 실패:", e, file=sys.stderr)
        traceback.print_exc()
        sys.exit(3)

if __name__ == "__main__":
    main()
