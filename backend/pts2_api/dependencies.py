from functools import lru_cache
from fastapi import Depends
from sqlalchemy.orm import Session
from pts2_sdk import PTS2Client
from pts2_sdk.settings import Settings, configure_logging

from .database import get_db
from .models import SystemSetting


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    configure_logging(settings)
    return settings


def get_pts2_client(db: Session = Depends(get_db)) -> PTS2Client:
    settings = get_settings()
    
    # Create copy of settings
    from pts2_sdk.settings import Settings as SDKSettings
    client_settings = SDKSettings()
    for k, v in settings.model_dump().items():
        setattr(client_settings, k, v)
        
    # Query database
    local_db = db
    close_db = False
    if local_db is None or type(local_db).__name__ == "Depends":
        from .database import SessionLocal
        local_db = SessionLocal()
        close_db = True
        
    try:
        host_setting = local_db.query(SystemSetting).filter(SystemSetting.key == "pts2_host").first()
        if host_setting and host_setting.value:
            client_settings.pts2_host = host_setting.value
    except Exception as exc:
        print(f"Error loading pts2_host from database in get_pts2_client: {exc}")
    finally:
        if close_db and local_db:
            local_db.close()
            
    return PTS2Client.from_settings(client_settings)
