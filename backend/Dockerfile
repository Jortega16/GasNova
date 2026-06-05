FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml requirements.txt ./
COPY pts2_sdk ./pts2_sdk
COPY pts2_api ./pts2_api
COPY examples ./examples

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -e ".[all]"

EXPOSE 8000

CMD ["uvicorn", "pts2_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
