const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const FILE = path.join(__dirname, 'data.json');

const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; } };
const write = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/workouts', (req, res) => res.json(read()));

app.post('/api/workouts', (req, res) => {
  const { type, minutes, calories, date, note } = req.body;
  const m = Number(minutes), c = Number(calories || 0);
  if (!type || !(m > 0) || !(c >= 0)) {
    return res.status(400).json({ error: 'Add an activity and minutes greater than 0.' });
  }
  const w = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: String(type).slice(0, 30),
    minutes: m,
    calories: c,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10),
    note: String(note || '').slice(0, 100)
  };
  const all = read(); all.push(w); write(all);
  res.status(201).json(w);
});

app.delete('/api/workouts/:id', (req, res) => {
  write(read().filter((w) => w.id !== req.params.id));
  res.status(204).end();
});

app.listen(PORT, () => console.log(`Lane running on http://localhost:${PORT}`));
