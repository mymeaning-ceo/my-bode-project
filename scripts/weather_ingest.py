import os
import sys
import time
import requests
from datetime import datetime, timedelta
from urllib.parse import urlencode
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

load_dotenv()

SERVICE_KEY = os.getenv("WEATHER_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "forum")
COL_NAME = "weather"
NX = 60
NY = 127
BASE_TIME = "0500"
NUM_ROWS = 1000

if not SERVICE_KEY or not MONGO_URI:
    print("환경 변수가 설정되지 않았습니다.", file=sys.stderr)
    sys.exit(1)

client = MongoClient(MONGO_URI)
collection = client[DB_NAME][COL_NAME]

def fetch_vilage_fcst(base_date: str):
    base_url = (
        "https://apis.data.go.kr/1360000/"
        "VilageFcstInfoService_2.0/getVilageFcst"
    )
    params = {
        "serviceKey": SERVICE_KEY,
        "pageNo": 1,
        "numOfRows": NUM_ROWS,
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": BASE_TIME,
        "nx": NX,
        "ny": NY,
    }
    url = f"{base_url}?{urlencode(params, safe='%')}"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    body = resp.json()["response"]["body"]
    return body["items"]["item"]

def summarize(items):
    summary = {"TMX": None, "TMN": None, "POP": None, "PCP": None}
    for it in items:
        cat = it.get("category")
        val = it.get("fcstValue")
        if cat in summary and summary[cat] is None:
            summary[cat] = val
    return summary

def main():
    today = datetime.now().date()
    start = today - timedelta(days=90)

    bulk_ops = []
    for i in range(91):
        target_date = (start + timedelta(days=i)).strftime("%Y%m%d")
        try:
            items = fetch_vilage_fcst(target_date)
            data = summarize(items)
            data.update({
                "_id": target_date,
                "nx": NX,
                "ny": NY,
                "updatedAt": datetime.utcnow(),
            })
            bulk_ops.append(
                UpdateOne({"_id": data["_id"]}, {"$set": data}, upsert=True)
            )
            print(f"[OK] {target_date}")
            time.sleep(0.3)
        except Exception as e:
            print(f"[FAIL] {target_date}: {e}", file=sys.stderr)

    if bulk_ops:
        result = collection.bulk_write(bulk_ops)
        print("Upserted:", result.upserted_count, "Modified:", result.modified_count)

if __name__ == "__main__":
    main()
