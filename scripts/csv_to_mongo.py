#!/usr/bin/env python3
"""
csv_to_mongo.py

Usage:
    python csv_to_mongo.py <csv_path> <mongo_uri> <db_name> <collection_name>
"""

import sys
import pandas as pd
from pymongo import MongoClient


def main():
    if len(sys.argv) < 5:
        print("Usage: python csv_to_mongo.py <csv_path> <mongo_uri> <db_name> <collection_name>")
        sys.exit(1)

    csv_path, mongo_uri, db_name, collection_name = sys.argv[1:5]

    # 1) CSV 읽기
    df = pd.read_csv(csv_path, encoding='utf-8-sig')
    records = df.to_dict('records')

    # 2) MongoDB 연결
    client = MongoClient(mongo_uri)
    collection = client[db_name][collection_name]

    # 3) 업로드
    if records:
        result = collection.insert_many(records)
        print(f"✅ Inserted {len(result.inserted_ids)} documents into {db_name}.{collection_name}")
    else:
        print("⚠️  No records found in CSV.")


if __name__ == "__main__":
    main()
