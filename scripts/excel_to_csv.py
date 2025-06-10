import sys
import pandas as pd
from pymongo import MongoClient
from pathlib import Path

# === [1] 인자 확인 ===
if len(sys.argv) < 5:
    print("❌ 사용법: python excel_to_mongo.py 엑셀파일경로 mongodb_url db_name collection_name")
    sys.exit(1)

excel_path = sys.argv[1]
mongo_url = sys.argv[2]
db_name = sys.argv[3]
collection_name = sys.argv[4]

# === [2] 엑셀 읽기 ===
try:
    df = pd.read_excel(excel_path, header=1)
except Exception as e:
    print(f"❌ 엑셀 읽기 실패: {e}")
    sys.exit(1)

# === [3] 컬럼 정리 ===
df.columns = (
    df.columns.astype(str)
    .str.strip()
    .str.replace('\n', '', regex=False)
    .str.replace('\r', '', regex=False)
)

print("📌 컬럼명:", df.columns.tolist())

base_cols = ['유형', '품목번', '품명']
variant_prefix = ['호칭-색상', '단위', '할당', '재고량', 'DC율', '최초출고일']

records = []
num_groups = (df.shape[1] - len(base_cols)) // 6

for i in range(num_groups):
    start = len(base_cols) + i * 6
    end = start + 6
    sub_cols = df.columns[start:end].tolist()
    block_cols = base_cols + sub_cols

    if not all(col in df.columns for col in block_cols):
        print(f"❌ 누락된 컬럼 있음: {block_cols}")
        continue

    block = df[block_cols].copy()
    variant_cols = [f"{col}{i}" if i > 0 else col for col in variant_prefix]
    block.columns = base_cols + variant_cols
    block = block.dropna(subset=[variant_cols[0]])

    # 정제
    block['DC율'] = (
        block['DC율']
        .astype(str)
        .str.replace('%', '', regex=False)
        .replace('', '0')
        .astype(float) / 100
    )
    block['최초출고일'] = pd.to_datetime(block['최초출고일'], errors='coerce')
    block['재고량'] = pd.to_numeric(block['재고량'], errors='coerce')

    records.extend(block.to_dict('records'))

# === [4] MongoDB에 저장 ===
try:
    client = MongoClient(mongo_url)
    db = client[db_name]
    col = db[collection_name]

    col.delete_many({})
    if records:
        col.insert_many(records)
        print(f"✅ MongoDB 저장 완료: {collection_name} ({len(records)}건)")
    else:
        print("⚠️ 저장할 데이터가 없습니다.")
except Exception as e:
    print(f"❌ MongoDB 저장 실패: {e}")
    sys.exit(1)
