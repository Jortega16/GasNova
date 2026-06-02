from pts2_sdk import PTS2Client


with PTS2Client.from_env() as client:
    print(client.get_datetime())
