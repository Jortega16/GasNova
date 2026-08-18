FROM python:3.12-slim

RUN apt-get update && apt-get install -y cups-client cups-bsd && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Commit corto y fecha de build, inyectados desde afuera (docker compose build
# --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) --build-arg
# BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)). Sin argumento, quedan en
# "unknown" — así /version siempre responde algo, nunca falla por faltar esto.
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ARG APP_VERSION=unknown
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV APP_VERSION=$APP_VERSION

WORKDIR /app

COPY pyproject.toml requirements.txt run_backend.bat alembic.ini ./
COPY pts2_sdk ./pts2_sdk
COPY pts2_api ./pts2_api
COPY alembic ./alembic
COPY examples ./examples

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -e ".[all]"

EXPOSE 8000

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["uvicorn", "pts2_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
