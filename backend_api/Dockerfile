# 1. Grab a pre-built Linux machine that already has Playwright installed!
FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

# 2. Set up our working directory inside the container
WORKDIR /app

# 3. Copy our requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the rest of our Python code into the container
COPY . .

# 5. Hugging Face strictly requires apps to broadcast on Port 7860
EXPOSE 7860

# 6. Boot up the FastAPI server
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]