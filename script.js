const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll("[data-page]");
const taskList = document.getElementById("taskList");
const progressValue = document.getElementById("progressValue");
const tasksCount = document.getElementById("tasksCount");
const todayTopicTitle = document.getElementById("todayTopicTitle");
const focusTaskText = document.getElementById("focusTaskText");
const daysLeftEl = document.getElementById("daysLeft");
const profileDaysLeft = document.getElementById("profileDaysLeft");
const profileSubject = document.getElementById("profileSubject");
const profileExamDate = document.getElementById("profileExamDate");
const profileLevel = document.getElementById("profileLevel");
const profileStudyTime = document.getElementById("profileStudyTime");
const currentGoalText = document.getElementById("currentGoalText");
const studyHoursValue = document.getElementById("studyHoursValue");
const completedTopicsStat = document.getElementById("completedTopicsStat");
const totalHoursStat = document.getElementById("totalHoursStat");
const tasksDoneStat = document.getElementById("tasksDoneStat");
const profileProgressFill = document.getElementById("profileProgressFill");
const profileProgressText = document.getElementById("profileProgressText");

const defaultPlan = [
  { short: "Binary", full: "Binary Conversions", tasks: ["Learn basic binary rules", "Solve 10 practice problems", "Review mistakes"] },
  { short: "Modular", full: "Modular Arithmetic", tasks: ["Understand modulo basics", "Solve 8 congruence questions", "Check your answers"] },
  { short: "Induction", full: "Mathematical Induction", tasks: ["Study the base case", "Write the induction step", "Practice one full proof"] },
  { short: "Counting", full: "Counting", tasks: ["Review the product rule", "Solve 6 counting tasks", "Summarize common patterns"] },
  { short: "Graphs", full: "Graph Theory", tasks: ["Learn key graph terms", "Practice vertex and edge questions", "Review a graph example"] }
];

let studyPlan = [...defaultPlan];
let selectedDay = 0;

function showPage(pageId) {
  pages.forEach((page) => page.classList.toggle("active-page", page.id === pageId));
  navLinks.forEach((link) => {
    if (link.classList.contains("nav-link")) {
      link.classList.toggle("active", link.dataset.page === pageId);
    }
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const pageId = link.dataset.page;
    if (pageId) showPage(pageId);
  });
});

function renderTasks(dayIndex = 0) {
  const plan = studyPlan[dayIndex];
  todayTopicTitle.textContent = plan.full;
  focusTaskText.textContent = `${plan.full} – Practice Set`;
  tasksCount.textContent = plan.tasks.length;
  taskList.innerHTML = "";

  plan.tasks.forEach((task) => {
    const label = document.createElement("label");
    label.className = "task-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "task-check";

    const span = document.createElement("span");
    span.textContent = task;

    input.addEventListener("change", () => {
      label.classList.toggle("completed", input.checked);
      updateTaskProgress();
    });

    label.appendChild(input);
    label.appendChild(span);
    taskList.appendChild(label);
  });

  updateTaskProgress();
}

function updateTaskProgress() {
  const checks = taskList.querySelectorAll('input[type="checkbox"]');
  const total = checks.length || 1;
  const done = [...checks].filter((check) => check.checked).length;
  const percent = Math.round((done / total) * 100);
  progressValue.textContent = `${percent}%`;

  const overall = Math.max(40, percent);
  profileProgressFill.style.width = `${overall}%`;
  profileProgressText.textContent = `${overall}%`;
  tasksDoneStat.textContent = String(18 + done);
}

const calendarGrid = document.getElementById("calendarGrid");

function renderCalendar() {
  calendarGrid.innerHTML = "";

  studyPlan.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = `day-card ${index === selectedDay ? "active" : ""}`;
    button.dataset.day = String(index);

    button.innerHTML = `
      <span class="day-label">Day ${index + 1}</span>
      <strong>${item.short}</strong>
      ${index === 0 ? '<span class="day-check">✓</span>' : ""}
    `;

    button.addEventListener("click", () => {
      selectedDay = index;
      renderCalendar();
      renderTasks(index);
      showPage("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    calendarGrid.appendChild(button);
  });
}

document.querySelectorAll(".topic-tag").forEach((tag) => {
  tag.addEventListener("click", () => tag.classList.toggle("selected"));
});

const planForm = document.getElementById("planForm");

function parseDateString(value) {
  const [day, month, year] = value.split(".");
  if (!day || !month || !year) return null;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatLongDate(value) {
  const date = parseDateString(value);
  if (!date) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function calculateDaysLeft(value) {
  const examDate = parseDateString(value);
  if (!examDate) return 10;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);
  const diff = examDate.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

planForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const examName = document.getElementById("examName").value.trim() || "Discrete Math Exam";
  const examDate = document.getElementById("examDate").value.trim() || "01.06.2026";
  const level = document.getElementById("level").value;
  const hours = document.getElementById("hoursPerDay").value || "3";
  const selectedTopics = [...document.querySelectorAll(".topic-tag.selected")].map((tag) => tag.textContent.trim());

  if (selectedTopics.length === 0) {
    alert("Please select at least one topic.");
    return;
  }

  studyPlan = selectedTopics.map((topic) => ({
    short: topic.split(" ")[0],
    full: titleCase(topic),
    tasks: [`Learn ${topic.toLowerCase()}`, "Solve practice problems", "Review mistakes"]
  }));

  selectedDay = 0;
  const subject = examName.replace(/exam/i, "").trim();
  const daysLeft = calculateDaysLeft(examDate);

  daysLeftEl.textContent = String(daysLeft);
  profileDaysLeft.textContent = `${daysLeft} days`;
  profileSubject.textContent = subject || "Discrete Math";
  profileExamDate.textContent = formatLongDate(examDate);
  profileLevel.textContent = level;
  profileStudyTime.textContent = `${hours} hours/day`;
  studyHoursValue.textContent = `${hours}h`;
  currentGoalText.textContent = `Prepare for ${examName}`;
  totalHoursStat.textContent = `${Number(hours) * 4}h`;
  completedTopicsStat.textContent = String(Math.min(3, studyPlan.length));

  renderTasks(0);
  renderCalendar();
  showPage("dashboard");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function titleCase(text) {
  return text.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

const noteForm = document.getElementById("noteForm");
const noteTitle = document.getElementById("noteTitle");
const noteText = document.getElementById("noteText");
const notesList = document.getElementById("notesList");

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = noteTitle.value.trim();
  const text = noteText.value.trim();
  if (!title && !text) return;

  if (notesList.classList.contains("empty")) {
    notesList.classList.remove("empty");
    notesList.innerHTML = "";
  }

  const card = document.createElement("article");
  card.className = "saved-note-card";
  card.innerHTML = `<h3>${title || "Untitled Note"}</h3><p>${text || "No text provided."}</p>`;
  notesList.prepend(card);
  noteTitle.value = "";
  noteText.value = "";
});

const timerValue = document.getElementById("timerValue");
const startTimerBtn = document.getElementById("startTimer");
const pauseTimerBtn = document.getElementById("pauseTimer");
const resetTimerBtn = document.getElementById("resetTimer");
let timerSeconds = 25 * 60;
let timerInterval = null;

function updateTimerUI() {
  const minutes = String(Math.floor(timerSeconds / 60)).padStart(2, "0");
  const seconds = String(timerSeconds % 60).padStart(2, "0");
  timerValue.textContent = `${minutes}:${seconds}`;
}

startTimerBtn.addEventListener("click", () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerUI();
    } else {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }, 1000);
});

pauseTimerBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
});

resetTimerBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 25 * 60;
  updateTimerUI();
});

renderTasks(selectedDay);
renderCalendar();
updateTimerUI();
