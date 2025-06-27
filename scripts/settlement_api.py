from coupang_api import coupang_request
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def list_payouts(
    page: int = 0,
    size: int = 20,
    start_date: str | None = None,   # 형식: 'YYYY-MM-DD'
    end_date: str | None = None      # 형식: 'YYYY-MM-DD'
):
    """
    정산(매출) 리스트 조회
    - page, size: 페이지네이션 파라미터
    - start_date, end_date: 조회 기간 (선택)
    """
    path = "/v2/providers/seller_api/apis/api/v1/settlement/payouts"
    query = {
        "page": page,
        "size": size,
    }
    if start_date:
        query["startDate"] = start_date
    if end_date:
        query["endDate"] = end_date

    return coupang_request("GET", path, query=query)


def get_payout_detail(settlement_id: str | int):
    """
    특정 정산 ID 의 상세 리포트 조회
    """
    path = f"/v2/providers/seller_api/apis/api/v1/settlement/payouts/{settlement_id}"
    return coupang_request("GET", path)


# 사용 예시 -------------------------------------------------------------------
if __name__ == "__main__":
    # 1) 최근 30일 정산 내역 첫 페이지(20건) 조회
    payouts = list_payouts(
        page=0,
        size=20,
        start_date="2025-05-28",
        end_date="2025-06-27",
    )
    logging.info("=== Payout List ===")
    for p in payouts.get("content", []):
        logging.info("%s %s", p["settlementId"], p["payoutAmount"])

    # 2) 특정 정산 ID 상세 조회
    if payouts.get("content"):
        settlement_id = payouts["content"][0]["settlementId"]
        detail = get_payout_detail(settlement_id)
        logging.info("\n=== Payout Detail ===")
        logging.info("%s", detail)
