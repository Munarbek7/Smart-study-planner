const pages = ["home-page", "planner-page", "app-page"];
let tasks = [];
let currentUser = localStorage.getItem('username') || null;

document.addEventListener("DOMContentLoaded", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 10);
  const examDateInput = document.getElementById("exam-date");
  if (examDateInput) {
    examDateInput.value = tomorrow.toISOString().slice(0, 10);
  }

  updateAuthUI();
  if (currentUser) {
    loadTasks();
  }
  renderCalendar();
});

function updateAuthUI() {
  const loginBtns = document.querySelectorAll(".login-btn");
  loginBtns.forEach(btn => {
    if (currentUser) {
      btn.textContent = `Выйти (${currentUser})`;
      btn.onclick = handleLogout;
    } else {
      btn.textContent = "Log in";
      btn.onclick = toggleLoginModal;
    }
  });
}

function toggleLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) modal.classList.toggle("hidden");
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();

    if (response.ok && data.success) {
      currentUser = data.username;
      localStorage.setItem('username', currentUser);
      toggleLoginModal();
      updateAuthUI();
      await loadTasks();
      showPage("app-page");
    } else {
      alert(data.error || "Ошибка авторизации");
    }
  } catch (err) {
    console.error("Ошибка входа:", err);
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('username');
  tasks = [];
  updateAuthUI();
  showPage("home-page");
}

function showPage(page) {
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  const targetId = page.endsWith("-page") ? page : `${page}-page`;
  const targetPage = document.getElementById(targetId);
  if (targetPage) targetPage.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadTasks() {
  if (!currentUser) return;
  try {
    const response = await fetch('/api/tasks', {
      headers: { 'x-user': currentUser }
    });
    tasks = await response.json();
    renderTasks();
    updateStats();
  } catch (err) {
    console.error("Ошибка загрузки задач:", err);
  }
}

async function generatePlan(event) {
  event.preventDefault();
  if (!currentUser) {
    alert("Пожалуйста, сначала авторизуйтесь (кнопка Log in)!");
    toggleLoginModal();
    return;
  }

  const examName = document.getElementById("exam-name").value;
  const examDateValue = document.getElementById("exam-date").value;
  const level = document.getElementById("level").value;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user': currentUser
      },
      body: JSON.stringify({ examName, examDate: examDateValue, level })
    });
    const data = await response.json();

    if (data.success) {
      document.getElementById("days-left").textContent = data.daysLeft;
      await loadTasks();
      showPage("app-page");
      switchTab("dashboard");
    }
  } catch (err) {
    console.error("Ошибка при генерации плана:", err);
  }
}

async function toggleTask(index) {
  if (!currentUser) return;
  try {
    const response = await fetch(`/api/tasks/${index}`, {
      method: 'PUT',
      headers: { 'x-user': currentUser }
    });
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

function updateStats() {
  if (tasks.length === 0) return;
  const completed = tasks.filter(task => task.done).length;
  const percent = Math.round((completed / tasks.length) * 100);

  document.getElementById("main-progress").style.width = percent + "%";
  document.getElementById("progress-text").textContent = percent + "% complete";
  document.getElementById("completion-stat").textContent = percent + "%";
  document.getElementById("hours-studied").textContent = completed * 2;
}

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

function toggleChat() {
  const chatPanel = document.getElementById("chat-panel");
  if (chatPanel) chatPanel.classList.toggle("hidden");
}

function sendMessage(event) {
  event.preventDefault();
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  const messages = document.getElementById("chat-messages");
  messages.innerHTML += `<div class="message user">${text}</div>`;
  input.value = "";
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    messages.innerHTML += `<div class="message ai">I can help with that. Try reviewing examples first, then solve 5 practice problems.</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 500);
}