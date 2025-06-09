import sys
import pandas as pd

# 인자: [1] Excel 경로, [2] CSV 경로
excel_path = sys.argv[1] if len(sys.argv) > 1 else '할당표1.xlsx'
csv_path   = sys.argv[2] if len(sys.argv) > 2 else 'try_long_format.csv'

# 1) 엑셀 읽기
df = pd.read_excel(excel_path, header=1)

base_cols   = ['유형', '품명', '호점']
variant_cols = ['점검-색상', '단위', '재고량', 'DC율', '최초출고일']

records = []
num_groups = (df.shape[1] - len(base_cols)) // 6

for i in range(num_groups):
    start = len(base_cols) + i*6
    end   = start + 6
    block = df[base_cols + df.columns[start:end].tolist()].copy()
    block.columns = base_cols + variant_cols
    block = block.dropna(subset=['점검-색상'])

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

long_df = pd.DataFrame(records)
long_df.to_csv(csv_path, index=False, encoding='utf-8-sig')
print(f'CSV saved: {csv_path}, rows: {len(long_df)}')
