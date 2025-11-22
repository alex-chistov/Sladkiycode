// Глобальная переменная для хранения последнего сохраненного статуса
let lastSavedStatus = null;

function normalizeStatus(status) {
  const normalized = (status || "").trim();
  return normalized === "" ? "" : normalized;
}

// Функции для работы с localStorage для надежного сохранения статуса
function saveStatusToStorage(complaintId, status) {
  if (complaintId && status) {
    const key = `complaint_status_${complaintId}`;
    localStorage.setItem(key, status);
    console.log("💾 Сохранен статус в localStorage:", key, "=", status);
  }
}

function getStatusFromStorage(complaintId) {
  if (complaintId) {
    const key = `complaint_status_${complaintId}`;
    const status = localStorage.getItem(key);
    if (status) {
      console.log("📖 Загружен статус из localStorage:", key, "=", status);
      return status;
    }
  }
  return null;
}

function clearStatusFromStorage(complaintId) {
  if (complaintId) {
    const key = `complaint_status_${complaintId}`;
    localStorage.removeItem(key);
    console.log("🗑️ Удален статус из localStorage:", key);
  }
}

// Функция для автоматической проверки и исправления статуса
async function verifyAndFixStatus(complaintId) {
  if (!complaintId) return null;

  try {
    // Загружаем статус из БД
    const response = await API.getComplaint(complaintId);
    if (!response || !response.data) return null;

    const statusFromDB = normalizeStatus(response.data.status);
    const statusFromStorage = getStatusFromStorage(complaintId);

    console.log("🔍 Проверка статуса:", {
      complaintId,
      statusFromDB,
      statusFromStorage,
      lastSavedStatus,
    });

    // Определяем правильный статус
    let correctStatus =
      statusFromDB || statusFromStorage || lastSavedStatus || "Новое";

    // Если статус из БД отличается от сохраненного, используем БД как источник истины
    if (statusFromDB && statusFromDB !== statusFromStorage) {
      correctStatus = statusFromDB;
      saveStatusToStorage(complaintId, correctStatus);
      console.log("✅ Исправлен статус: использован статус из БД");
    } else if (statusFromStorage && !statusFromDB) {
      // Если в БД нет статуса, но есть в localStorage, используем его
      correctStatus = statusFromStorage;
      console.log("✅ Использован статус из localStorage");
    }

    // Обновляем глобальную переменную
    lastSavedStatus = correctStatus;

    // Обновляем опции на основе правильного статуса
    updateActionOptions(correctStatus);

    console.log("✅ Статус проверен и исправлен:", correctStatus);
    return correctStatus;
  } catch (error) {
    console.error("❌ Ошибка при проверке статуса:", error);
    return null;
  }
}

// Получить ID заявки из URL
function getComplaintIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// Загрузить заявку из БД и заполнить форму
async function loadComplaintData() {
  const complaintId = getComplaintIdFromUrl();

  if (!complaintId) {
    console.log("ID заявки не указан в URL");
    return;
  }

  try {
    console.log("📥 Загрузка заявки ID:", complaintId);
    const response = await API.getComplaint(complaintId);

    if (!response || !response.data) {
      alert("❌ Заявка не найдена");
      return;
    }

    const complaint = response.data;
    console.log("✅ Заявка загружена:", complaint);
    console.log("📊 Статус заявки при загрузке:", complaint.status);

    // Определяем статус: сначала из localStorage, потом из БД, потом "Новое"
    const savedStatus = getStatusFromStorage(complaintId);
    const normalizedStatus = normalizeStatus(complaint.status);

    let finalStatus;
    if (savedStatus) {
      // Используем сохраненный статус из localStorage
      finalStatus = savedStatus;
      console.log("💾 Используем статус из localStorage:", finalStatus);
    } else if (normalizedStatus) {
      // Используем статус из БД
      finalStatus = normalizedStatus;
      console.log("💾 Используем статус из БД:", finalStatus);
      // Сохраняем в localStorage
      saveStatusToStorage(complaintId, finalStatus);
    } else {
      // Если статуса нет, считаем заявку новой
      finalStatus = "Новое";
      console.log("💾 Статус не указан, устанавливаем 'Новое'");
      saveStatusToStorage(complaintId, finalStatus);
    }

    // Сохраняем статус в глобальную переменную
    lastSavedStatus = finalStatus;
    console.log("💾 Текущий статус (финальный):", finalStatus);

    // Заполняем поля формы
    fillFormFields(complaint);

    // Обновляем ID в заголовке
    const idSpan = document.querySelector(".id-field span");
    if (idSpan) {
      idSpan.textContent = complaint.id;
    }

    // Обновляем заголовок страницы
    document.title = `Обращение № ${complaint.id} - Smartopolis`;

    // Загружаем историю изменений
    loadHistory(complaintId);

    // ВАЖНО: Автоматически проверяем и исправляем статус после загрузки страницы
    setTimeout(async () => {
      const verifiedStatus = await verifyAndFixStatus(complaintId);
      if (verifiedStatus) {
        console.log(
          "✅ Статус автоматически проверен при загрузке страницы:",
          verifiedStatus
        );
      }
    }, 300);
  } catch (error) {
    console.error("❌ Ошибка загрузки заявки:", error);
    alert(
      "Не удалось загрузить заявку.\n\nУбедитесь, что сервер запущен (npm start)"
    );
  }
}

// Заполнить поля формы данными заявки
function fillFormFields(complaint) {
  const fieldInputs = document.querySelectorAll(".field-input");

  if (fieldInputs.length > 0) {
    // # (ID)
    fieldInputs[0].value = complaint.id || "";

    // Заголовок
    fieldInputs[1].value = complaint.title || "";

    // Описание
    fieldInputs[2].value = complaint.description || "";

    // Тип проблемы
    fieldInputs[3].value = complaint.problem_type || "";

    // ЕСИА
    fieldInputs[4].value = complaint.esia || "нет";

    // Автор
    fieldInputs[5].value = complaint.author || "";

    // Email автора
    fieldInputs[6].value = complaint.author_email || "";

    // Телефон автора
    fieldInputs[7].value = complaint.author_phone || "";

    // Адрес автора
    fieldInputs[8].value = complaint.author_address || "";

    // Видно всем
    fieldInputs[9].value = complaint.visible_to_all || "нет";

    // Публиковать результат
    fieldInputs[10].value = complaint.publish_result || "нет";

    // Назначен
    fieldInputs[11].value = complaint.assigned_to || "";

    // Изображения
    fieldInputs[12].value = complaint.images || "";

    // Ссылки на вложения
    fieldInputs[13].value = complaint.attachments || "";

    // Видео
    fieldInputs[14].value = complaint.video || "";

    // Изображения (Стало)
    fieldInputs[15].value = complaint.result_images || "";

    // Дата создания
    if (complaint.created_at || complaint.created_date) {
      const date = new Date(complaint.created_at || complaint.created_date);
      fieldInputs[16].value = date.toLocaleString("ru-RU").replace(",", "");
    }

    // Срок исполнения
    if (complaint.deadline) {
      const deadline = new Date(complaint.deadline);
      fieldInputs[17].value = deadline.toLocaleString("ru-RU").replace(",", "");
    }

    // Истекает через дней
    if (complaint.days_remaining) {
      fieldInputs[18].value = complaint.days_remaining;
    }

    // Нормативный срок
    fieldInputs[19].value = complaint.standard_period || "";

    // Внешняя система
    fieldInputs[20].value = complaint.external_system || "Лобачевский";

    // Орган власти
    fieldInputs[21].value = complaint.authority || "";

    // Внешний ID
    fieldInputs[22].value = complaint.external_id || "";

    // Внешняя категория
    fieldInputs[23].value = complaint.external_category || "";

    // Ссылка на обращение
    fieldInputs[24].value = complaint.link || "";

    // Обновляем статус в кнопке
    const statusBtn = document.querySelector(".btn-dark");
    if (statusBtn && complaint.status) {
      statusBtn.textContent = complaint.status;
    }

    // Обновляем поля на вкладке "Обработка"
    updateProcessingTab(complaint);

    // Статус для опций действий: берем из localStorage, потом из БД, потом lastSavedStatus
    const complaintId = getComplaintIdFromUrl();
    const savedStatus = complaintId ? getStatusFromStorage(complaintId) : null;
    const statusFromDb = normalizeStatus(complaint.status);
    const statusForOptions =
      savedStatus ||
      statusFromDb ||
      normalizeStatus(lastSavedStatus) ||
      "Новое";

    // Обновляем lastSavedStatus и localStorage
    if (statusForOptions !== lastSavedStatus) {
      lastSavedStatus = statusForOptions;
      if (complaintId && statusForOptions) {
        saveStatusToStorage(complaintId, statusForOptions);
      }
      console.log(
        "💾 Обновлен lastSavedStatus в fillFormFields:",
        lastSavedStatus
      );
    }

    // Обновляем опции действий с правильным статусом
    // ВАЖНО: Обновляем опции только если мы на вкладке "Обработка" или если это начальная загрузка
    const processingTab = document.getElementById("tab-processing");
    if (!processingTab || processingTab.classList.contains("active")) {
      console.log(
        "🔄 Обновление опций при загрузке формы. Статус:",
        statusForOptions
      );
      updateActionOptions(statusForOptions);
    } else {
      console.log(
        "💾 Сохранен статус для будущих обновлений (не на вкладке Обработка):",
        statusForOptions
      );
    }
  }
}

// Обновить поля на вкладке "Обработка"
function updateProcessingTab(complaint) {
  // Телефон автора в разделе "Обработка"
  const phoneInProcessing = document.querySelector(
    '.editable-input[value^="+7"]'
  );
  if (phoneInProcessing) {
    phoneInProcessing.value = complaint.author_phone || "";
  }

  // Срок исполнения в разделе "Обработка"
  const deadlineInput = document.getElementById("deadlineInput");
  if (deadlineInput) {
    if (complaint.deadline) {
      const deadline = new Date(complaint.deadline);
      // Форматируем для datetime-local (YYYY-MM-DDTHH:mm)
      const year = deadline.getFullYear();
      const month = String(deadline.getMonth() + 1).padStart(2, "0");
      const day = String(deadline.getDate()).padStart(2, "0");
      const hours = String(deadline.getHours()).padStart(2, "0");
      const minutes = String(deadline.getMinutes()).padStart(2, "0");
      deadlineInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
      // Устанавливаем дефолтное значение (через 7 дней)
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, "0");
      const day = String(defaultDate.getDate()).padStart(2, "0");
      deadlineInput.value = `${year}-${month}-${day}T09:00`;
    }
  }

  // Обновляем опции действий в зависимости от статуса
  const statusForOptions =
    normalizeStatus(complaint.status) ||
    normalizeStatus(lastSavedStatus) ||
    "Новое";
  lastSavedStatus = statusForOptions;
  updateActionOptions(statusForOptions);
}

// Переключить на вкладку
function switchToTab(tabName) {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  // Убираем активный класс со всех вкладок
  tabs.forEach((t) => t.classList.remove("active"));
  tabContents.forEach((tc) => tc.classList.remove("active"));

  // Находим нужную вкладку
  const targetTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  const targetContent = document.getElementById(`tab-${tabName}`);

  if (targetTab && targetContent) {
    targetTab.classList.add("active");
    targetContent.classList.add("active");
  }
}

// Обновить опции действий в зависимости от статуса
function updateActionOptions(currentStatus) {
  const actionSelect = document.getElementById("actionSelect");
  if (!actionSelect) return;

  // Нормализуем статус (убираем пробелы, приводим к единому виду)
  const normalizedStatus = (currentStatus || "").trim();

  console.log(
    "🔄 updateActionOptions вызвана. Исходный статус:",
    currentStatus,
    "Нормализованный:",
    normalizedStatus
  );

  // Очищаем текущие опции
  actionSelect.innerHTML = '<option value="">Выберите действие</option>';

  let options = [];

  // Определяем доступные действия на основе текущего статуса
  // ВАЖНО: Порядок проверок имеет значение!

  if (
    !normalizedStatus ||
    normalizedStatus === "Новое" ||
    normalizedStatus === ""
  ) {
    // Шаг 1: Новая заявка - модератор может отправить на модерацию или отклонить
    options = [
      { value: "На модерации", text: "На модерации" },
      { value: "Отклонено", text: "Отклонено" },
    ];
    console.log("✅ Шаг 1: Новая заявка - опции: На модерации или Отклонено");
  } else if (normalizedStatus === "На модерации") {
    // Шаг 2: После отправки на модерацию - модератор может назначить или отклонить
    options = [
      { value: "Назначить ответственного", text: "Назначить ответственного" },
      { value: "Отклонено", text: "Отклонено" },
    ];
    console.log("✅ Шаг 2: На модерации - опции для модератора");
  } else if (
    normalizedStatus === "Назначено ответственному" ||
    normalizedStatus === "Назначен ответственному" ||
    normalizedStatus === "Назначить ответственного"
  ) {
    // Шаг 3: Назначено ответственному - исполнитель может взять в работу
    options = [
      {
        value: "Взять работу ответственным",
        text: "Взять работу ответственным",
      },
    ];
    console.log("✅ Шаг 3: Назначено ответственному - опции для исполнителя");
  } else if (
    normalizedStatus === "Взято в работу ответственным" ||
    normalizedStatus === "В работе"
  ) {
    // Шаг 4: Исполнитель взял в работу - может отправить на модерацию или предварительно решено
    options = [
      { value: "На модерации", text: "На модерации" },
      { value: "Предварительно решено", text: "Предварительно решено" },
    ];
    console.log("✅ Шаг 4: Взято в работу - опции для исполнителя");
  } else if (normalizedStatus === "Предварительно решено") {
    // Шаг 5: Предварительно решено - модератор может вернуть или закрыть
    options = [
      { value: "Назначить ответственного", text: "Назначить ответственного" },
      { value: "Закрыть", text: "Закрыть" },
    ];
    console.log("✅ Шаг 5: Предварительно решено - опции для модератора");
  } else if (normalizedStatus === "На рассмотрении") {
    // На случай, если этот статус уже есть в БД — ведём как финальную модерацию
    options = [
      { value: "Назначить ответственного", text: "Назначить ответственного" },
      { value: "Закрыть", text: "Закрыть" },
    ];
    console.log("✅ Статус 'На рассмотрении' - опции для модератора");
  } else {
    // Для других статусов - базовые опции
    options = [
      { value: "Назначить ответственного", text: "Назначить ответственного" },
      { value: "Отклонено", text: "Отклонено" },
      { value: "Закрыть", text: "Закрыть" },
    ];
    console.log("⚠️ Неизвестный статус:", normalizedStatus, "- базовые опции");
  }

  // Добавляем опции в select
  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    actionSelect.appendChild(optionElement);
  });

  // Логируем результат
  console.log(
    "Опции обновлены. Статус:",
    currentStatus,
    "Количество опций:",
    options.length,
    "Опции:",
    options.map((o) => o.text)
  );
}

/**
 * Маппинг действия → новый статус с учётом текущего этапа.
 * Важно:
 * - Новое → На модерации
 * - На модерации → Назначено ответственному
 * - Назначено ответственному → Взято в работу ответственным
 * - Взято в работу ответственным / В работе → при "На модерации" или "Предварительно решено"
 *   переходим в "Предварительно решено", чтобы модератор сразу получил набор: Назначить / Закрыть
 */
function mapActionToStatus(selectedAction, currentStatus) {
  const current = normalizeStatus(currentStatus);

  console.log("🧭 mapActionToStatus", {
    currentStatus: current,
    selectedAction,
  });

  switch (selectedAction) {
    case "На модерации":
      // 1) Новая заявка → первый шаг модератора
      if (!current || current === "Новое" || current === "") {
        return "На модерации";
      }

      // 2) Исполнитель завершил работу и отправляет на модерацию
      //    Тут сразу переходим к шагу модератора с возможностью "Закрыть"
      if (
        current === "Взято в работу ответственным" ||
        current === "В работе"
      ) {
        return "Предварительно решено";
      }

      // Во всех остальных случаях оставляем как есть
      return "На модерации";

    case "Предварительно решено":
      // Исполнитель явно указывает, что проблема решена
      // и отправляет на финальную проверку модератору
      return "Предварительно решено";

    case "Назначить ответственного":
      return "Назначено ответственному";

    case "Взять работу ответственным":
      return "Взято в работу ответственным";

    case "Отклонено":
      return "Отклонено";

    case "Закрыть":
      return "Закрыто";

    default:
      return selectedAction;
  }
}

// Загрузить историю изменений
async function loadHistory(complaintId) {
  try {
    const response = await API.getHistory(complaintId);
    if (response && response.data && response.data.length > 0) {
      renderHistory(response.data);
    }
  } catch (error) {
    console.error("Ошибка загрузки истории:", error);
  }
}

// Отрисовать историю изменений
function renderHistory(historyData) {
  const historyContainer = document.querySelector(".history-table");
  if (!historyContainer) return;

  // Сохраняем заголовок
  const header = historyContainer.querySelector(".history-header");

  // Очищаем таблицу, кроме заголовка
  historyContainer.innerHTML = "";
  if (header) {
    historyContainer.appendChild(header);
  }

  // Добавляем записи истории
  historyData.forEach((record) => {
    const row = document.createElement("div");
    row.className = "history-row";

    const date = new Date(record.created_at || record.change_date);
    const formattedDate = date.toLocaleString("ru-RU").replace(",", "");

    row.innerHTML = `
      <div class="history-col-date">${formattedDate}</div>
      <div class="history-col-author">${record.author}</div>
      <div class="history-col-changes">
        <div class="change-item">
          <span class="change-label">${record.field_name}</span>
          <div class="change-value">
            ${record.old_value ? `<span>${record.old_value}</span>` : ""}
            ${
              record.old_value && record.new_value
                ? '<span class="arrow">⇒</span>'
                : ""
            }
            ${record.new_value ? `<span>${record.new_value}</span>` : ""}
          </div>
        </div>
      </div>
    `;

    historyContainer.appendChild(row);
  });
}

// Интерактивность для полей формы
document.addEventListener("DOMContentLoaded", function () {
  // Загружаем данные заявки, если есть ID в URL
  loadComplaintData();

  // Если нет ID, устанавливаем опции для новой заявки
  const complaintId = getComplaintIdFromUrl();
  if (!complaintId) {
    lastSavedStatus = "Новое";
    updateActionOptions("Новое");
  }

  const fieldValues = document.querySelectorAll(".field-value");

  // Добавляем эффект выделения при клике на значение поля
  fieldValues.forEach((value) => {
    value.addEventListener("click", function () {
      // Убираем выделение со всех полей
      fieldValues.forEach((v) => v.classList.remove("selected"));
      // Добавляем выделение к текущему полю
      this.classList.add("selected");
    });
  });

  // Убираем выделение при клике вне полей
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".field-value")) {
      fieldValues.forEach((v) => v.classList.remove("selected"));
    }
  });

  // Кнопка "Показать" в заголовке
  const btnShow = document.querySelector(".btn-show");
  if (btnShow) {
    btnShow.addEventListener("click", function () {
      alert("Показать дополнительную информацию");
      // Здесь можно добавить логику показа дополнительных полей
    });
  }

  // Переключение вкладок
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const tabName = this.getAttribute("data-tab");

      // Убираем активный класс со всех вкладок
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((tc) => tc.classList.remove("active"));

      // Добавляем активный класс к выбранной вкладке
      this.classList.add("active");
      const activeContent = document.getElementById("tab-" + tabName);
      if (activeContent) {
        activeContent.classList.add("active");
      }

      // Если переключились на вкладку "Обработка", обновляем опции действий
      if (tabName === "processing") {
        const complaintId = getComplaintIdFromUrl();
        if (complaintId) {
          // ВАЖНО: Автоматически проверяем и исправляем статус при переключении на вкладку
          // ВАЖНО: Автоматически проверяем и исправляем статус при переключении на вкладку
          verifyAndFixStatus(complaintId)
            .then((correctStatus) => {
              if (correctStatus) {
                console.log(
                  "✅ Статус проверен при переключении на Обработку:",
                  correctStatus
                );
              } else {
                // Если проверка не удалась, используем сохраненный статус
                const savedStatus = getStatusFromStorage(complaintId);
                const statusForOptions =
                  savedStatus || lastSavedStatus || "Новое";
                lastSavedStatus = statusForOptions;
                updateActionOptions(statusForOptions);
                console.log(
                  "🔄 Использован сохраненный статус:",
                  statusForOptions
                );
              }
            })
            .catch((error) => {
              console.error("Ошибка при проверке статуса:", error);
              // Если ошибка, используем последний сохраненный статус
              const savedStatus = getStatusFromStorage(complaintId);
              const statusForOptions =
                savedStatus || lastSavedStatus || "Новое";
              lastSavedStatus = statusForOptions;
              updateActionOptions(statusForOptions);
            });
        } else {
          // Если нет ID, показываем опции для новой заявки
          updateActionOptions("Новое");
        }
      }
    });
  });

  // Переключатели (Toggle)
  const toggles = document.querySelectorAll(".toggle input[type='checkbox']");

  toggles.forEach((toggle) => {
    toggle.addEventListener("change", function () {
      const textSpan = this.parentElement.querySelector(".toggle-text");
      if (this.checked) {
        textSpan.textContent = "ON";
      } else {
        textSpan.textContent = "OFF";
      }
    });
  });

  // Кнопки на странице "Подробно"
  const btnReturnToFilters = document.querySelector(
    ".action-buttons .btn-secondary:nth-child(1)"
  );
  const btnList = document.querySelector(
    ".action-buttons .btn-secondary:nth-child(2)"
  );
  const btnEdit = document.querySelector(".action-buttons .btn-primary");

  if (btnReturnToFilters) {
    btnReturnToFilters.addEventListener("click", function () {
      alert("Возврат к фильтрам");
      // Здесь можно добавить переход на страницу фильтров
    });
  }

  if (btnList) {
    btnList.addEventListener("click", function () {
      window.location.href = "/list.html";
    });
  }

  if (btnEdit) {
    btnEdit.addEventListener("click", async function () {
      const inputs = document.querySelectorAll(".field-input:not([readonly])");
      let isEditing = this.textContent.includes("Редактировать");

      if (isEditing) {
        inputs.forEach((input) => input.removeAttribute("readonly"));
        this.innerHTML = '<span class="btn-icon">💾</span>Сохранить';
        this.style.background = "#5cb85c";
      } else {
        // Сохранение данных в БД
        try {
          const complaintId = getComplaintIdFromUrl();
          const complaintData = {
            title: document.querySelectorAll(".field-input")[1]?.value || "",
            description:
              document.querySelectorAll(".field-input")[2]?.value || "",
            problem_type:
              document.querySelectorAll(".field-input")[3]?.value || "",
            esia: document.querySelectorAll(".field-input")[4]?.value || "",
            author: document.querySelectorAll(".field-input")[5]?.value || "",
            author_email:
              document.querySelectorAll(".field-input")[6]?.value || "",
            author_phone:
              document.querySelectorAll(".field-input")[7]?.value || "",
            author_address:
              document.querySelectorAll(".field-input")[8]?.value || "",
            visible_to_all:
              document.querySelectorAll(".field-input")[9]?.value || "",
            publish_result:
              document.querySelectorAll(".field-input")[10]?.value || "",
            assigned_to:
              document.querySelectorAll(".field-input")[11]?.value || "",
            deadline:
              document.querySelectorAll(".field-input")[17]?.value || "",
            external_system:
              document.querySelectorAll(".field-input")[20]?.value || "",
          };

          if (complaintId) {
            // Обновляем существующую заявку
            await API.updateComplaint(complaintId, complaintData);
            alert("✅ Данные обновлены в базе данных!");

          // Добавляем запись в историю
          await API.addHistory({
              complaint_id: complaintId,
            change_date: new Date().toISOString(),
            author: "[276] Аналитический центр города",
              field_name: "Данные заявки",
              old_value: "",
              new_value: "Обновлено",
            });

            // Перезагружаем данные заявки для обновления формы
            const updatedResponse = await API.getComplaint(complaintId);
            if (updatedResponse && updatedResponse.data) {
              const updatedComplaint = updatedResponse.data;

              // Обновляем опции действий с новым статусом
              const statusFromDb = normalizeStatus(updatedComplaint.status);
              const statusForOptions =
                statusFromDb || normalizeStatus(lastSavedStatus) || "Новое";
              lastSavedStatus = statusForOptions;
              updateActionOptions(statusForOptions);

              // Обновляем статус в кнопке на вкладке "Подробно"
              const statusBtn = document.querySelector(".btn-dark");
              if (statusBtn && updatedComplaint.status) {
                statusBtn.textContent = updatedComplaint.status;
              }

              // Обновляем поле назначенного на вкладке "Подробно"
              const assignedToInput =
                document.querySelectorAll(".field-input")[11];
              if (assignedToInput && updatedComplaint.assigned_to) {
                assignedToInput.value = updatedComplaint.assigned_to;
              }

              // Обновляем select назначенного на вкладке "Обработка"
              const assignedSelect =
                document.querySelectorAll(".custom-select")[1];
              if (assignedSelect && updatedComplaint.assigned_to) {
                assignedSelect.value = updatedComplaint.assigned_to;
              }

              // Сбрасываем выбранное действие
              const actionSelect = document.getElementById("actionSelect");
              if (actionSelect) {
                actionSelect.value = "";
              }

              // Обновляем все поля формы
              fillFormFields(updatedComplaint);
            }
          } else {
            // Создаем новую заявку
            const result = await API.createComplaint(complaintData);
            alert(
              "✅ Данные сохранены в базу данных!\nID заявки: " + result.id
            );
            // Перезагружаем страницу с новым ID
            window.location.href = `index.html?id=${result.id}`;
          }
        } catch (error) {
          alert(
            "⚠️ Ошибка сохранения: " +
              error.message +
              "\n\nУбедитесь, что сервер запущен (npm start)"
          );
        }

        inputs.forEach((input) => input.setAttribute("readonly", "readonly"));
        this.innerHTML = '<span class="btn-icon">✏️</span>Редактировать';
        this.style.background = "#5bc0de";
      }
    });
  }

  // Кнопка "Закрыть" на странице "Подробно"
  const btnClose = document.querySelector(".btn-dark");
  if (btnClose) {
    btnClose.addEventListener("click", function () {
      if (confirm("Вы уверены, что хотите закрыть сообщение?")) {
        alert("Сообщение закрыто");
        // Здесь можно добавить логику закрытия сообщения
      }
    });
  }

  // Кнопки на странице "Обработка"
  const btnEvaluate = document.querySelector(".btn-info");
  if (btnEvaluate) {
    btnEvaluate.addEventListener("click", function () {
      const ratingSelect = document.querySelector(".rating-select");
      if (ratingSelect && ratingSelect.value !== "-") {
        alert("Оценка " + ratingSelect.value + " сохранена!");
      } else {
        alert("Пожалуйста, выберите оценку");
      }
    });
  }

  const btnSendSMS = document.querySelector(".btn-success");
  if (btnSendSMS) {
    btnSendSMS.addEventListener("click", function () {
      const phoneInput = document.querySelector('.editable-input[value^="+7"]');
      const smsText = document.querySelector(
        'textarea[placeholder*="Ответ в смс"]'
      );

      if (smsText && smsText.value.trim()) {
        alert(
          "SMS отправлено на номер: " + (phoneInput ? phoneInput.value : "")
        );
        // Обновить дату отправки
        const dateInput = document.querySelector(
          '.editable-input[value="не отправлено"]'
        );
        if (dateInput) {
          const now = new Date();
          dateInput.value = now.toLocaleString("ru-RU");
        }
      } else {
        alert("Введите текст сообщения");
      }
    });
  }

  const btnReset = document.querySelector(".btn-warning");
  if (btnReset) {
    btnReset.addEventListener("click", function () {
      if (confirm("Сбросить все изменения?")) {
        location.reload();
      }
    });
  }

  const btnSubmit = document.querySelector(".btn-primary-submit");
  if (btnSubmit) {
    btnSubmit.addEventListener("click", async function () {
      const requiredFields = document.querySelectorAll(".required");
      let allFilled = true;

      requiredFields.forEach((field) => {
        const formField = field.closest(".form-field");
        const select = formField.querySelector("select");
        const input = formField.querySelector("input");

        if ((select && !select.value) || (input && !input.value)) {
          allFilled = false;
          formField.style.borderLeft = "3px solid red";
          setTimeout(() => {
            formField.style.borderLeft = "";
          }, 2000);
        }
      });

      if (allFilled) {
        try {
          const complaintId = getComplaintIdFromUrl();

          if (!complaintId) {
            alert("ID заявки не указан в URL");
            return;
          }

          // Получаем текущий статус для истории и для маппинга
          const currentComplaint = await API.getComplaint(complaintId);
          const oldStatus = currentComplaint?.data?.status || "";
          const currentStatus = oldStatus;

          // Собираем данные из формы обработки
          const actionSelect = document.getElementById("actionSelect");
          const selectedAction = actionSelect?.value || "";

          // Определяем новый статус по действию и текущему статусу
          const newStatus = mapActionToStatus(selectedAction, currentStatus);

          // ВАЖНО: Проверяем, что статус определен
          if (!newStatus || newStatus === "") {
            console.error(
              "❌ ОШИБКА: Статус не определен! selectedAction:",
              selectedAction,
              "currentStatus:",
              currentStatus
            );
            alert(
              "❌ Ошибка: Не удалось определить новый статус. Проверьте консоль."
            );
            return;
          }

          // Сохраняем статус в глобальную переменную
          lastSavedStatus = newStatus;

          console.log("✅ Маппинг действия на статус:", {
            selectedAction: selectedAction,
            currentStatus: currentStatus,
            newStatus: newStatus,
            lastSavedStatus: lastSavedStatus,
          });

          const deadlineInput = document.getElementById("deadlineInput");
          let deadlineValue = "";
          if (deadlineInput && deadlineInput.value) {
            // Преобразуем datetime-local в формат для БД
            const date = new Date(deadlineInput.value);
            deadlineValue = date.toISOString().slice(0, 19).replace("T", " ");
          }

          const processingData = {
            complaint_id: complaintId,
            action: newStatus,
            publish_result: document.querySelectorAll(".toggle input")[0]
              ?.checked
              ? 1
              : 0,
            visible_to_all: document.querySelectorAll(".toggle input")[1]
              ?.checked
              ? 1
              : 0,
            rating: document.querySelector(".rating-select")?.value || null,
            assigned_to:
              document.querySelectorAll(".custom-select")[1]?.value || "",
            official_response:
              document.querySelector('textarea[placeholder*="Решил"]')?.value ||
              "",
            return_reason:
              document.querySelector('textarea[placeholder*="возврата"]')
                ?.value || "",
            sms_text:
              document.querySelector('textarea[placeholder*="смс"]')?.value ||
              "",
            author_phone:
              document.querySelector('.editable-input[value^="+7"]')?.value ||
              "",
            deadline: deadlineValue,
          };

          // Обновляем заявку с новым статусом
          // ВАЖНО: Убеждаемся, что статус всегда передается
          const updateData = {
            status: newStatus || "Новое",
            deadline: deadlineValue || null,
          };

          // ВАЖНО: Логируем перед отправкой
          console.log(
            "🔍 updateData перед отправкой:",
            JSON.stringify(updateData, null, 2)
          );
          console.log("🔍 newStatus:", newStatus);
          console.log("🔍 typeof newStatus:", typeof newStatus);

          if (processingData.assigned_to) {
            updateData.assigned_to = processingData.assigned_to;
          }

          // Если выбрано "Предварительно решено", обязательно нужен официальный ответ
          if (selectedAction === "Предварительно решено") {
            if (
              !processingData.official_response ||
              processingData.official_response.trim() === ""
            ) {
              alert(
                "⚠️ Для статуса 'Предварительно решено' необходимо заполнить поле 'Официальный ответ'"
              );
              return;
            }
          }

          // Всегда сохраняем официальный ответ, если он заполнен
          if (processingData.official_response) {
            updateData.official_response = processingData.official_response;
          }

          console.log("📤 Сохранение в БД. ID:", complaintId);
          console.log("📤 Данные для сохранения:", updateData);
          console.log("📤 Новый статус:", newStatus);
          console.log("📤 Старый статус:", oldStatus);
          console.log("📤 Текущий статус:", currentStatus);

          // ВАЖНО: Убеждаемся, что статус точно передается в updateData
          if (!updateData.status || updateData.status !== newStatus) {
            console.log("⚠️ Статус не совпадает! Исправляем...");
            updateData.status = newStatus;
          }

          const updateResult = await API.updateComplaint(
            complaintId,
            updateData
          );
          console.log("✅ Результат обновления заявки:", updateResult);
          console.log("✅ Обновленные данные:", updateData);

          // ВАЖНО: Проверяем, что статус действительно сохранился
          console.log(
            "🔍 Проверка сохраненного статуса в updateData:",
            updateData.status
          );

          alert("✅ Форма успешно отправлена и сохранена в БД!");

          // Добавляем в историю
          await API.addHistory({
            complaint_id: complaintId,
            change_date: new Date().toISOString(),
            author: "[276] Аналитический центр города",
            field_name: "Статус",
            old_value: oldStatus,
            new_value: newStatus,
          });

          // Задержка для гарантии сохранения в БД
          await new Promise((resolve) => setTimeout(resolve, 800));

          // Перезагружаем данные заявки для обновления формы
          console.log("🔄 Перезагрузка данных из БД после сохранения...");
          const updatedResponse = await API.getComplaint(complaintId);
          if (updatedResponse && updatedResponse.data) {
            const updatedComplaint = updatedResponse.data;

            console.log(
              "📊 Данные из БД после сохранения. Старый статус:",
              oldStatus,
              "Новый статус (отправленный):",
              newStatus,
              "Статус из БД:",
              updatedComplaint.status,
              "Тип статуса из БД:",
              typeof updatedComplaint.status
            );

            const statusFromDB = normalizeStatus(updatedComplaint.status);

            // ВАЖНО: Если статус из БД не совпадает с отправленным, принудительно обновляем
            let finalStatus = newStatus; // По умолчанию используем отправленный статус

            if (
              statusFromDB &&
              statusFromDB !== "" &&
              statusFromDB === newStatus
            ) {
              // Статус совпадает - отлично
              finalStatus = statusFromDB;
              console.log(
                "✅ Статус из БД совпадает с отправленным:",
                finalStatus
              );
            } else if (
              statusFromDB &&
              statusFromDB !== "" &&
              statusFromDB !== newStatus
            ) {
              // Статус из БД отличается - используем отправленный и обновляем БД
              console.log(
                "⚠️ Статус из БД отличается! БД:",
                statusFromDB,
                "Отправленный:",
                newStatus
              );
              console.log("⚠️ Принудительно обновляем БД...");
              await API.updateComplaint(complaintId, { status: newStatus });
              finalStatus = newStatus;
              // Ждем еще немного для гарантии
              await new Promise((resolve) => setTimeout(resolve, 500));
              // Перезагружаем еще раз
              const recheckResponse = await API.getComplaint(complaintId);
              if (recheckResponse && recheckResponse.data) {
                const recheckStatus = normalizeStatus(
                  recheckResponse.data.status
                );
                if (recheckStatus === newStatus) {
                  finalStatus = recheckStatus;
                  console.log(
                    "✅ Статус подтвержден после принудительного обновления:",
                    finalStatus
                  );
                }
              }
            } else {
              // Статус из БД пустой или не совпадает - используем отправленный
              console.log(
                "⚠️ Статус из БД пустой или не совпадает. Используем отправленный:",
                newStatus
              );
              if (!statusFromDB || statusFromDB === "") {
                // Принудительно обновляем БД
                console.log(
                  "⚠️ Принудительно обновляем БД с новым статусом..."
                );
                await API.updateComplaint(complaintId, { status: newStatus });
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
              finalStatus = newStatus;
            }

            // Сохраняем статус в глобальную переменную и localStorage
            lastSavedStatus = finalStatus;
            saveStatusToStorage(complaintId, finalStatus);
            console.log(
              "💾 Сохранен lastSavedStatus и в localStorage:",
              finalStatus
            );
            console.log("💾 Проверка: lastSavedStatus =", lastSavedStatus);

            // Обновляем все поля формы с новыми данными
            // ВАЖНО: fillFormFields также обновляет опции, но мы обновим их после с правильным статусом
            fillFormFields(updatedComplaint);

            // ВАЖНО: Принудительно обновляем опции ПОСЛЕ fillFormFields с правильным статусом
            // Это гарантирует, что опции будут правильными даже если fillFormFields их перезапишет
            console.log(
              "🔄 Принудительное обновление опций после сохранения. Финальный статус:",
              finalStatus,
              "lastSavedStatus:",
              lastSavedStatus
            );

            // ВАЖНО: Используем finalStatus, а не lastSavedStatus, чтобы гарантировать правильность
            updateActionOptions(finalStatus);

            // Дополнительная проверка через небольшую задержку
            setTimeout(() => {
              const actionSelect = document.getElementById("actionSelect");
              if (actionSelect) {
                const currentOptions = Array.from(actionSelect.options).map(
                  (opt) => opt.value
                );
                console.log(
                  "🔍 Проверка опций после обновления:",
                  currentOptions
                );
                console.log("🔍 Ожидаемый статус:", finalStatus);

                // Если опции не правильные, обновляем еще раз
                if (currentOptions.length <= 1) {
                  console.log("⚠️ Опции пустые! Принудительно обновляем...");
                  updateActionOptions(finalStatus);
                }
              }
            }, 100);

            // ВАЖНО: Автоматическая проверка и исправление статуса через задержку
            setTimeout(async () => {
              const verifiedStatus = await verifyAndFixStatus(complaintId);
              if (verifiedStatus) {
                console.log(
                  "✅ Статус автоматически проверен и исправлен после сохранения:",
                  verifiedStatus
                );
              }
            }, 200);

            // Сбрасываем выбранное действие
            const actionSelectEl = document.getElementById("actionSelect");
            if (actionSelectEl) {
              actionSelectEl.value = "";
            }

            // Переключаемся на вкладку "Подробно"
            switchToTab("card");
          }
        } catch (error) {
          alert(
            "⚠️ Ошибка отправки: " +
              error.message +
              "\n\nУбедитесь, что сервер запущен (npm start)"
          );
        }
      } else {
        alert("Заполните все обязательные поля (отмечены *)");
      }
    });
  }

  // Кнопки выбора файлов
  const btnFiles = document.querySelectorAll(".btn-file");
  btnFiles.forEach((btn) => {
    btn.addEventListener("click", function () {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;

      input.addEventListener("change", function () {
        const fileInput = btn.previousElementSibling;
        if (this.files.length > 0) {
          const fileNames = Array.from(this.files)
            .map((f) => f.name)
            .join(", ");
          fileInput.value = fileNames;
        }
      });

      input.click();
    });
  });
});

// Добавляем стиль для выделенного поля
const style = document.createElement("style");
style.textContent = `
  .field-value.selected {
    border-color: #1976d2;
    background: #e3f2fd;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
  }
`;
document.head.appendChild(style);
