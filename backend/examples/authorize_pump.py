import os

from pts2_sdk import PTS2Client


if os.getenv("CONFIRM_AUTHORIZE") != "yes":
    raise SystemExit("Set CONFIRM_AUTHORIZE=yes to authorize pump 1 from this example.")

with PTS2Client.from_env() as client:
    print(client.pumps.authorize_volume(pump_id=1, nozzle=1, volume=5.0))
