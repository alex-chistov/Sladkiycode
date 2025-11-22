// API клиент для работы с сервером
const API_URL = "http://localhost:3000/api";

const API = {
  // Заявки
  async getAllComplaints() {
    try {
      const response = await fetch(`${API_URL}/complaints`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Ошибка получения заявок:", error);
      throw error;
    }
  },

  async getComplaint(id) {
    try {
      const response = await fetch(`${API_URL}/complaints/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Ошибка получения заявки:", error);
      throw error;
    }
  },

  async createComplaint(complaintData) {
    try {
      const response = await fetch(`${API_URL}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(complaintData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Ошибка создания заявки:", error);
      throw error;
    }
  },

  async updateComplaint(id, complaintData) {
    try {
      console.log("📤 API.updateComplaint вызван:", {
        id,
        complaintData,
        status: complaintData.status,
      });

      const response = await fetch(`${API_URL}/complaints/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Ошибка ответа сервера:", response.status, errorText);
        throw new Error(`Ошибка обновления: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ API.updateComplaint успешно:", data);
      return data;
    } catch (error) {
      console.error("❌ Ошибка обновления заявки:", error);
      throw error;
    }
  },

  async deleteComplaint(id) {
    try {
      const response = await fetch(`${API_URL}/complaints/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Ошибка удаления заявки:", error);
      throw error;
    }
  },

  // История
  async addHistory(historyData) {
    try {
      const response = await fetch(`${API_URL}/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(historyData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Ошибка добавления истории:", error);
      throw error;
    }
  },

  async getHistory(complaintId) {
    try {
      const response = await fetch(`${API_URL}/history/${complaintId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Ошибка получения истории:", error);
      throw error;
    }
  },

  // Вспомогательные функции
  getFormData() {
    const formData = {};

    // Собираем данные со всех полей
    document.querySelectorAll(".field-input").forEach((input) => {
      const label =
        input.previousElementSibling?.textContent ||
        input.closest(".form-field")?.querySelector("label")?.textContent;
      if (label) {
        const fieldName = label.trim().replace("*", "").trim();
        formData[fieldName] = input.value;
      }
    });

    // Собираем данные из select
    document.querySelectorAll(".custom-select").forEach((select) => {
      const label = select
        .closest(".form-field")
        ?.querySelector("label")?.textContent;
      if (label) {
        const fieldName = label.trim().replace("*", "").trim();
        formData[fieldName] = select.value;
      }
    });

    // Собираем данные из textarea
    document.querySelectorAll(".custom-textarea").forEach((textarea) => {
      const label = textarea
        .closest(".form-field")
        ?.querySelector("label")?.textContent;
      if (label) {
        const fieldName = label.trim();
        formData[fieldName] = textarea.value;
      }
    });

    return formData;
  },
};

// Экспортируем для использования
if (typeof module !== "undefined" && module.exports) {
  module.exports = API;
}
