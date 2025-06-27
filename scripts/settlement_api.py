from .coupang_api import coupang_request


def list_payouts(start_date: str, end_date: str) -> dict:
    """Return payout summaries between two dates.

    This function delegates to :func:`coupang_request` and therefore may
    raise ``RuntimeError`` if the request fails or the API credentials are
    not configured.
    """
    return coupang_request(
        "GET",
        "/v2/providers/settlement/payouts",
        query={"startDate": start_date, "endDate": end_date},
    )


def get_payout_detail(payout_id: str) -> dict:
    """Return detailed information for a specific payout.

    Like :func:`list_payouts`, this relies on :func:`coupang_request` and
    will propagate its ``RuntimeError`` exceptions on failure.
    """
    return coupang_request(
        "GET",
        f"/v2/providers/settlement/payouts/{payout_id}",
    )
