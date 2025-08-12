const isLocalTest = true; // Переключатель для локального теста
const tg = isLocalTest ? {
    initData: "query_id=AAHd123&user={\"id\":123456,\"first_name\":\"Test\",\"last_name\":\"User\",\"username\":\"testuser\"}&auth_date=1723521420&hash=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    ready: () => console.log('Emulated tg.ready'),
    expand: () => console.log('Emulated tg.expand')
} : (window.Telegram?.WebApp || {});
if (!isLocalTest && !tg.initData) {
    console.error('Telegram WebApp not initialized or initData missing!', window.Telegram);
    document.getElementById('content').innerHTML = '<p>Ошибка: Mini App не инициализирован. Откройте через Telegram.</p>';
} else {
    if (tg.ready) tg.ready();
    if (tg.expand) tg.expand();
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
if (!content) {
    console.error('Content element not found! Creating a fallback div.');
    const fallbackContent = document.createElement('div');
    fallbackContent.id = 'content';
    document.body.appendChild(fallbackContent);
    content = fallbackContent;
}

const API_BASE_URL = 'http://91.149.232.76:8080'; // Локальный URL

async function apiCall(endpoint, method = 'POST', body = {}) {
    if (!tg.initData) {
        console.warn('Using emulated initData for local test');
        body.init_data = isLocalTest ? tg.initData : tg.initData;
    } else {
        body.init_data = tg.initData;
    }
    console.log(`Attempting ${method} to ${API_BASE_URL}${endpoint}`, { method, body, initDataLength: (body.init_data || '').length });
    try {
        let url = `${API_BASE_URL}${endpoint}`;
        let options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (method.toUpperCase() === 'POST' && Object.keys(body).length > 0) {
            options.body = JSON.stringify(body);
        } else if (method.toUpperCase() === 'GET') {
            const params = new URLSearchParams(body).toString();
            url += params ? `?${params}` : '';
        }
        const response = await fetch(url, options);
        const text = await response.text();
        console.log(`Response from ${endpoint}: Status ${response.status}, Body:`, text);
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${text}`);
        }
        return JSON.parse(text);
    } catch (err) {
        console.error(`Fetch error for ${endpoint}:`, err);
        throw err;
    }
}

function showContent(html, append = false) {
    if (!content) {
        console.error('Content element is not available!');
        return;
    }
    const existingLink = document.getElementById('link-input');
    if (append && existingLink) {
        content.innerHTML += html;
        content.appendChild(existingLink);
    } else {
        content.innerHTML = html;
    }
}

function showFreeAccess() {
    console.log('showFreeAccess triggered');
    showContent('<p>Загрузка...</p>');
    apiCall('/free').then(data => {
        showContent('', false);
        if (data.success) {
            showContent(`<p>${data.message}</p><p>Ссылка: <a href="${data.link}">${data.link}</a></p>`);
        } else {
            showContent(`<p>${data.message}</p><p>Текущая ссылка: <a href="${data.link}">${data.link}</a></p>`);
        }
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function showProfile() {
    console.log('showProfile triggered');
    showContent('<p>Загрузка...</p>');
    apiCall('/profile').then(data => {
        showContent('', false);
        showContent(`<p>${data.profile}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function showStatusMenu() {
    console.log('showStatusMenu triggered');
    showContent('<p>Загрузка...</p>');
    apiCall('/sub_status').then(data => {
        showContent('', false);
        if (data.success) {
            showContent(`<p>${data.status}</p>`);
        } else {
            showContent(`<p>${data.message}</p>`);
        }
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function showSubscriptionMenu() {
    console.log('showSubscriptionMenu triggered');
    showContent('', false);
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
    console.log('pay triggered with months:', months);
    showContent('<p>Загрузка...</p>');
    apiCall('/pay', 'POST', {months}).then(data => {
        showContent('', false);
        if (data.success) {
            tg.openLink(data.invoice_url);
        } else {
            showContent(`<p>${data.message}</p>`);
        }
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function checkPayment() {
    console.log('checkPayment triggered');
    showContent('<p>Загрузка...</p>');
    apiCall('/check_payment').then(data => {
        showContent('', false);
        showContent(`<p>${data.message || data.status}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function applyPromo() {
    console.log('applyPromo triggered');
    const promoInput = document.getElementById('promo');
    if (!promoInput) {
        console.error('Promo input field not found!');
        showContent('<p>Ошибка: Поле промокода не найдено.</p>');
        return;
    }
    const code = promoInput.value.trim();
    if (!code) {
        showContent('<p>Пожалуйста, введите промокод.</p>');
        return;
    }
    console.log(`Applying promo code: ${code}`);
    showContent('<p>Загрузка...</p>');
    apiCall('/apply_promo', 'POST', {code}).then(data => {
        showContent('', false);
        showContent(`<p>${data.message}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function applyPromoAccess() {
    console.log('applyPromoAccess triggered');
    const promoInput = document.getElementById('promo');
    if (!promoInput) {
        console.error('Promo input field not found!');
        showContent('<p>Ошибка: Поле промокода не найдено.</p>');
        return;
    }
    if (!document.contains(promoInput)) {
        console.error('Promo input is not in DOM!');
        showContent('<p>Ошибка: Поле промокода отсутствует в документе.</p>');
        return;
    }
    const code = promoInput.value.trim();
    if (!code) {
        showContent('<p>Пожалуйста, введите промокод в поле.</p>');
        return;
    }
    console.log(`Applying promo code from promo: ${code}`);
    applyPromo(code); // Используем promo из SubscriptionMenu
}

function showReferral() {
    console.log('showReferral triggered');
    showContent('<p>Загрузка...</p>');
    apiCall('/referral').then(data => {
        showContent('', false);
        showContent(`<p>Ваша реферальная ссылка: ${data.referral_link}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}

function showAccessMenu() {
    console.log('showAccessMenu triggered');
    showContent('', false);
    showContent(`
        <button onclick="showFreeAccess()">Получить доступ</button>
        <br><br>
        <button onclick="showLinkInput()">Ввести ссылку подключения</button>
    `);
}

function showLinkInput() {
    console.log('showLinkInput triggered');
    showContent('', false);
    const linkInput = document.createElement('input');
    linkInput.id = 'link-input';
    linkInput.placeholder = 'Введите ссылку подключения';
    linkInput.style = 'width: 100%; max-width: 300px; padding: 10px; margin: 10px 0;';
    content.appendChild(linkInput);
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Отправить';
    submitButton.onclick = submitLink;
    content.appendChild(submitButton);
}

async function submitLink() {
    console.log('submitLink triggered');
    const link = document.getElementById('link-input').value;
    if (!link) {
        showContent('<p>Пожалуйста, введите ссылку.</p>');
        return;
    }
    try {
        showContent('<p>Загрузка...</p>');
        const response = await apiCall('/submit_link', 'POST', { link });
        showContent('', false);
        showContent(`<p>${response.message}</p>`);
    } catch (err) {
        showContent(`<p>Ошибка: ${err.message}</p>`);
    }
}

function showSupportMenu() {
    console.log('showSupportMenu triggered');
    showContent('', false);
    const androidButton = document.createElement('button');
    androidButton.textContent = 'Android';
    androidButton.onclick = () => showInstructions('android');
    content.appendChild(androidButton);
    const iosButton = document.createElement('button');
    iosButton.textContent = 'iOS';
    iosButton.onclick = () => showInstructions('ios');
    content.appendChild(iosButton);
    const windowsButton = document.createElement('button');
    windowsButton.textContent = 'Windows';
    windowsButton.onclick = () => showInstructions('windows');
    content.appendChild(windowsButton);
    const macosButton = document.createElement('button');
    macosButton.textContent = 'macOS';
    macosButton.onclick = () => showInstructions('macos');
    content.appendChild(macosButton);
    const supportText = document.createElement('p');
    supportText.textContent = 'Поддержка: @YourSupportTelegram';
    content.appendChild(supportText);
}

function showInstructions(device) {
    console.log('showInstructions triggered for device:', device);
    showContent('<p>Загрузка...</p>');
    apiCall(`/instructions`, 'GET', { device }).then(data => {
        showContent('', false);
        showContent(`<p>${data.instructions}</p>`);
    }).catch(err => showContent(`<p>Ошибка: ${err.message}</p>`));
}