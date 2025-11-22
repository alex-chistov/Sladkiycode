// Глобальная переменная для хранения последнего сохраненного статуса
let lastSavedStatus = null;

function normalizeStatus(status) {
  const normalized = (status || "").trim();
  return normalized === "" ? "" : normalized;
}

// Функции для работы с localStorage
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

    // Пытаемся загрузить статус из localStorage
    const savedStatus = getStatusFromStorage(complaintId);

    // Определяем статус: сначала из localStorage, потом из БД, потом "Новое"
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
      // Сохраняем в localStorage для будущих обновлений
      saveStatusToStorage(complaintId, finalStatus);
    } else {
      // Если статуса нет, считаем заявку новой
      finalStatus = "Новое";
      console.log("💾 Статус не указан, устанавливаем 'Новое'");
      saveStatusToStorage(complaintId, finalStatus);
    }

    // Сохраняем статус в глобальную переменную
    lastSavedStatus = finalStatus;

    // Заполняем поля формы
    fillFormFields(complaint);

    // Обновляем ID в заголовке
    document.querySelector(".id-field span").textContent = complaint.id;

    // Обновляем заголовок страницы
    document.title = `Обращение № ${complaint.id} - Smartopolis`;

    // Загружаем историю изменений
    loadHistory(complaintId);
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

    // Определяем статус для опций
    // ВАЖНО: Используем lastSavedStatus, который был установлен при загрузке страницы
    // Это гарантирует, что при F5 опции не сбросятся
    const complaintId = getComplaintIdFromUrl();
    const savedStatus = complaintId ? getStatusFromStorage(complaintId) : null;
    const statusFromDb = normalizeStatus(complaint.status);
    const statusForOptions =
      savedStatus || lastSavedStatus || statusFromDb || "Новое";

    // Обновляем lastSavedStatus на основе статуса из localStorage или БД
    if (savedStatus) {
      lastSavedStatus = savedStatus;
      console.log(
        "💾 Используем статус из localStorage в fillFormFields:",
        lastSavedStatus
      );
    } else if (statusFromDb && statusFromDb !== lastSavedStatus) {
      lastSavedStatus = statusFromDb;
      if (complaintId) {
        saveStatusToStorage(complaintId, statusFromDb);
      }
      console.log(
        "💾 Обновлен lastSavedStatus в fillFormFields:",
        lastSavedStatus
      );
    }

    // Обновляем опции действий с правильным статусом
    console.log(
      "🔄 Обновление опций при загрузке формы. Статус:",
      statusForOptions
    );
    updateActionOptions(statusForOptions);
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

  // Обновляем опции действий в зависимости от статуса (используем сохраненный)
  const statusForOptions =
    normalizeStatus(lastSavedStatus) ||
    normalizeStatus(complaint.status) ||
    "Новое";
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
    console.log(
      "🔍 Проверка: normalizedStatus === 'Предварительно решено':",
      normalizedStatus === "Предварительно решено"
    );
    console.log(
      "🔍 Проверка: normalizedStatus:",
      JSON.stringify(normalizedStatus)
    );
    console.log(
      "🔍 Проверка: длина normalizedStatus:",
      normalizedStatus.length
    );
  } else if (normalizedStatus === "На рассмотрении") {
    // Альтернативный статус для модератора
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
          // Загружаем текущий статус и обновляем опции
          API.getComplaint(complaintId)
            .then((response) => {
              if (response && response.data) {
                // ВАЖНО: Используем статус из localStorage, если он есть
                const savedStatus = getStatusFromStorage(complaintId);
                const statusFromDb = normalizeStatus(response.data.status);
                const statusForOptions =
                  savedStatus || lastSavedStatus || statusFromDb || "Новое";

                // Сохраняем статус в глобальную переменную и localStorage
                lastSavedStatus = statusForOptions;
                if (statusForOptions && statusForOptions !== savedStatus) {
                  saveStatusToStorage(complaintId, statusForOptions);
                }

                // Обновляем lastSavedStatus на основе статуса из БД, если он есть и отличается
                if (statusFromDb && statusFromDb !== lastSavedStatus) {
                  lastSavedStatus = statusFromDb;
                  console.log(
                    "💾 Обновлен lastSavedStatus при переключении на Обработку:",
                    lastSavedStatus
                  );
                }

                console.log(
                  "🔄 Переключение на Обработку. Статус из БД:",
                  response.data.status,
                  "Последний сохраненный:",
                  lastSavedStatus
                );

                updateActionOptions(statusForOptions);
              }
            })
            .catch((error) => {
              console.error("Ошибка загрузки статуса:", error);
              // Если ошибка, используем последний сохраненный статус
              if (lastSavedStatus) {
                updateActionOptions(lastSavedStatus);
              } else {
                updateActionOptions("Новое");
              }
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
              updateActionOptions(updatedComplaint.status);

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

          // Получаем текущий статус для истории
          const currentComplaint = await API.getComplaint(complaintId);
          const oldStatus = currentComplaint?.data?.status || "";

          // Собираем данные из формы обработки
          const actionSelect = document.getElementById("actionSelect");
          const selectedAction = actionSelect?.value || "";

          // Маппинг действий на статусы
          const actionToStatusMap = {
            "На модерации": "На модерации", // Первый этап: отправка на модерацию
            Отклонено: "Отклонено",
            "Назначить ответственного": "Назначено ответственному",
            "Взять работу ответственным": "Взято в работу ответственным",
            "Предварительно решено": "Предварительно решено", // Статус остается для модератора
            Закрыть: "Закрыто",
          };

          const newStatus = actionToStatusMap[selectedAction] || selectedAction;

          // Сохраняем статус в глобальную переменную
          lastSavedStatus = newStatus;

          console.log("Маппинг действия на статус:", {
            selectedAction: selectedAction,
            newStatus: newStatus,
            map: actionToStatusMap,
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
          const updateData = {
            status: newStatus,
            deadline: deadlineValue,
          };

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
            // При "Предварительно решено" заявка возвращается модератору
            // Статус меняется на "На модерации" через маппинг
          }

          // Всегда сохраняем официальный ответ, если он заполнен
          if (processingData.official_response) {
            updateData.official_response = processingData.official_response;
          }

          console.log("📤 Сохранение в БД. ID:", complaintId);
          console.log("📤 Данные для сохранения:", updateData);
          console.log("📤 Новый статус:", newStatus);

          const updateResult = await API.updateComplaint(
            complaintId,
            updateData
          );
          console.log("✅ Результат обновления заявки:", updateResult);
          console.log("✅ Обновленные данные:", updateData);

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
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Перезагружаем данные заявки для обновления формы
          console.log("🔄 Перезагрузка данных из БД после сохранения...");
          const updatedResponse = await API.getComplaint(complaintId);
          if (updatedResponse && updatedResponse.data) {
            const updatedComplaint = updatedResponse.data;

            console.log(
              "📊 Данные из БД после сохранения. Старый статус:",
              oldStatus,
              "Новый статус (сохраненный):",
              newStatus,
              "Статус из БД:",
              updatedComplaint.status,
              "Тип статуса из БД:",
              typeof updatedComplaint.status
            );

            // ВАЖНО: Сначала обновляем lastSavedStatus, чтобы при F5 опции были правильными
            // Используем статус из БД как источник истины
            const statusFromDB = normalizeStatus(updatedComplaint.status);
            const finalStatus = statusFromDB || newStatus || "Новое";

            // Сохраняем статус в глобальную переменную для будущих обновлений (включая F5)
            lastSavedStatus = finalStatus;

            // ВАЖНО: Сохраняем статус в localStorage для сохранения после обновления страницы
            saveStatusToStorage(complaintId, finalStatus);

            console.log(
              "💾 Обновлен lastSavedStatus после сохранения. Сохраненный статус:",
              newStatus,
              "Статус из БД:",
              updatedComplaint.status,
              "→ Финальный статус (сохранен в lastSavedStatus и localStorage):",
              finalStatus
            );

            // Обновляем все поля формы с новыми данными
            // ВАЖНО: fillFormFields также обновляет опции, но мы обновим их после с правильным статусом
            fillFormFields(updatedComplaint);

            // Обновляем опции действий с финальным статусом
            // ВАЖНО: Используем finalStatus, который сохранен в lastSavedStatus
            // Это должно быть сделано ПОСЛЕ fillFormFields, чтобы перезаписать опции правильным статусом
            console.log(
              "🔄 Обновление опций после сохранения. Старый статус:",
              oldStatus,
              "Новый статус (сохраненный):",
              newStatus,
              "Статус из БД:",
              updatedComplaint.status,
              "→ Финальный статус:",
              finalStatus
            );
            updateActionOptions(finalStatus);

            // Дополнительная проверка: убеждаемся, что опции действительно обновились
            setTimeout(() => {
              const actionSelect = document.getElementById("actionSelect");
              if (actionSelect) {
                const currentOptions = Array.from(actionSelect.options).map(
                  (opt) => opt.value
                );
                console.log(
                  "🔍 Текущие опции в select после обновления:",
                  currentOptions
                );
                console.log("🔍 Ожидаемый статус для опций:", finalStatus);

                // Если опции не обновились правильно, принудительно обновляем еще раз
                if (finalStatus === "На модерации") {
                  const hasCorrectOptions =
                    currentOptions.includes("Назначить ответственного") &&
                    currentOptions.includes("Отклонено");
                  if (!hasCorrectOptions) {
                    console.log(
                      "⚠️ Опции не обновились правильно для 'На модерации'! Принудительно обновляем..."
                    );
                    updateActionOptions(finalStatus);
                  }
                } else if (finalStatus === "Предварительно решено") {
                  const hasCorrectOptions =
                    currentOptions.includes("Назначить ответственного") &&
                    currentOptions.includes("Закрыть");
                  if (!hasCorrectOptions) {
                    console.log(
                      "⚠️ Опции не обновились правильно для 'Предварительно решено'! Принудительно обновляем..."
                    );
                    updateActionOptions(finalStatus);
                  }
                }
              }
            }, 100);

            // Принудительно обновляем опции еще раз через небольшую задержку
            // ВАЖНО: Используем finalStatus, который сохранен в lastSavedStatus
            setTimeout(() => {
              // Перезагружаем данные из БД еще раз для гарантии
              API.getComplaint(complaintId)
                .then((recheckResponse) => {
                  if (recheckResponse && recheckResponse.data) {
                    const recheckStatus = normalizeStatus(
                      recheckResponse.data.status
                    );
                    const finalRecheckStatus =
                      recheckStatus || finalStatus || "Новое";

                    lastSavedStatus = finalRecheckStatus;
                    // Сохраняем в localStorage
                    saveStatusToStorage(complaintId, finalRecheckStatus);
                    updateActionOptions(finalRecheckStatus);
                    console.log(
                      "🔄 Финальное обновление опций со статусом из БД:",
                      finalRecheckStatus,
                      "(lastSavedStatus:",
                      lastSavedStatus,
                      ")"
                    );
                  } else {
                    updateActionOptions(finalStatus);
                    console.log(
                      "🔄 Принудительное обновление опций со статусом:",
                      finalStatus,
                      "(lastSavedStatus:",
                      lastSavedStatus,
                      ")"
                    );
                  }
                })
                .catch((error) => {
                  console.error("Ошибка при перезагрузке данных:", error);
                  updateActionOptions(finalStatus);
                });
            }, 300);

            // Сбрасываем выбранное действие
            const actionSelect = document.getElementById("actionSelect");
            if (actionSelect) {
              actionSelect.value = "";
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
