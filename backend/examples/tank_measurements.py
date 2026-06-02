from pts2_sdk import PTS2Client


with PTS2Client.from_env() as client:
    print(client.probes.get_all_measurements())
    print(client.tanks.get_tanks_configuration())
