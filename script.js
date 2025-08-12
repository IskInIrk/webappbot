const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Установка темы
const theme = tg.themeParams;
document.body.style.backgroundColor = theme.bg_color;
document.body.style.color = theme.text_color;
document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color);
document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color);
document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color);
document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color);
document.documentElement.style.setProperty('--tg-theme-header-bg-color', theme.section_bg_color);
document.documentElement.style.setProperty('--tg-theme-section-header-text-color', theme.section_header_text_color);
document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color);
document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color);

const content = document.getElementById('content');
const API_BASE_URL = 'http://91.149.232.76:8080'; // Основной URL
const FALLBACK_API_URL = 'https://your-ngrok-url.ngrok.io'; // Замените на реальный ngrok URL

async function apiCall(endpoint, method = 'POST', body = {}) {
    if (!tg.initData) {
        console.error('Telegram initData is missing!');
        throw new Error('Telegram Web App not initialized');
    }
    body.init_data = tg.initData;
    const urls = [API_BASE_URL, FALLBACK_API_URL]; // Попробуем оба URL
    let lastError;

    for (const url of urls) {
        try {
            console.log(`Sending ${method} to ${url}${endpoint}`, body);
            const response = await fetch(`${url}${endpoint}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            console.log(`Response status: ${response.status}`, await response.text()); // Лог ответа
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP Error ${response.status}: ${errorText}`);
            }
            return await response.json();
        } catch (err) {
            lastError = err;
            console.error(`Failed for ${url}:`, err);
        }
    }
    throw new Error(`All attempts failed: ${lastError.message}`);
}

function showContent(html) {
    content.innerHTML = html;
}

function showFreeAccess() {
    apiCall('/free').then(data => {
        if (data.success) {
            showContent(`<p>${data.message}</p><p>Ссылка: <a href="${data.link}">${data.link}</a></p>`);
        } else {
            showContent(`<p>${data.message}</p>`);
        }
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function showProfile() {
    apiCall('/profile').then(data => {
        showContent(`<p>${data.profile}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function showStatusMenu() {
    apiCall('/sub_status').then(data => {
        if (data.success) {
            showContent(`<p>${data.status}</p>`);
        } else {
            showContent(`<p>${data.message}</p>`);
        }
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function showSubscriptionMenu() {
    showContent(`
        <button onclick="pay(1)">1 месяц ($5)</button>
        <button onclick="pay(3)">3 месяца ($13)</button>
        <button onclick="pay(6)">6 месяцев ($21)</button>
        <button onclick="pay(12)">12 месяцев ($35)</button>
        <button onclick="checkPayment()">Проверить оплату</button>
        <input id="promo" placeholder="Промокод" />
        <button onclick="applyPromo()">Активировать промокод</button>
    `);
}

function pay(months) {
    apiCall('/pay', 'POST', {months}).then(data => {
        if (data.success) {
            tg.openLink(data.invoice_url);
        } else {
            showContent(`<p>${data.message}</p>`);
        }
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function checkPayment() {
    apiCall('/check_payment').then(data => {
        showContent(`<p>${data.message || data.status}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function applyPromo() {
    const code = document.getElementById('promo').value;
    apiCall('/apply_promo', 'POST', {code}).then(data => {
        showContent(`<p>${data.message}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function showReferral() {
    apiCall('/referral').then(data => {
        showContent(`<p>Ваша реферальная ссылка: ${data.referral_link}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function showAccessMenu() {
    showContent(`
        <button onclick="showFreeAccess()">Бесплатный доступ</button>
        <input id="promo-access" placeholder="Промокод" />
        <button onclick="applyPromoAccess()">Активировать промокод</button>
    `);
}

function applyPromoAccess() {
    const code = document.getElementById('promo-access').value;
    applyPromo(code);
}

function showSupportMenu() {
    showContent(`
        <button onclick="showInstructions('android')">Android</button>
        <button onclick="showInstructions('ios')">iOS</button>
        <button onclick="showInstructions('windows')">Windows</button>
        <button onclick="showInstructions('macos')">macOS</button>
        <p>Поддержка: @YourSupportTelegram</p>
    `);
}

function showInstructions(device) {
    apiCall('/instructions?device=' + device, 'GET').then(data => {
        showContent(`<p>${data.instructions}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}