from datetime import datetime

from pts2_sdk import PTS2Client


with PTS2Client.from_env() as client:
    today = datetime.now().strftime("%Y-%m-%d")
    transactions = client.reports.get_pump_transactions(
        pump_id=1,
        date_time_start=f"{today}T00:00:00",
        date_time_end=f"{today}T23:59:59",
    )
    output = client.reports.export_json(transactions)
    print(f"Exported {len(transactions)} transactions to {output}")
