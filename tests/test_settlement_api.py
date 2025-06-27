import unittest
from unittest.mock import patch, Mock

from scripts.settlement_api import list_payouts, get_payout_detail


class SettlementApiTests(unittest.TestCase):
    @patch("scripts.settlement_api.coupang_request")
    def test_list_payouts_calls_coupang_request(self, mock_request):
        mock_request.return_value = {"foo": "bar"}
        data = list_payouts()
        mock_request.assert_called_with(
            "GET", "/v2/providers/settlement-openapi/apis/api/v1/payouts"
        )
        self.assertEqual(data, {"foo": "bar"})

    @patch("scripts.settlement_api.coupang_request")
    def test_get_payout_detail_calls_coupang_request(self, mock_request):
        mock_request.return_value = {"baz": "qux"}
        data = get_payout_detail("123")
        mock_request.assert_called_with(
            "GET",
            "/v2/providers/settlement-openapi/apis/api/v1/payouts/123",
        )
        self.assertEqual(data, {"baz": "qux"})


if __name__ == "__main__":
    unittest.main()
