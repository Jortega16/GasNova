from pts2_sdk import PTS2Client


client = PTS2Client.from_env()

print(client.get_datetime())
print(client.get_network_settings())
print(client.pumps.get_status(1))
