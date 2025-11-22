const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Создаём/открываем базу данных
const dbPath = path.join(__dirname, "complaints.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Ошибка подключения к БД:", err.message);
  } else {
    console.log("✅ Подключено к базе данных SQLite");
    initDatabase();
  }
});

// Инициализация таблиц
function initDatabase() {
  // Таблица заявок
  db.run(
    `
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      problem_type TEXT,
      esia TEXT,
      author TEXT,
      author_email TEXT,
      author_phone TEXT,
      author_address TEXT,
      visible_to_all TEXT,
      publish_result TEXT,
      assigned_to TEXT,
      images TEXT,
      attachments TEXT,
      video TEXT,
      result_images TEXT,
      created_date TEXT,
      deadline TEXT,
      days_remaining INTEGER,
      standard_period TEXT,
      external_system TEXT,
      authority TEXT,
      external_id TEXT,
      external_category TEXT,
      link TEXT,
      status TEXT DEFAULT 'Новое',
      official_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error("❌ Ошибка создания таблицы complaints:", err);
      } else {
        // Проверяем существование колонки official_response и добавляем, если её нет
        db.all("PRAGMA table_info(complaints)", [], (pragmaErr, columns) => {
          if (pragmaErr) {
            console.error("❌ Ошибка проверки структуры таблицы:", pragmaErr);
            return;
          }

          // Проверяем, есть ли колонка official_response
          const hasOfficialResponse = columns.some(
            (col) => col.name === "official_response"
          );

          if (!hasOfficialResponse) {
            // Добавляем колонку official_response
            db.run(
              `ALTER TABLE complaints ADD COLUMN official_response TEXT`,
              (alterErr) => {
                if (alterErr) {
                  console.error(
                    "❌ Ошибка добавления колонки official_response:",
                    alterErr.message
                  );
                } else {
                  console.log(
                    "✅ Колонка official_response добавлена в таблицу complaints"
                  );
                }
              }
            );
          } else {
            console.log(
              "ℹ️ Колонка official_response уже существует в таблице complaints"
            );
          }
        });
      }
    }
  );

  // Таблица истории изменений
  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      change_date TEXT NOT NULL,
      author TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    )
  `);

  // Таблица обработки заявок
  db.run(`
    CREATE TABLE IF NOT EXISTS processing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      action TEXT,
      publish_result INTEGER DEFAULT 0,
      visible_to_all INTEGER DEFAULT 0,
      rating INTEGER,
      assigned_to TEXT,
      result_images TEXT,
      official_response TEXT,
      return_reason TEXT,
      return_photos TEXT,
      sms_text TEXT,
      author_phone TEXT,
      sms_sent_date TEXT,
      attached_documents TEXT,
      deadline TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    )
  `);

  console.log("✅ Таблицы созданы/проверены");
}

// CRUD операции для заявок

// Получить все заявки
function getAllComplaints(callback) {
  const sql = "SELECT * FROM complaints ORDER BY created_at DESC";
  db.all(sql, [], callback);
}

// Получить заявку по ID
function getComplaintById(id, callback) {
  const sql = "SELECT * FROM complaints WHERE id = ?";
  db.get(sql, [id], callback);
}

// Получить заявки по номеру телефона
function getComplaintsByPhone(phone, callback) {
  const sql =
    "SELECT * FROM complaints WHERE author_phone = ? ORDER BY created_at DESC";
  db.all(sql, [phone], callback);
}

// Создать заявку
function createComplaint(data, callback) {
  console.log("💾 Попытка сохранения в БД:", {
    title: data.title,
    author: data.author,
    status: data.status,
  });

  const sql = `
    INSERT INTO complaints (
      title, description, problem_type, esia, author, author_email,
      author_phone, author_address, visible_to_all, publish_result,
      assigned_to, images, attachments, video, result_images,
      created_date, deadline, days_remaining, standard_period,
      external_system, authority, external_id, external_category,
      link, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    data.title || "",
    data.description || "",
    data.problem_type || "",
    data.esia || "",
    data.author || "",
    data.author_email || "",
    data.author_phone || "",
    data.author_address || "",
    data.visible_to_all || "",
    data.publish_result || "",
    data.assigned_to || "",
    data.images || "",
    data.attachments || "",
    data.video || "",
    data.result_images || "",
    data.created_date || new Date().toISOString(),
    data.deadline || "",
    data.days_remaining || null,
    data.standard_period || "",
    data.external_system || "",
    data.authority || "",
    data.external_id || "",
    data.external_category || "",
    data.link || "",
    data.status || "Новое",
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("❌ Ошибка SQL:", err.message);
      callback(err);
    } else {
      console.log("✅ Запись добавлена в БД, ID:", this.lastID);
      callback.call(this, null);
    }
  });
}

// Обновить заявку
function updateComplaint(id, data, callback) {
  const fields = Object.keys(data)
    .filter((key) => key !== "id")
    .map((key) => `${key} = ?`)
    .join(", ");

  const sql = `UPDATE complaints SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  const params = [
    ...Object.values(data).filter((_, i) => Object.keys(data)[i] !== "id"),
    id,
  ];

  db.run(sql, params, callback);
}

// Удалить заявку
function deleteComplaint(id, callback) {
  const sql = "DELETE FROM complaints WHERE id = ?";
  db.run(sql, [id], callback);
}

// История изменений

// Добавить запись в историю
function addHistoryRecord(data, callback) {
  const sql = `
    INSERT INTO history (complaint_id, change_date, author, field_name, old_value, new_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const params = [
    data.complaint_id,
    data.change_date || new Date().toISOString(),
    data.author,
    data.field_name,
    data.old_value || "",
    data.new_value || "",
  ];

  db.run(sql, params, callback);
}

// Получить историю заявки
function getHistory(complaintId, callback) {
  const sql =
    "SELECT * FROM history WHERE complaint_id = ? ORDER BY created_at DESC";
  db.all(sql, [complaintId], callback);
}

// Обработка заявки

// Сохранить данные обработки
function saveProcessing(data, callback) {
  const sql = `
    INSERT INTO processing (
      complaint_id, action, publish_result, visible_to_all, rating,
      assigned_to, result_images, official_response, return_reason,
      return_photos, sms_text, author_phone, sms_sent_date,
      attached_documents, deadline
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    data.complaint_id,
    data.action || "",
    data.publish_result || 0,
    data.visible_to_all || 0,
    data.rating || null,
    data.assigned_to || "",
    data.result_images || "",
    data.official_response || "",
    data.return_reason || "",
    data.return_photos || "",
    data.sms_text || "",
    data.author_phone || "",
    data.sms_sent_date || "",
    data.attached_documents || "",
    data.deadline || "",
  ];

  db.run(sql, params, callback);
}

// Экспорт функций
module.exports = {
  db,
  getAllComplaints,
  getComplaintById,
  getComplaintsByPhone,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  addHistoryRecord,
  getHistory,
  saveProcessing,
};
