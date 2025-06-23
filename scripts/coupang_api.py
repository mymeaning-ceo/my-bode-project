import os
import hmac
import hashlib
import time
from urllib.parse import urlencode
import requests


def sign(method: str, url_path: str, secret_key: str, timestamp: str) -> str:
    """Return Coupang API signature."""
    message = f"{timestamp}{method}{url_path}"
    return hmac.new(secret_key.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()


def coupang_request(method: str, path: str, *, query: dict | None = None, body: dict | None = None):
    """Send a request to the Coupang Open API."""
    access_key = os.getenv("CP_ACCESS_KEY")
    secret_key = os.getenv("CP_SECRET_KEY")
    vendor_id = os.getenv("CP_VENDOR_ID")
    host = os.getenv("CP_API_HOST", "https://api-gateway.coupang.com")

    if not access_key or not secret_key or not vendor_id:
        raise RuntimeError("Coupang API credentials are not set")

    query_str = "?" + urlencode(query) if query else ""
    url_path = f"{path}{query_str}"
    timestamp = str(int(time.time() * 1000))
    signature = sign(method, url_path, secret_key, timestamp)

    headers = {
        "Authorization": f"CEA algorithm=HmacSHA256, access-key={access_key}, signed-date={timestamp}, signature={signature}",
        "Content-Type": "application/json; charset=UTF-8",
        "X-EXTENDED-VENDOR-ID": vendor_id,
    }

    resp = requests.request(method, host + url_path, headers=headers, json=body)
    if not resp.ok:
        raise RuntimeError(f"Coupang API error: {resp.status_code} {resp.text}")
    return resp.json()


if __name__ == "__main__":
    import argparse, json

    parser = argparse.ArgumentParser(description="Call Coupang Open API")
    parser.add_argument("method")
    parser.add_argument("path")
    parser.add_argument("--query", help="Query string like key=val&key2=val2")
    args = parser.parse_args()

    q = dict(pair.split("=", 1) for pair in args.query.split("&")) if args.query else None
    data = coupang_request(args.method.upper(), args.path, query=q)
    print(json.dumps(data, ensure_ascii=False, indent=2))
