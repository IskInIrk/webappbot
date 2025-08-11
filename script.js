const tg = window.Telegram.WebApp;

tg.ready();  // Инициализация
tg.expand();  // Развернуть на весь экран

// Получить данные пользователя (user_id из Telegram)
document.getElementById('user-id').textContent = tg.initDataUnsafe.user.id;

// Кнопка для проверки подписки (отправка данных боту)
document.getElementById('get-sub').addEventListener('click', () => {
    tg.sendData(JSON.stringify({ action: 'get_sub' }));  // Отправить данные боту
});

// Кнопка оплаты (можно открыть инвойс или форму)
document.getElementById('pay').addEventListener('click', () => {
    tg.sendData(JSON.stringify({ action: 'pay', months: 1 }));  // Отправить запрос на оплату
});

// Обработка ответов от бота (если нужно)
tg.onEvent('web_app_data', (event) => {
    document.getElementById('result').textContent = event.data;
});