const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(bodyParser.json());

// Load data from file
const loadData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
};

// Save data to file
const saveData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Get all todos
app.get('/api/todos', (req, res) => {
  const todos = loadData();
  res.json(todos);
});

// Update all todos (for reordering)
app.put('/api/todos/reorder', (req, res) => {
  const newOrder = req.body;
  saveData(newOrder);
  res.json(newOrder);
});

// Add a new todo
app.post('/api/todos', (req, res) => {
  const todos = loadData();
  const newTodo = {
    id: Date.now(),
    text: req.body.text,
    completed: false,
    category: req.body.category || '개인',
    createdAt: new Date().toISOString()
  };
  todos.push(newTodo);
  saveData(todos);
  res.status(201).json(newTodo);
});

// Update a todo (toggle complete)
app.patch('/api/todos/:id', (req, res) => {
  const todos = loadData();
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);
  
  if (index !== -1) {
    todos[index].completed = !todos[index].completed;
    if (todos[index].completed) {
      todos[index].completedAt = new Date().toISOString();
    } else {
      delete todos[index].completedAt;
    }
    saveData(todos);
    res.json(todos[index]);
  } else {
    res.status(404).send('Todo not found');
  }
});

// Update a todo text and category (Edit)
app.put('/api/todos/:id', (req, res) => {
  const todos = loadData();
  const id = parseInt(req.params.id);
  const index = todos.findIndex(t => t.id === id);
  
  if (index !== -1) {
    if (req.body.text !== undefined) todos[index].text = req.body.text;
    if (req.body.category !== undefined) todos[index].category = req.body.category;
    saveData(todos);
    res.json(todos[index]);
  } else {
    res.status(404).send('Todo not found');
  }
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  const todos = loadData();
  const id = parseInt(req.params.id);
  const updatedTodos = todos.filter(t => t.id !== id);
  
  if (todos.length !== updatedTodos.length) {
    saveData(updatedTodos);
    res.status(204).send();
  } else {
    res.status(404).send('Todo not found');
  }
});

// --- 서버 가동 카운터 설정 (Hot Reload 확인용) ---
let restartCount = 0;
const fs_count = path.join(__dirname, '.restart_count');
if (fs.existsSync(fs_count)) {
  restartCount = parseInt(fs.readFileSync(fs_count, 'utf8')) || 0;
}
restartCount++;
fs.writeFileSync(fs_count, restartCount.toString());

app.listen(PORT, () => {
  const time = new Date().toLocaleTimeString();
  console.log(`\x1b[36m[TaskFlow] 서버 가동 중 (총 ${restartCount}회 업데이트됨) - 마지막: ${time}\x1b[0m`);
});
