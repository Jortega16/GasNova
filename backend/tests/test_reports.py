import json

from pts2_sdk import PTS2Client


class FakeTransport:
    def __init__(self, response):
        self.response = response
        self.requests = []

    def post(self, payload):
        self.requests.append(payload)
        return self.response


def test_report_export_json_and_csv(tmp_path):
    client = PTS2Client(
        host="192.168.50.117",
        reports_path=str(tmp_path),
        transport=FakeTransport(
            {
                "Protocol": "jsonPTS",
                "Packets": [
                    {
                        "Id": 1,
                        "Type": "ReportGetPumpTransactions",
                        "Data": {
                            "Records": [
                                {"Pump": 1, "Transaction": 10, "Volume": 5.5, "Amount": 100.0},
                                {"Pump": 1, "Transaction": 11, "Volume": 3.0, "Amount": 54.0},
                            ]
                        },
                    }
                ],
            }
        ),
    )

    records = client.reports.get_pump_transactions(pump_id=1)
    json_path = client.reports.export_json(records, tmp_path / "transactions.json")
    csv_path = client.reports.export_csv(records, tmp_path / "transactions.csv")

    assert len(records) == 2
    assert json.loads(json_path.read_text())[0]["Pump"] == 1
    assert "Transaction" in csv_path.read_text()
    assert client.transport.requests[0]["Packets"][0]["Data"] == {"Pump": 1}


def test_report_filter_formats_datetime():
    from datetime import datetime

    client = PTS2Client(
        host="192.168.50.117",
        transport=FakeTransport(
            {
                "Protocol": "jsonPTS",
                "Packets": [
                    {"Id": 1, "Type": "ReportGetPumpTransactions", "Data": {"Records": []}},
                ],
            }
        ),
    )

    data = client.reports._report_filter(
        pump=1,
        start=datetime(2026, 5, 2, 0, 0, 0),
        end=datetime(2026, 5, 30, 23, 59, 59),
    )

    assert data == {
        "Pump": 1,
        "DateTimeStart": "2026-05-02T00:00:00",
        "DateTimeEnd": "2026-05-30T23:59:59",
    }
