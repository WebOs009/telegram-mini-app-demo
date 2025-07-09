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
    'no_tech': document.getElementById('section-no-tech'), // Обновленная секция
    'office_commercial': document.getElementById('section-office-commercial'),
    'loading': document.getElementById('section-loading') // Новая секция
};

const addressPrompt = document.getElementById('address-prompt');
const addressInput = document.getElementById('address-input');
const tariffList = document.getElementById('tariff-list');

// Функция для переключения секций
function showSection(sectionName) {
    for (let key in sections) {
        sections[key].style.display = 'none';
    }
    if (sections[sectionName]) {
        sections[sectionName].style.display = 'block';
    } else {
        console.error(`Section '${sectionName}' not found.`);
    }
}

// Отправка данных боту
function sendDataToBot(data) {
    if (tg.isExpanded) { // Убедимся, что WebApp API доступен
        tg.sendData(JSON.stringify(data));
    } else {
        console.error("Telegram Web App API not available.");
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

    // Проверяем наличие query_id
    if (!tg.initDataUnsafe || !tg.initDataUnsafe.query_id) {
        console.error("query_id не доступен. Невозможно отправить запрос к боту.");
        alert("Ошибка: Невозможно отправить запрос. Пожалуйста, попробуйте еще раз позже.");
        return;
    }

    // Отправляем адрес боту для проверки тех. возможности, включая query_id
    sendDataToBot({
        action: 'check_address',
        query_id: tg.initDataUnsafe.query_id, // Добавляем query_id
        connection_type: connectionType,
        address: address
    });

    // Показываем экран загрузки и ждем ответа от бота
    showSection('loading');
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

// --- ОБРАБОТКА СООБЩЕНИЙ ОТ БОТА ---
// Этот обработчик будет слушать сообщения, которые бот отправляет пользователю в чат.
// Mini App сможет отреагировать на эти сообщения.
tg.onEvent('message', function(event) {
    const message = event.data; // Получаем текстовое сообщение от бота

    console.log("Mini App получил сообщение от бота:", message);

    if (sections['loading'].style.display === 'block') { // Только если мы сейчас находимся в состоянии ожидания проверки адреса
        if (message.includes("Отличная новость!")) {
            // Если бот подтвердил тех. возможность, переходим к следующему шагу в Mini App
            console.log("Тех. возможность подтверждена ботом. Переходим к тарифам/статусу владельца.");
            if (connectionType === 'Квартира') {
                showSection('owner_status');
            } else if (connectionType === 'Частный сектор') {
                loadTariffs(connectionType);
                showSection('tariffs');
            }
        } else if (message.includes("К сожалению, по вашему адресу нет технической возможности.")) {
            // Если бот сообщил об отсутствии тех. возможности
            console.log("Тех. возможность отсутствует. Показываем сообщение пользователю.");
            showSection('no_tech');
        }
    }
});


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
