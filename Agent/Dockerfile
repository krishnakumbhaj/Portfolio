FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (layer cache)
COPY Agent/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent source
COPY Agent/Brain.py    ./Brain.py
COPY Agent/main.py     ./main.py
COPY Agent/tools/      ./tools/
COPY Agent/resume.pdf  ./resume.pdf

# Copy logo images (resolved by email_tool.py at ./Images/)
COPY Nextjs/src/Images/ ./Images/

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
