import os
import unittest
from unittest.mock import patch, Mock

from scripts.coupang_api import sign, coupang_request


class CoupangApiTests(unittest.TestCase):
    def test_sign(self):
        sig = sign("GET", "/test?a=1", "secret", "1600000000000")
        self.assertEqual(
            sig,
            "ee6f07919c1619aeb42e975369a390ec3990c5c2043434f6d4554f308eb2ae63",
        )

    @patch("requests.request")
    @patch("time.time", return_value=1600000000)
    def test_coupang_request_signing(self, mock_time, mock_request):
        os.environ["CP_ACCESS_KEY"] = "access"
        os.environ["CP_SECRET_KEY"] = "secret"
        os.environ["CP_VENDOR_ID"] = "vendor"
        os.environ["CP_API_HOST"] = "https://api.example.com"

        mock_resp = Mock(ok=True)
        mock_resp.json.return_value = {"result": "ok"}
        mock_request.return_value = mock_resp

        data = coupang_request("GET", "/test", query={"a": "1"})

        expected_sig = "ee6f07919c1619aeb42e975369a390ec3990c5c2043434f6d4554f308eb2ae63"
        mock_request.assert_called_with(
            "GET",
            "https://api.example.com/test?a=1",
            headers={
                "Authorization": f"CEA algorithm=HmacSHA256, access-key=access, signed-date=1600000000000, signature={expected_sig}",
                "Content-Type": "application/json; charset=UTF-8",
                "X-EXTENDED-VENDOR-ID": "vendor",
            },
            json=None,
        )
        self.assertEqual(data, {"result": "ok"})


if __name__ == "__main__":
    unittest.main()
