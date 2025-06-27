import sys
import pandas as pd
import json
import re
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

if len(sys.argv) < 3:
    logging.error('Usage: python excel_to_json.py <excel_path> <output_path>')
    sys.exit(1)

excel_path = sys.argv[1]
output_path = sys.argv[2]

# Read first sheet and use first row as header
try:
    df = pd.read_excel(excel_path, header=0)
except Exception as e:
    logging.error('Error reading Excel: %s', e)
    sys.exit(2)

# Sanitize column names: remove whitespace and newlines using regex
clean_cols = [re.sub(r"\s+", '', str(c)) for c in df.columns]
df.columns = clean_cols

records = df.to_dict(orient='records')

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False)

logging.info('JSON saved to %s with %d records', output_path, len(records))

