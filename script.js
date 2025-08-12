const tg = window.Telegram.WebApp;
if (!tg) {
    console.error('Telegram WebApp API is not available!');
    document.getElementById('content').innerHTML = '<p>Ошибка: Telegram WebApp не инициализирован.</p>';
} else {
    tg.ready();
    tg.expand();
}

// Установка темы
const theme = tg?.themeParams || {};
document.body.style.backgroundColor = theme.bg_color || '#ffffff';
document.body.style.color = theme.text_color || '#000000';
document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color || '#ffffff');
document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color || '#000000');
document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color || '#0088cc');
document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color || '#ffffff');
document.documentElement.style.setProperty('--tg-theme-header-bg-color', theme.section_bg_color || '#0055aa');
document.documentElement.style.setProperty('--tg-theme-section-header-text-color', theme.section_header_text_color || '#ffffff');
document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color || '#e0e0e0');
document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color || '#666666');

const content = document.getElementById('content');
const API_BASE_URL = 'http://91.149.232.76:8080'; // Основной URL

async function apiCall(endpoint, method = 'POST', body = {}) {
    if (!tg || !tg.initData) {
        console.error('Telegram initData is missing or WebApp not initialized!', tg);
        throw new Error('Telegram Web App not initialized or initData unavailable');
    }
    body.init_data = tg.initData;
    console.log(`Sending ${method} to ${API_BASE_URL}${endpoint}`, { body, initData: tg.initData });
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        console.log(`Response from ${endpoint}:`, await response.text());
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Error ${response.status}: ${errorText}`);
        }
        return await response.json();
    } catch (err) {
        console.error(`Fetch error for ${endpoint}:`, err);
        throw err;
    }
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