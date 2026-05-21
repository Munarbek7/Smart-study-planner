const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// Инициализация локальной JSON базы данных
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {}, plans: {} }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Базовые шаблоны задач по уровням
const taskTemplates = {
  "Beginner": [
    { title: "Binary conversions", desc: "5 practice exercises", done: false },
    { title: "Set theory basics", desc: "1 hour review", done: false }
  ],
  "Intermediate": [
    { title: "Boolean algebra", desc: "Truth tables & simplification", done: false },
    { title: "Graph theory intro", desc: "Definitions & examples", done: false }
  ],
  "Advanced": [
    { title: "Combinatorics", desc: "Permutations & combinations", done: false },
    { title: "Pumping Lemma", desc: "Formal languages proof", done: false }
  ]
};

// API: Регистрация / Логин
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Заполните все поля" });
  }

  const db = readDB();

  // Если пользователя нет — регистрируем его (для простоты)
  if (!db.users[username]) {
    db.users[username] = { password, createdAt: new Date() };
    // Создаем дефолтный план
    db.plans[username] = {
      examName: "Discrete Math",
      daysLeft: 10,
      tasks: [...taskTemplates["Intermediate"]]
    };
    writeDB(db);
    return res.json({ success: true, username, message: "Пользователь успешно зарегистрирован!" });
  }

  // Проверка пароля
  if (db.users[username].password !== password) {
    return res.status(401).json({ error: "Неверный пароль" });
  }

  res.json({ success: true, username, message: "Успешный вход!" });
});

// API: Получить задачи авторизованного пользователя
app.get('/api/tasks', (req, res) => {
  const username = req.headers['x-user'];
  if (!username) return res.status(401).json({ error: "Неавторизован" });

  const db = readDB();
  const userPlan = db.plans[username] || { examName: "No Exam", daysLeft: 0, tasks: [] };
  res.json(userPlan.tasks);
});

// API: Обновить статус задачи пользователя
app.put('/api/tasks/:id', (req, res) => {
  const username = req.headers['x-user'];
  const taskId = parseInt(req.params.id);
  if (!username) return res.status(401).json({ error: "Неавторизован" });

  const db = readDB();
  if (db.plans[username] && db.plans[username].tasks[taskId] !== undefined) {
    db.plans[username].tasks[taskId].done = !db.plans[username].tasks[taskId].done;
    writeDB(db);
    res.json({ success: true, tasks: db.plans[username].tasks });
  } else {
    res.status(404).json({ error: "Задача не найдена" });
  }
});

// API: Сгенерировать новый план для пользователя
app.post('/api/generate', (req, res) => {
  const username = req.headers['x-user'];
  if (!username) return res.status(401).json({ error: "Неавторизован" });

  const { examName, examDate, level } = req.body;
  const examDateObj = new Date(examDate);
  const today = new Date();
  const diff = Math.ceil((examDateObj - today) / (1000 * 60 * 60 * 24));

  const db = readDB();
  const selectedTemplate = taskTemplates[level] || taskTemplates["Intermediate"];

  db.plans[username] = {
    examName: examName || "Exam",
    daysLeft: diff > 0 ? diff : 10,
    tasks: selectedTemplate.map(t => ({ ...t, done: false }))
  };

  writeDB(db);
  res.json({ success: true, tasks: db.plans[username].tasks, daysLeft: db.plans[username].daysLeft });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на портах: ${PORT}`);
});