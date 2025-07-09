// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // Разворачиваем приложение на весь экран

// Добавим логирование для отладки
console.log("Telegram Web App initialized and ready.");
console.log("tg.initDataUnsafe:", tg.initDataUnsafe);

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
    'office_commercial': document.getElementById('section-office-commercial'),
    'loading': document.getElementById('section-loading')
};

const addressPrompt = document.getElementById('address-prompt');
const addressInput = document.getElementById('address-input');
const tariffList = document.getElementById('tariff-list');

// Функция для переключения секций
function showSection(sectionName) {
    console.log(`Showing section: ${sectionName}`);
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
    if (tg.isExpanded) {
        // Добавляем логирование перед отправкой
        console.log("Attempting to send data to bot:", JSON.stringify(data));
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
        addressInput.value = '';
        showSection('address');
    } else if (type === 'Квартира') {
        addressPrompt.textContent = "Пожалуйста, укажите Ваш полный адрес для проверки технической возможности подключения.\nПример: г.Караганда, Бухар-Жырау 56, кв 99";
        addressInput.value = '';
        showSection('address');
    } else if (type === 'Офис/Коммерция') {
        // Для 'Офис/Коммерция' отправляем данные и сразу показываем секцию 'office_commercial'.
        // Бот не будет возвращать ответ через showAlert в этом случае,
        // так как это просто запрос на связь, а не проверка тех. возможности.
        sendDataToBot({
            action: 'office_commercial_request',
            connection_type: connectionType,
            query_id: tg.initDataUnsafe ? tg.initDataUnsafe.query_id : null // Добавляем query_id
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

    if (!tg.initDataUnsafe || !tg.initDataUnsafe.query_id) {
        console.error("query_id не доступен. Невозможно отправить запрос к боту.");
        alert("Ошибка: Невозможно отправить запрос. Пожалуйста, попробуйте еще раз позже.");
        return;
    }

    // Отправляем адрес боту для проверки тех. возможности, включая query_id
    sendDataToBot({
        action: 'check_address',
        query_id: tg.initDataUnsafe.query_id, // ОБЯЗАТЕЛЬНО отправляем query_id
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
        query_id: tg.initDataUnsafe ? tg.initDataUnsafe.query_id : null, // Добавляем query_id
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

// --- ОБРАБОТКА ОТВЕТОВ ОТ БОТА ЧЕРЕЗ show_alert/show_popup ---
// Этот обработчик будет слушать закрытие всплывающих окон,
// которые были вызваны ботом через answerWebAppQuery с type "show_alert" или "show_popup".
tg.onEvent('popupClosed', function(result) {
    console.log("Popup closed with result:", result);

    // Проверяем, находимся ли мы на экране загрузки
    if (sections['loading'].style.display === 'block') {
        // Мы ожидаем, что бот отправит callback_data в result, если это alert.
        // Для show_alert button_id всегда "ok", так что полагаемся на callback_data,
        // которую мы передали в answer_web_app_query.
        const callbackData = result ? result.button_id : null; // Для show_alert button_id === "ok"

        // Если вы в боте используете "callback_data": "tech_available" или "no_tech_available"
        // внутри JSON для answerWebAppQuery с type: "show_alert", то результат будет выглядеть иначе.
        // Лучше проверять текст, как раньше, или передавать более явный статус.

        // Поскольку мы в `bot.py` отправляем `{"type": "show_alert", "text": "...", "callback_data": "..."}`
        // Mini App не получает `callback_data` напрямую из `popupClosed` для `show_alert`.
        // `popupClosed` возвращает `button_id` только для `show_popup`.
        //
        // Проще всего: бот будет отправлять `show_alert`, и мы просто будем
        // реагировать на *сам факт* закрытия alert и переходить дальше.
        // Если `show_alert` показался, значит, бот ответил.

        // Чтобы быть уверенным в статусе, бот должен отправить дополнительную
        // информацию через set_closing_behavior или set_main_button, что сложнее.

        // **УПРОЩЕННОЕ РЕШЕНИЕ:** Мы предполагаем, что если alert был вызван и закрыт,
        // то он был либо о наличии тех.возможности, либо об ее отсутствии.
        // И Mini App должен сам знать, куда идти.
        // Это не идеально, так как не всегда понятно, какой именно alert был закрыт.

        // ***ВОТ КАК МЫ ДОЛЖНЫ СДЕЛАТЬ В БОТЕ И ЗДЕСЬ (script.js)***
        // В bot.py, вместо:
        // result=json.dumps({"type": "show_alert", "text": response_text, "callback_data": "tech_available"})
        // Сделать:
        // result=json.dumps({"type": "show_popup", "popup": {"title": "Результат", "message": response_text, "buttons": [{"text": "Продолжить", "id": "tech_available"}]}})
        // Тогда `popupClosed` получит `result.button_id`.

        // Если бот отправляет `show_alert` (без `show_popup`), то `popupClosed` даст `result = { button_id: 'ok' }`
        // без дополнительных данных. В этом случае, Mini App не знает, какой именно alert был.
        // Поэтому **нужно, чтобы бот отправлял `show_popup`**.

        // Исправим bot.py, чтобы он отправлял show_popup, а не show_alert.
        // А здесь мы будем реагировать на button_id из `result` от `popupClosed`.

        if (result && result.button_id === 'tech_available_ok') { // Из bot.py: "id": "tech_available_ok"
            console.log("Тех. возможность подтверждена ботом через popup. Переходим к тарифам/статусу владельца.");
            if (connectionType === 'Квартира') {
                showSection('owner_status');
            } else if (connectionType === 'Частный сектор') {
                loadTariffs(connectionType);
                showSection('tariffs');
            }
        } else if (result && result.button_id === 'no_tech_ok') { // Из bot.py: "id": "no_tech_ok"
            console.log("Тех. возможность отсутствует. Показываем сообщение пользователю.");
            showSection('no_tech');
        } else {
             // Если popup закрыт без явного результата, или это был другой popup
             console.log("Popup закрыт без специфического результата, или это не был popup проверки тех. возможности.");
             // Можно вернуть пользователя на предыдущий экран или показать общую ошибку
             // showSection('address'); // Например, вернуться к вводу адреса
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
