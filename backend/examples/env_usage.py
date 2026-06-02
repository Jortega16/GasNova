from pts2_sdk import PTS2Client
from pts2_sdk.settings import Settings


settings = Settings()
print(settings.base_url)

with PTS2Client.from_settings(settings) as client:
    print(client.healthcheck())
