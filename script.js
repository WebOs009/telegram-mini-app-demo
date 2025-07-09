// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Разворачиваем приложение на весь экран

let connectionType = '';
let ownerStatus = '';
let address = '';
let selectedTariff = {};

const sections = {
    'type': document.getElementById('section-type'),
    'address': document.getElementById('section-address'),
    'owner_status': document.getElementById('section-owner-status'),
    'tariffs': document.getElementById('section-tariffs'),
    'final': document.getElementById('section-final'),
    'no_tech': document.getElementById('section-no-tech'),
    'office_commercial': document.getElementById('section-office-commercial')
};

const addressPrompt = document.getElementById('address-prompt');
const addressInput = document.getElementById('address-input');
const tariffList = document.getElementById('tariff-list');

// Функция для переключения секций
function showSection(sectionName) {
    for (let key in sections) {
        sections[key].style.display = 'none';
    }
    sections[sectionName].style.display = 'block';
}

// Отправка данных боту
function sendDataToBot(data) {
    if (tg.isExpanded) { // Убедимся, что WebApp API доступен
        tg.sendData(JSON.stringify(data));
    } else {
        console.error("Telegram Web App API not available.");
        // В случае отладки вне Telegram, можно логировать или выводить в консоль
        alert("Telegram Web App API не доступен. Данные: " + JSON.stringify(data));
    }
}

// Функции для навигации и логики Mini App
function selectConnectionType(type) {
    connectionType = type;
    if (type === 'Частный сектор') {
        addressPrompt.textContent = "Пожалуйста, укажите Ваш полный адрес для проверки технической возможности подключения.\nПример: г.Караганда, ул.Бабушкина, дом 205";
        addressInput.value = ''; // Очищаем поле
        showSection('address');
    } else if (type === 'Квартира') {
        addressPrompt.textContent = "Пожалуйста, укажите Ваш полный адрес для проверки технической возможности подключения.\nПример: г.Караганда, Бухар-Жырау 56, кв 99";
        addressInput.value = ''; // Очищаем поле
        showSection('address');
    } else if (type === 'Офис/Коммерция') {
        sendDataToBot({
            action: 'office_commercial_request',
            connection_type: connectionType
        });
        showSection('office_commercial');
    }
}

function submitAddress() {
    address = addressInput.value.trim();
    if (address === "") {
        alert("Пожалуйста, введите адрес.");
        return;
    }

    // Отправляем адрес боту для проверки тех. возможности
    // Бот должен будет ответить через метод answerWebAppQuery или через sendMessage
    // В данном упрощенном примере мы просто отправляем данные
    sendDataToBot({
        action: 'check_address',
        connection_type: connectionType,
        address: address
    });

    // В реальном приложении здесь была бы индикация загрузки и ожидание ответа от бота
    // Для этого примера, мы покажем следующую секцию, предполагая, что бот позже пришлет ответ
    // или Mini App получит данные через onEvent('messageSent')
    // Однако, более правильный подход - бот отвечает на запрос Mini App

    // Для демонстрации, покажем следующую секцию (как будто проверка прошла)
    if (connectionType === 'Квартира') {
        showSection('owner_status');
    } else if (connectionType === 'Частный сектор') {
        loadTariffs(connectionType);
        showSection('tariffs');
    }
}

function selectOwnerStatus(status) {
    ownerStatus = status;
    if (ownerStatus === 'квартирант') {
        // Можно показать дополнительное уведомление для квартирантов
        // Например: tg.showAlert("В случае вашего переезда вам нужно будет расторгнуть договор по адресу ...");
    }
    loadTariffs(connectionType);
    showSection('tariffs');
}

function loadTariffs(type) {
    tariffList.innerHTML = ''; // Очищаем список тарифов

    let tariffs = [];
    if (type === 'Частный сектор') {
        tariffs = [
            { name: "100 Мбит/сек", price: "6000 тг/мес", router: "роутер 0 тг", callback: "tariff_private_100" },
            { name: "300 Мбит/сек", price: "9500 тг/мес", router: "роутер 0 тг", callback: "tariff_private_300" },
            { name: "500 Мбит/сек", price: "13000 тг/мес", router: "роутер 0 тг", callback: "tariff_private_500" },
            { name: "700 Мбит/сек", price: "17000 тг/мес", router: "роутер 0 тг", callback: "tariff_private_700" }
        ];
    } else if (type === 'Квартира') {
        tariffs = [
            { name: "100 Мбит/сек", price: "3000 тг/мес", router: "роутер 500 тг/мес", callback: "tariff_apartment_100" },
            { name: "300 Мбит/сек", price: "5000 тг/мес", router: "роутер 0 тг", callback: "tariff_apartment_300" },
            { name: "500 Мбит/сек", price: "7000 тг/мес", router: "роутер 0 тг", callback: "tariff_apartment_500" },
            { name: "700 Мбит/сек", price: "8500 тг/мес", router: "роутер 0 тг", callback: "tariff_apartment_700" }
        ];
    }

    tariffs.forEach(tariff => {
        const button = document.createElement('button');
        button.textContent = `${tariff.name} - ${tariff.price} (${tariff.router})`;
        button.onclick = () => selectTariff(tariff.callback, tariff.name, tariff.price, tariff.router);
        tariffList.appendChild(button);
    });
}

function selectTariff(callbackData, tariffName, tariffPrice, routerInfo) {
    selectedTariff = {
        callback_data: callbackData,
        name: tariffName,
        price: tariffPrice,
        router: routerInfo
    };

    sendDataToBot({
        action: 'submit_application',
        connection_type: connectionType,
        address: address,
        owner_status: ownerStatus, // Будет "undefined" для частного сектора, что нормально
        chosen_tariff: selectedTariff.name,
        tariff_price: selectedTariff.price,
        router_info: selectedTariff.router
    });
    showSection('final');
}

function closeApp() {
    tg.close();
}

// Обработчик кнопки "Назад"
function goBack(fromSection) {
    if (fromSection === 'address') {
        showSection('type');
    } else if (fromSection === 'owner_status') {
        showSection('address');
    } else if (fromSection === 'tariffs') {
        if (connectionType === 'Частный сектор') {
            showSection('address');
        } else if (connectionType === 'Квартира') {
            showSection('owner_status');
        }
    }
}

// Изначальное отображение первой секции при загрузке Mini App
showSection('type');

// Обработка получения данных от бота (например, результат проверки тех. возможности)
// ВАЖНО: Это более продвинутая часть. Для начала мы будем просто отправлять данные боту,
// и бот будет отвечать обычным сообщением.
// Если вы хотите, чтобы бот отправлял данные обратно в Mini App,
// вам нужно будет использовать метод answerWebAppQuery со стороны бота
// и обработчик tg.onEvent('invoiceClosed', ...) или similar.
// Однако, для большинства случаев, Mini App просто отправляет данные, а бот отвечает в чате.

// Пример того, как Mini App может получить данные, если бот ответил через answerWebAppQuery
/*
tg.onEvent('mainButtonClicked', function() {
    // Эта функция вызывается, когда пользователь нажимает на главную кнопку Telegram,
    // которая может быть использована для отправки данных обратно боту.
    // Пока что мы используем sendData.
});
*/

// Устанавливаем тему Telegram Web App
function setWebAppTheme() {
    const themeParams = tg.themeParams;
    if (themeParams) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#f0f2f5');
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#333');
        document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#666');
        document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#007bff');
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#007bff');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || '#e9ecef');
    }
}

setWebAppTheme();
tg.onEvent('themeChanged', setWebAppTheme); // Обновлять тему при изменении в Telegram
