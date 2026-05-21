const pages = ["home-page", "planner-page", "app-page"];

// Вместо const tasks = [...] пишем динамический запрос
let tasks = [];

// Функция для загрузки задач с бэкенда
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

// Изменяем функцию toggleTask, чтобы она отправляла PUT-запрос на бэкенд
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
  }
}

// Вызови loadTasks() в самом низу файла script.js вместо старых вызовов:
loadTasks();
renderCalendar();

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 10);
document.getElementById("exam-date").value = tomorrow.toISOString().slice(0, 10);

function showPage(page) {
  pages.forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById(page + "-page").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function generatePlan(event) {
  event.preventDefault();

  const examDate = new Date(document.getElementById("exam-date").value);
  const today = new Date();
  const diff = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

  document.getElementById("days-left").textContent = diff > 0 ? diff : 10;

  showPage("app");
  switchTab("dashboard");
  renderTasks();
  renderCalendar();
  updateStats();
}

function switchTab(tab) {
  ["dashboard", "calendar", "statistics"].forEach(name => {
    document.getElementById(name + "-content").classList.add("hidden");
    document.getElementById(name + "-tab").classList.remove("active");
  });

  document.getElementById(tab + "-content").classList.remove("hidden");
  document.getElementById(tab + "-tab").classList.add("active");
}

function renderTasks() {
  const list = document.getElementById("task-list");
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

  document.getElementById("tasks-today").textContent = tasks.filter(task => !task.done).length;
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  renderTasks();
  updateStats();
}

function updateStats() {
  const completed = tasks.filter(task => task.done).length;
  const percent = completed === 0 ? 25 : Math.round((completed / tasks.length) * 100);

  document.getElementById("main-progress").style.width = percent + "%";
  document.getElementById("progress-text").textContent = percent + "% complete";
  document.getElementById("completion-stat").textContent = percent + "%";
  document.getElementById("hours-studied").textContent = completed === 0 ? 6 : completed * 2;
}

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  for (let i = 1; i <= 21; i++) {
    const div = document.createElement("div");
    div.className = "calendar-day" + (i <= 3 ? " active" : "");
    div.textContent = i;
    grid.appendChild(div);
  }
}

function toggleChat() {
  document.getElementById("chat-panel").classList.toggle("hidden");
}

function sendMessage(event) {
  event.preventDefault();

  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  const messages = document.getElementById("chat-messages");
  messages.innerHTML += `<div class="message user">${text}</div>`;
  input.value = "";

  setTimeout(() => {
    messages.innerHTML += `<div class="message ai">I can help with that. Try reviewing examples first, then solve 5 practice problems.</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 500);
}

renderTasks();
renderCalendar();
updateStats();
