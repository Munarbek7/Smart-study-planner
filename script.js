const pages = ["home-page", "planner-page", "app-page"];
let tasks = [];

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  // Установка дефолтной даты в форму (сегодня + 10 дней)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 10);
  const examDateInput = document.getElementById("exam-date");
  if (examDateInput) {
    examDateInput.value = tomorrow.toISOString().slice(0, 10);
  }

  // Первичная загрузка данных
  loadTasks();
  renderCalendar();
});

// Функция переключения страниц
function showPage(page) {
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  // Корректно обрабатываем как "app", так и "app-page"
  const targetId = page.endsWith("-page") ? page : `${page}-page`;
  const targetPage = document.getElementById(targetId);
  if (targetPage) {
    targetPage.classList.remove("hidden");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Загрузка задач с бэкенда
async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    tasks = await response.json();
    renderTasks();
    updateStats();
  } catch (err) {
    console.error("Ошибка загрузки задач:", err);
  }
}

// Отправка данных формы на бэкенд и генерация плана
async function generatePlan(event) {
  event.preventDefault();

  const examName = document.getElementById("exam-name").value;
  const examDateValue = document.getElementById("exam-date").value;
  const level = document.getElementById("level").value;
  const hours = document.getElementById("hours").value;

  const examDate = new Date(examDateValue);
  const today = new Date();
  const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

  document.getElementById("days-left").textContent = diff > 0 ? diff : 10;

  try {
    // Отправляем параметры на бэкенд
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examName, examDate: examDateValue, level, hours })
    });
    const data = await response.json();

    if (data.tasks) {
      tasks = data.tasks;
    }

    // Переключаемся на страницу приложения
    showPage("app-page");
    switchTab("dashboard");
    renderTasks();
    updateStats();
  } catch (err) {
    console.error("Ошибка при генерации плана:", err);
    // Фолбэк на случай если бэкенд недоступен во время тестов
    showPage("app-page");
    switchTab("dashboard");
  }
}

// Переключение вкладок в личном кабинете
function switchTab(tab) {
  ["dashboard", "calendar", "statistics"].forEach(name => {
    const content = document.getElementById(name + "-content");
    const tabBtn = document.getElementById(name + "-tab");
    if (content) content.classList.add("hidden");
    if (tabBtn) tabBtn.classList.remove("active");
  });

  const activeContent = document.getElementById(tab + "-content");
  const activeTab = document.getElementById(tab + "-tab");
  if (activeContent) activeContent.classList.remove("hidden");
  if (activeTab) activeTab.classList.add("active");
}

// Отображение списка задач
function renderTasks() {
  const list = document.getElementById("task-list");
  if (!list) return;
  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const button = document.createElement("button");
    button.className = "task-row" + (task.done ? " done" : "");
    button.onclick = () => toggleTask(index);

    button.innerHTML = `
      <span class="checkbox">${task.done ? "✓" : ""}</span>
      <span class="task-text">
        <span class="task-title">${task.title}</span>
        <span class="task-desc">${task.desc}</span>
      </span>
      <span class="task-icon">🧾</span>
    `;

    list.appendChild(button);
  });

  const tasksTodayInput = document.getElementById("tasks-today");
  if (tasksTodayInput) {
    tasksTodayInput.textContent = tasks.filter(task => !task.done).length;
  }
}

// Изменение статуса задачи через бэкенд API
async function toggleTask(index) {
  try {
    const response = await fetch(`/api/tasks/${index}`, { method: 'PUT' });
    const data = await response.json();
    if (data.success) {
      tasks = data.tasks;
      renderTasks();
      updateStats();
    }
  } catch (err) {
    console.error("Ошибка обновления задачи:", err);
    // Локальный фолбэк, если бэкенд временно отключен
    tasks[index].done = !tasks[index].done;
    renderTasks();
    updateStats();
  }
}

// Обновление блоков статистики
function updateStats() {
  if (tasks.length === 0) return;

  const completed = tasks.filter(task => task.done).length;
  const percent = Math.round((completed / tasks.length) * 100);

  const mainProgress = document.getElementById("main-progress");
  if (mainProgress) mainProgress.style.width = percent + "%";

  const progressText = document.getElementById("progress-text");
  if (progressText) progressText.textContent = percent + "% complete";

  const completionStat = document.getElementById("completion-stat");
  if (completionStat) completionStat.textContent = percent + "%";

  const hoursStudied = document.getElementById("hours-studied");
  if (hoursStudied) {
    hoursStudied.textContent = completed === 0 ? 0 : completed * 2;
  }
}

// Генерация сетки календаря
function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  if (!grid) return;
  grid.innerHTML = "";

  for (let i = 1; i <= 21; i++) {
    const div = document.createElement("div");
    div.className = "calendar-day" + (i <= 3 ? " active" : "");
    div.textContent = i;
    grid.appendChild(div);
  }
}

// Показать/скрыть чат ассистента
function toggleChat() {
  const chatPanel = document.getElementById("chat-panel");
  if (chatPanel) chatPanel.classList.toggle("hidden");
}

// Отправка сообщений в чат
function sendMessage(event) {
  event.preventDefault();

  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  const messages = document.getElementById("chat-messages");
  if (!messages) return;

  messages.innerHTML += `<div class="message user">${text}</div>`;
  input.value = "";
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    messages.innerHTML += `<div class="message ai">I can help with that. Try reviewing examples first, then solve 5 practice problems.</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 500);
}