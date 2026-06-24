# 1. Start with an official Python 3.12 base image
FROM python:3.12-bookworm

# 2. Set up our working directory
WORKDIR /app

# 3. Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. CRITICAL: Tell Playwright to download Chromium AND its Linux system dependencies
RUN playwright install --with-deps chromium

# 5. Copy the rest of your backend code
COPY . .

# 6. Hugging Face strictly requires apps to broadcast on Port 7860
EXPOSE 7860

# 7. Boot up the FastAPI server
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]