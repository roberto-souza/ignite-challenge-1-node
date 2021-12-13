const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

let users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  if (users.some(user => user.username === username)) {
    return next();
  }

  return response.status(404).send('User not found');
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  if (users.some(user => user.username === username)) {
    return response.status(400).json({ error: 'User already exists' });
  }
  
  const user = { id: uuidv4(), name, username, todos: [] }
  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const todos = users.find(user => user.username === username)?.todos || [];

  return response.status(200).json(todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { title, deadline } = request.body;

  const todo = { id: uuidv4(), done: false, title, deadline: new Date(deadline), created_at: new Date() };

  users = users.map(user => {
    if (user.username === username) user.todos.push(todo);
    return user;
  })

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { title, deadline } = request.body;
  const { id } = request.params;

  const userIndex = users.findIndex(user => user.username === username);
  const todoIndex = users[userIndex].todos.findIndex(todo => todo.id === id);

  if (!users[userIndex].todos[todoIndex]) {
    return response.status(404).json({ error: 'Todo not found' });
  }

  const todo = { ...users[userIndex].todos[todoIndex], title, deadline: new Date(deadline) };

  users[userIndex].todos[todoIndex] = todo;

  return response.json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;

  const userIndex = users.findIndex(user => user.username === username);
  const todoIndex = users[userIndex].todos.findIndex(todo => todo.id === id);

  if (!users[userIndex].todos[todoIndex]) {
    return response.status(404).json({ error: 'Todo not found' });
  }

  const todo = { ...users[userIndex].todos[todoIndex], done: true };

  users[userIndex].todos[todoIndex] = todo;

  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { id } = request.params;

  const userIndex = users.findIndex(user => user.username === username);
  const todoIndex = users[userIndex].todos.findIndex(todo => todo.id === id);

  if (!users[userIndex].todos[todoIndex]) {
    return response.status(404).json({ error: 'Todo not found' });
  }

  users[userIndex].todos = users[userIndex].todos.filter(todo => todo.id !== id);

  return response.sendStatus(204);
});

module.exports = app;