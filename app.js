const $ = (s) => document.querySelector(s);
const iso = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const TODAY = iso(new Date());
let workouts = [];
let goal = Number(localStorage.getItem('lane-goal')) || 30;

$('#today-label').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
$('#goal').value = goal;
$('#form').date.value = TODAY;

async function load() {
  try { workouts = await (await fetch('/api/workouts')).json(); } catch { workouts = []; }
  render();
}

const minutesOn = (date) => workouts.filter((w) => w.date === date).reduce((s, w) => s + w.minutes, 0);

function render() {
  const todayMin = minutesOn(TODAY);
  $('#today-min').textContent = todayMin;
  $('#goal-line').textContent = `of ${goal} min`;
  const pct = Math.min(100, Math.round((todayMin / goal) * 100));
  $('#progress').style.strokeDasharray = `${pct} 100`;
  $('#verdict').textContent = todayMin === 0 ? 'Log a workout to start your lap.'
    : pct >= 100 ? 'Goal reached. Lap complete!' : `${goal - todayMin} min to finish the lap.`;

  // streak (today may still be empty)
  let streak = 0, d = new Date();
  if (!minutesOn(TODAY)) d = addDays(d, -1);
  while (minutesOn(iso(d)) > 0) { streak++; d = addDays(d, -1); }
  $('#streak').textContent = streak;

  const week = Array.from({ length: 7 }, (_, i) => iso(addDays(new Date(), i - 6)));
  $('#wk-min').textContent = week.reduce((s, x) => s + minutesOn(x), 0);
  $('#wk-cal').textContent = workouts.filter((w) => week.includes(w.date)).reduce((s, w) => s + w.calories, 0);

  const max = Math.max(goal, ...week.map(minutesOn));
  $('#bars').innerHTML = week.map((x) => {
    const m = minutesOn(x);
    const day = new Date(x + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' });
    return `<div class="bar ${x === TODAY ? 'today' : ''}" title="${m} min"><i style="height:${(m / max) * 100}%"></i><span>${day}</span></div>`;
  }).join('');

  $('#heat').innerHTML = Array.from({ length: 84 }, (_, i) => {
    const x = iso(addDays(new Date(), i - 83)), m = minutesOn(x);
    const l = m === 0 ? '' : m < 20 ? 'l1' : m < 40 ? 'l2' : m < 60 ? 'l3' : 'l4';
    return `<i class="${l}" title="${x}: ${m} min"></i>`;
  }).join('');

  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const list = $('#list');
  list.innerHTML = '';
  if (!sorted.length) { list.innerHTML = '<li class="empty">No workouts yet. Save your first one above.</li>'; return; }
  sorted.forEach((w) => {
    const li = document.createElement('li');
    const b = document.createElement('b'); b.textContent = `${w.type} · ${w.minutes} min`;
    const s = document.createElement('small');
    s.textContent = `${w.date} · ${w.calories} kcal${w.note ? ' · ' + w.note : ''}`;
    const btn = document.createElement('button'); btn.textContent = 'Delete';
    btn.onclick = async () => { await fetch('/api/workouts/' + w.id, { method: 'DELETE' }); load(); };
    li.append(b, s, btn); list.append(li);
  });
}

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const body = Object.fromEntries(new FormData(f));
  const res = await fetch('/api/workouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { $('#err').textContent = (await res.json()).error; return; }
  $('#err').textContent = '';
  f.reset(); f.date.value = TODAY;
  load();
});

$('#goal').addEventListener('input', (e) => {
  goal = Math.max(5, Number(e.target.value) || 30);
  localStorage.setItem('lane-goal', goal);
  render();
});

load();
