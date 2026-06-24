FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY motor/requirements.txt /app/requirements.txt
RUN pip install --root-user-action=ignore -r /app/requirements.txt

CMD ["python", "-u", "motor.py"]
