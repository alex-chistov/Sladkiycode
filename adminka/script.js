// Интерактивность для полей формы
document.addEventListener("DOMContentLoaded", function () {
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
      alert("Открытие списка");
      // Здесь можно добавить переход к списку сообщений
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
          const complaintData = {
            title:
              document.querySelector('input[value*="Другое"]')?.value || "",
            description:
              document.querySelector('input[placeholder*="заявки"]')?.value ||
              "",
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
            status: "В работе",
          };

          const result = await API.createComplaint(complaintData);
          alert("✅ Данные сохранены в базу данных!\nID заявки: " + result.id);

          // Добавляем запись в историю
          await API.addHistory({
            complaint_id: result.id,
            change_date: new Date().toISOString(),
            author: "[276] Аналитический центр города",
            field_name: "Статус",
            old_value: "Новое",
            new_value: "В работе",
          });
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
          // Собираем данные из формы обработки
          const processingData = {
            complaint_id: 170512, // ID текущей заявки
            action: document.querySelector(".custom-select")?.value || "",
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
            deadline: document.querySelector(".date-input")?.value || "",
          };

          // Обновляем заявку
          await API.updateComplaint(170512, {
            status: processingData.action,
            assigned_to: processingData.assigned_to,
          });

          alert("✅ Форма успешно отправлена и сохранена в БД!");

          // Добавляем в историю
          await API.addHistory({
            complaint_id: 170512,
            change_date: new Date().toISOString(),
            author: "[276] Аналитический центр города",
            field_name: "Статус",
            old_value: "В работе",
            new_value: processingData.action,
          });
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
