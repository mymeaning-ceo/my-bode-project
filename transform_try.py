import pandas as pd

# 1) 엑셀 읽기
df = pd.read_excel('할당표1.xlsx', header=1)

base_cols = ['유형', '품목번', '품명']
variant_cols = ['호칭-색상', '단위', '할당', '재고량', 'DC율', '최초출고일']

records = []
num_groups = (df.shape[1] - len(base_cols)) // 6

for i in range(num_groups):
    start = len(base_cols) + i*6
    end   = start + 6
    block = df[base_cols + df.columns[start:end].tolist()].copy()
    block.columns = base_cols + variant_cols
    block = block.dropna(subset=['호칭-색상'])

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
long_df.to_csv('try_long_format.csv', index=False, encoding='utf-8-sig')
print("총 변환 행:", len(long_df))
