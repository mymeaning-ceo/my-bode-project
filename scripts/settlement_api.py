from .coupang_api import coupang_request


def list_payouts():
    """Return payout list using Coupang settlement API."""
    return coupang_request(
        "GET",
        "/v2/providers/settlement-openapi/apis/api/v1/payouts",
    )


def get_payout_detail(payout_id: str):
    """Return payout detail for the given payout_id."""
    path = f"/v2/providers/settlement-openapi/apis/api/v1/payouts/{payout_id}"
    return coupang_request("GET", path)
