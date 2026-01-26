import asyncio
import os
import sys

print(f"Поточна директорія: {os.getcwd()}")
print(f"Список файлів: {os.listdir('.')}")

from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

sys.path.append("/app")

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import httpx

try:
    from database import SessionLocal
    from crud import create_user, get_user_by_username, authenticate_user, get_user_by_tg_id
    import schemas
except ImportError as e:
    from backend.database import SessionLocal
    from backend.crud import create_user, get_user_by_username, authenticate_user, get_user_by_tg_id
    import backend.schemas as schemas

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
bot = Bot(token=TOKEN)
dp = Dispatcher()

class RegisterSteps(StatesGroup):
    wait_username = State()
    wait_password = State()

class LoginSteps(StatesGroup):
    wait_username = State()
    wait_password = State()

class ShortenSteps(StatesGroup):
    wait_url = State()

#  РЕЄСТРАЦІЯ
@dp.message(Command("registration", "register"))
async def start_reg(message: types.Message, state: FSMContext):
    await message.answer("Реєстрація терміналу\n\nВведи бажаний username:")
    await state.set_state(RegisterSteps.wait_username)

@dp.message(RegisterSteps.wait_username)
async def reg_username(message: types.Message, state: FSMContext):
    await state.update_data(username=message.text)
    await message.answer("Тепер введи пароль (повідомлення буде видалено):")
    await state.set_state(RegisterSteps.wait_password)


@dp.message(RegisterSteps.wait_password)
async def reg_finish(message: types.Message, state: FSMContext):
    try:
        await message.delete()
    except:
        pass

    data = await state.get_data()
    username = data.get('username')
    tg_id = message.from_user.id
    password = message.text

    db = SessionLocal()
    try:
        if get_user_by_username(db, username):
            await message.answer("❌ Помилка: Цей логін вже зайнятий. Спробуй /registration ще раз.")
            return

        if get_user_by_tg_id(db, tg_id):
            await message.answer("❌ Помилка: Твій Telegram вже прив'язаний до іншого акаунта.")
            return  # Зупиняємо!

        create_user(
            db,
            user=schemas.UserCreateTelegram(
                username=username,
                password=password,
                telegram_id=tg_id
            )
        )
        await message.answer(f"✅ Готово! Акаунт {username} створено. Можеш надсилати посилання.")

    except Exception as e:
        print(f"Error during registration: {e}")
        await message.answer("⚠️ Сталася помилка при реєстрації. Спробуй пізніше.")
    finally:
        db.close()
        await state.clear()

# ЛОГІН
@dp.message(Command("login"))
async def start_login(message: types.Message, state: FSMContext):
    await message.answer("Вхід у систему\n\nВведи свій username:")
    await state.set_state(LoginSteps.wait_username)

@dp.message(LoginSteps.wait_username)
async def login_username(message: types.Message, state: FSMContext):
    await state.update_data(username=message.text)
    await message.answer("Введи пароль:")
    await state.set_state(LoginSteps.wait_password)

@dp.message(LoginSteps.wait_password)
async def login_finish(message: types.Message, state: FSMContext):
    try:
        await message.delete()
    except:
        pass

    data = await state.get_data()
    db = SessionLocal()
    try:
        user = authenticate_user(db, data['username'], message.text)
        if user:
            user.telegram_id = message.from_user.id
            db.commit()
            await message.answer(f"Успішно! Ласкаво просимо, {data['username']}.")
            await state.update_data(user_id=user.telegram_id)
        else:
            await message.answer("Помилка: Невірний логін або пароль. Спробуй /login")
    finally:
        db.close()
        await state.clear()


@dp.message(Command("current_tg_id", "tg_id"))
async def current_tg_id(message: types.Message):
    telegram_id = str(message.from_user.id)
    headers = {"X-Telegram-ID": str(message.from_user.id)}
    await message.answer(f"Твій ID: {telegram_id}")
    await message.answer(f"Заголовки для API: {str(headers)}")

@dp.message(Command("urls"))
async def start_stats(message: types.Message):
    async with httpx.AsyncClient() as client:
        try:
            telegram_id = str(message.from_user.id)
            response = await client.get(
                "http://api:8000/my-urls",
                headers={"X-Telegram-ID": telegram_id},
                timeout=5.0
            )

            if response.status_code == 200:
                urls = response.json()

                if not urls:
                    await message.answer("У тебе ще немає створених посилань.")
                    return

                report = "Твої посилання:\n\n"
                for url in urls:
                    short = url.get('short_key')
                    clicks = url.get('clicks', 0)
                    report += f"http://localhost:8000/{short} — {clicks} кліків\n"

                await message.answer(report)

            elif response.status_code == 401:
                await message.answer("Помилка: Твій акаунт не знайдено. Спочатку використай /login або /registration")
            else:
                await message.answer("Не вдалося отримати статистику.")

        except httpx.RequestError as e:
            await message.answer("Помилка зв'язку з сервісом.")
            print(f"HTTpx error: {e}")


# HELP
@dp.message(Command("start", "help"))
async def cmd_help(message: types.Message):
    await message.answer(
        "VoidLink Control Panel\n\n"
        "/registration - Створити акаунт\n"
        "/login - Прив'язати акаунт\n"
        "/urls - Твои ссылки\n\n"
        "Просто надішли довге посилання, щоб скоротити його."
    )


URL_PATTERN = r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+"


@dp.message(Command("shorten"))
async def start_shorten(message: types.Message, state: FSMContext):
    await message.answer("Вставьте ссылку для сокращения.")
    await state.set_state(ShortenSteps.wait_url)

@dp.message(ShortenSteps.wait_url)
async def process_shorten(message: types.Message, state: FSMContext):
    long_url = message.text.strip()
    telegram_id = str(message.from_user.id)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://api:8000/shorten",
                headers={"X-Telegram-ID": telegram_id},
                json={"target_url": long_url},
                timeout=5.0,
            )

            if response.status_code == 200:
                short_url_data = response.json()
                short_key = short_url_data.get("short_key")
                await message.answer(f"Твоє посилання: http://localhost:8000/{short_key}")
            else:
                await message.answer("Помилка при створенні посилання.")

        except Exception as e:
            await message.answer("Сервіс тимчасово недоступний")
            print(f"Помилка запиту: {e}")

    await state.clear()

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())