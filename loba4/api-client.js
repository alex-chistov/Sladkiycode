// API клиент для работы с сервером заявок
const API_BASE_URL = "http://localhost:3000/api";

class ComplaintsAPI {
  // Создать новую заявку
  static async createComplaint(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Заявка создана:", result);
      return result;
    } catch (error) {
      console.error("❌ Ошибка создания заявки:", error);
      throw error;
    }
  }

  // Получить заявки по номеру телефона
  static async getComplaintsByPhone(phone) {
    try {
      // Убираем все символы кроме цифр
      const cleanPhone = phone.replace(/\D/g, "");

      const response = await fetch(
        `${API_BASE_URL}/complaints-by-phone/${encodeURIComponent(phone)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Получено заявок:", result.data.length);
      return result.data;
    } catch (error) {
      console.error("❌ Ошибка получения заявок:", error);
      throw error;
    }
  }

  // Получить заявку по ID
  static async getComplaintById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/complaints/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("❌ Ошибка получения заявки:", error);
      throw error;
    }
  }

  // Обновить статус заявки
  static async updateComplaint(id, data) {
    try {
      const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Заявка обновлена:", result);
      return result;
    } catch (error) {
      console.error("❌ Ошибка обновления заявки:", error);
      throw error;
    }
  }

  // Проверить доступность сервера
  static async checkServer() {
    try {
      const response = await fetch(`${API_BASE_URL}/complaints`);
      return response.ok;
    } catch (error) {
      console.error("❌ Сервер недоступен:", error);
      return false;
    }
  }
}
