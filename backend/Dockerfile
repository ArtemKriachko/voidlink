FROM python:3.11-slim

# Встановлюємо робочу директорію всередині контейнера
WORKDIR /app

# Копіюємо файл залежностей
COPY requirements.txt .

# Встановлюємо бібліотеки
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо весь код у контейнер
COPY . .

# Команда для запуску сервера
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]