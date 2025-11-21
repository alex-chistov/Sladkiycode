// Скрипт для тестирования базы данных
const db = require("./database");

console.log("🧪 Тестирование базы данных...\n");

// Тест 1: Создание заявки
const testComplaint = {
  title: "Тестовая заявка",
  description: "Это тестовое описание",
  author: "Тестовый пользователь",
  author_email: "test@example.com",
  author_phone: "+79001234567",
  status: "Новое",
};

console.log("📝 Создаем тестовую заявку...");
db.createComplaint(testComplaint, function (err) {
  if (err) {
    console.error("❌ Ошибка создания:", err.message);
    process.exit(1);
  }

  const newId = this.lastID;
  console.log("✅ Заявка создана, ID:", newId);
  console.log();

  // Тест 2: Получение всех заявок
  console.log("📊 Получаем все заявки...");
  db.getAllComplaints((err, rows) => {
    if (err) {
      console.error("❌ Ошибка получения:", err.message);
      process.exit(1);
    }

    console.log("✅ Найдено заявок:", rows.length);
    console.log();

    if (rows.length > 0) {
      console.log("📋 Последняя заявка:");
      const last = rows[0];
      console.log({
        id: last.id,
        title: last.title,
        author: last.author,
        status: last.status,
        created_at: last.created_at,
      });
      console.log();
    }

    // Тест 3: Получение конкретной заявки
    console.log("🔍 Получаем заявку по ID:", newId);
    db.getComplaintById(newId, (err, row) => {
      if (err) {
        console.error("❌ Ошибка:", err.message);
        process.exit(1);
      }

      if (row) {
        console.log("✅ Заявка найдена:", row.title);
      } else {
        console.log("⚠️ Заявка не найдена");
      }
      console.log();

      // Тест 4: Добавление истории
      console.log("📜 Добавляем запись в историю...");
      db.addHistoryRecord(
        {
          complaint_id: newId,
          change_date: new Date().toISOString(),
          author: "Система",
          field_name: "Статус",
          old_value: "",
          new_value: "Новое",
        },
        function (err) {
          if (err) {
            console.error("❌ Ошибка добавления истории:", err.message);
          } else {
            console.log("✅ История добавлена, ID:", this.lastID);
          }
          console.log();

          console.log("🎉 Все тесты завершены!");
          console.log(
            "💡 Откройте http://localhost:3000/admin.html для просмотра данных"
          );

          process.exit(0);
        }
      );
    });
  });
});
