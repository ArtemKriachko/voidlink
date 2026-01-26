@echo off

chcp 65001 > nul

cls



:: ВАЖЛИВО: Назва має збігатися з container_name у твойому yaml

set BACKEND_CONTAINER=fastapi_app



echo ==========================================================

echo       FULL STACK REBUILD AND INTEGRATION TESTING

echo ==========================================================



echo.

echo [1/4] Зупинка системи та видалення старих даних...

:: -v видаляє volume з базою для чистого тесту

docker-compose down -v



echo.

echo [2/4] Збірка та запуск (Frontend, Backend, DB)...

docker-compose up --build -d



echo.

echo [3/4] Очікування стабілізації (7 секунд)...

timeout /t 7 /nobreak > nul



echo.

echo [4/4] Запуск тестів всередині контейнера %BACKEND_CONTAINER%...

echo ----------------------------------------------------------

:: Запускаємо pytest через правильну назву контейнера

docker exec -e PYTHONIOENCODING=utf-8 -it %BACKEND_CONTAINER% pytest -v -s tests/tests.py



if %ERRORLEVEL% NEQ 0 (

    echo.

    echo [!] ПОМИЛКА: Тести провалені!

    color 0C

) else (

    echo.

    echo [OK] УСІ ТЕСТИ ПРОЙШЛИ УСПІШНО!

    color 0A

)

echo ----------------------------------------------------------



echo.

echo Проект доступний:

echo - Frontend: http://localhost:3000

echo - Backend API: http://localhost:8000

echo - Docs: http://localhost:8000/docs

echo.

pause

color 07