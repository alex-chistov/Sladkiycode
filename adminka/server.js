const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));
// Статические файлы для loba4
app.use("/loba4", express.static(path.join(__dirname, "../loba4")));

// Главная страница (админка)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Список заявок
app.get("/list.html", (req, res) => {
  res.sendFile(path.join(__dirname, "list.html"));
});

// API: Получить все заявки
app.get("/api/complaints", (req, res) => {
  db.getAllComplaints((err, rows) => {
    if (err) {
      console.error("❌ Ошибка получения заявок:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log("📊 Получено заявок:", rows ? rows.length : 0);
    res.json({ data: rows || [] });
  });
});

// API: Получить заявку по ID
app.get("/api/complaints/:id", (req, res) => {
  const id = req.params.id;
  db.getComplaintById(id, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Заявка не найдена" });
      return;
    }
    res.json({ data: row });
  });
});

// API: Получить заявки по номеру телефона
app.get("/api/complaints-by-phone/:phone", (req, res) => {
  const phone = req.params.phone;
  db.getComplaintsByPhone(phone, (err, rows) => {
    if (err) {
      console.error("❌ Ошибка получения заявок по телефону:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(
      "📊 Найдено заявок для телефона",
      phone,
      ":",
      rows ? rows.length : 0
    );
    res.json({ data: rows || [] });
  });
});

// API: Создать новую заявку
app.post("/api/complaints", (req, res) => {
  const data = req.body;
  console.log("📝 Создание заявки:", data);

  db.createComplaint(data, function (err) {
    if (err) {
      console.error("❌ Ошибка создания заявки:", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log("✅ Заявка создана, ID:", this.lastID);
    res.json({
      message: "Заявка создана успешно",
      id: this.lastID,
    });
  });
});

// API: Обновить заявку
app.put("/api/complaints/:id", (req, res) => {
  const id = req.params.id;
  const data = req.body;

  console.log("📥 PUT /api/complaints/:id", {
    id,
    data,
    status: data.status,
  });

  db.updateComplaint(id, data, function (err) {
    if (err) {
      console.error("❌ Ошибка обновления заявки в БД:", err);
      res.status(500).json({ error: err.message });
      return;
    }

    console.log("✅ Заявка обновлена в БД:", {
      id,
      changes: this.changes,
      status: data.status,
    });

    res.json({
      message: "Заявка обновлена успешно",
      changes: this.changes,
    });
  });
});

// API: Удалить заявку
app.delete("/api/complaints/:id", (req, res) => {
  const id = req.params.id;
  db.deleteComplaint(id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: "Заявка удалена успешно",
      changes: this.changes,
    });
  });
});

// API: Добавить запись в историю изменений
app.post("/api/history", (req, res) => {
  const data = req.body;
  db.addHistoryRecord(data, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: "Запись добавлена в историю",
      id: this.lastID,
    });
  });
});

// API: Получить историю по ID заявки
app.get("/api/history/:complaintId", (req, res) => {
  const complaintId = req.params.complaintId;
  db.getHistory(complaintId, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 База данных: complaints.db`);
});
