const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем кросс-доменные запросы (CORS), чтобы фронтенд мог общаться с бэкендом
app.use(cors());
app.use(express.json());

// Раздача статических файлов фронтенда (HTML, CSS, JS) из корня
app.use(express.static(path.join(__dirname, './')));

// Временная база данных в оперативной памяти (при перезапуске сервера обнуляется)
let tasks = [
  { title: "Binary conversions", desc: "5 practice exercises", done: false },
  { title: "Boolean algebra", desc: "Truth tables & simplification", done: false },
  { title: "Set theory basics", desc: "1 hour review + quiz", done: false },
  { title: "Graph theory intro", desc: "Definitions & examples", done: false },
  { title: "Combinatorics", desc: "Permutations & combinations", done: false }
];

// 1. Получить все задачи
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// 2. Обновить статус задачи (выполнено / не выполнено)
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id >= 0 && id < tasks.length) {
    tasks[id].done = !tasks[id].done;
    res.json({ success: true, tasks });
  } else {
    res.status(404).json({ error: "Задача не найдена" });
  }
});

// 3. Генерация плана (принимает параметры из формы)
app.post('/api/generate', (req, res) => {
  const { examName, examDate, level, hours } = req.body;

  // Здесь можно реализовать логику изменения списка задач в зависимости от уровня
  // Для демонстрации просто отдаем текущий список задач и параметры
  res.json({
    message: `План для ${examName} успешно создан!`,
    tasks: tasks
  });
});

// Все остальные запросы перенаправляем на index.html (для поддержки SPA навигации)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});