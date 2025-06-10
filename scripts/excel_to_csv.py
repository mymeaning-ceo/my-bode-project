import sys
import pandas as pd

excel_path = sys.argv[1]
csv_path = sys.argv[2]

# 엑셀 읽기
try:
    df = pd.read_excel(excel_path, header=0)
except Exception as e:
    print(f"❌ Excel 읽기 오류: {e}", file=sys.stderr)
    sys.exit(1)

    

# 열 이름 정리
df.columns = (
    df.columns.astype(str)
    .str.strip()
    .str.replace('\n', '', regex=False)
    .str.replace('\r', '', regex=False)
)

print("📌 실제 컬럼명:", df.columns.tolist())

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

    # ✅ 반복열에 고유 이름 붙이기
    variant_cols = [
        f"{col}{i}" if i > 0 else col for col in variant_prefix
    ]
    block.columns = base_cols + variant_cols

    block = block.dropna(subset=[variant_cols[0]])

    # 정제 - 현재 반복 차수에 맞는 컬럼명을 사용
    dc_col = variant_cols[4]
    date_col = variant_cols[5]
    qty_col = variant_cols[3]

    block[dc_col] = (
        block[dc_col]
        .astype(str)
        .str.replace('%', '', regex=False)
        .replace('', '0')
        .astype(float)
        / 100
    )
    block[date_col] = pd.to_datetime(block[date_col], errors='coerce')
    block[qty_col] = pd.to_numeric(block[qty_col], errors='coerce')

    records.extend(block.to_dict('records'))

# 결과 저장
long_df = pd.DataFrame(records)
long_df.to_csv(csv_path, index=False, encoding='utf-8-sig')
print(f'✅ CSV saved: {csv_path}, rows: {len(long_df)}')
