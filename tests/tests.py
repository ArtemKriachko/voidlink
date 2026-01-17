import pytest


@pytest.mark.asyncio
async def test_full_workflow(ac):
    # --- 1. РЕЄСТРАЦІЯ ---
    user_username = "tester"
    user_password = "testpassword123"
    reg_response = await ac.post("/register", json={"username": user_username, "password": user_password})
    assert reg_response.status_code in [200, 201, 400, 409]

    # --- 2. ЛОГІН ---
    login_response = await ac.post("/token", data={"username": user_username, "password": user_password})
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # --- 3. СТВОРЕННЯ ПОСИЛАННЯ ---
    target_url = "https://www.google.com"
    link_response = await ac.post("/shorten", json={"target_url": target_url}, headers=headers)
    assert link_response.status_code == 200

    link_data = link_response.json()
    short_key = link_data["short_key"]  # Переконайся, що ключ називається саме так
    print(f"\n[SUCCESS] Створено посилання: {short_key}")

    # --- 4. ПЕРЕВІРКА РЕДИРЕКТУ ---
    # follow_redirects=False, щоб ми могли перевірити статус 307, а не просто результат переходу
    redirect_response = await ac.get(f"/{short_key}", follow_redirects=False)
    assert redirect_response.status_code == 307
    assert redirect_response.headers["location"] == target_url
    print(f"[SUCCESS] Редирект працює: {target_url}")

    # --- 5. ПЕРЕВІРКА АНАЛІТИКИ (КЛІКІВ) ---
    stats_response = await ac.get(f"/my-urls/{short_key}", headers=headers)

    # Виведемо статус для відладки, якщо він не 200
    if stats_response.status_code != 200:
        print(f"[ERROR] Статистика повернула статус {stats_response.status_code}: {stats_response.text}")

    assert stats_response.status_code == 200
    data = stats_response.json()
    assert data["clicks"] >= 1
    print(f"[SUCCESS] Клік зараховано! Поточна кількість: {data['clicks']}")

    # --- 6. ПЕРЕВІРКА ПОМИЛКИ (404) ---
    bad_response = await ac.get("/nonexistent123")
    assert bad_response.status_code == 404
    print("[SUCCESS] Помилка 404 обробляється вірно")

    # --- 7. ВИДАЛЕННЯ ---
    delete_response = await ac.delete(f"/my-urls/{short_key}", headers=headers)
    assert delete_response.status_code == 200
    print("[SUCCESS]: Видалення працює")

    # --- 8. ПЕРЕВІРКА ПІСЛЯ ВИДАЛЕННЯ ---
    # Спробуємо зайти за видаленим посиланням — має бути 404
    final_check = await ac.get(f"/{short_key}")
    assert final_check.status_code == 404
    print(f"[SUCCESS] Підтверджено: посилання {short_key} більше не існує")

    # Спробуємо отримати статистику видаленого посилання — має бути 404
    stats_check = await ac.get(f"/my-urls/{short_key}", headers=headers)
    assert stats_check.status_code == 404
    print("[SUCCESS] Підтверджено: статистика видалена")
