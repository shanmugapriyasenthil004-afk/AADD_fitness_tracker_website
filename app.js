(() => {
  const KEY = 'lane.workouts', GOAL_KEY = 'lane.goal';
  const $ = id => document.getElementById(id);

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = list => localStorage.setItem(KEY, JSON.stringify(list));
  const getGoal = () => Number(localStorage.getItem(GOAL_KEY)) || 30;

  const pad = n => String(n).padStart(2, '0');
  const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const daysAgo = n => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - n); return d; };

  function minutesByDay(list) {
    const m = {};
    list.forEach(w => { m[w.date] = (m[w.date] || 0) + w.minutes; });
    return m;
  }

  function renderToday(list) {
    if (!$('today-min')) return;
    const goal = getGoal(), mins = minutesByDay(list)[key(new Date())] || 0;
    const pct = Math.min(100, (mins / goal) * 100);
    $('today-min').textContent = mins;
    $('goal-line').textContent = `of ${goal} min`;
    if ($('progress')) $('progress').style.strokeDasharray = `${pct} 100`;
    if ($('goal')) $('goal').value = goal;
    if ($('verdict')) $('verdict').textContent =
      mins >= goal ? 'Goal smashed today 🎉' :
      mins > 0 ? `${goal - mins} min to go` : 'No workout yet today';
  }

  function renderStats(list) {
    if (!$('streak')) return;
    const m = minutesByDay(list);
    let streak = 0, i = m[key(daysAgo(0))] ? 0 : 1;
    while (m[key(daysAgo(i))]) { streak++; i++; }
    $('streak').textContent = streak;

    const now = new Date(), dow = (now.getDay() + 6) % 7; // Monday start
    const start = key(daysAgo(dow));
    const wk = list.filter(w => w.date >= start);
    $('wk-min').textContent = wk.reduce((s, w) => s + w.minutes, 0);
    $('wk-cal').textContent = wk.reduce((s, w) => s + (w.calories || 0), 0);
  }

  function renderBars(list) {
    const el = $('bars'); if (!el) return;
    const m = minutesByDay(list), days = [];
    for (let i = 6; i >= 0; i--) days.push(daysAgo(i));
    const max = Math.max(30, ...days.map(d => m[key(d)] || 0));
    el.innerHTML = '';
    days.forEach(d => {
      const v = m[key(d)] || 0;
      const col = document.createElement('div'); col.className = 'bar-col';
      const bar = document.createElement('i'); bar.style.height = `${(v / max) * 100}%`;
      const lbl = document.createElement('span');
      lbl.textContent = d.toLocaleDateString('en', { weekday: 'short' });
      col.append(bar, lbl); el.append(col);
    });
  }

  function renderHeat(list) {
    const el = $('heat'); if (!el) return;
    const m = minutesByDay(list);
    const today = new Date(); today.setHours(0,0,0,0);
    const dow = (today.getDay() + 6) % 7;
    const total = 12 * 7, lastIdx = total - 1 - (6 - dow);
    el.innerHTML = '';
    for (let c = 0; c < total; c++) {
      const cell = document.createElement('div'); cell.className = 'cell';
      const offset = lastIdx - c;
      if (offset >= 0) {
        const d = daysAgo(offset), v = m[key(d)] || 0;
        const lvl = v === 0 ? 0 : v < 20 ? 1 : v < 40 ? 2 : v < 60 ? 3 : 4;
        if (lvl) cell.classList.add('l' + lvl);
        cell.title = `${key(d)}: ${v} min`;
      } else cell.style.visibility = 'hidden';
      el.append(cell);
    }
  }

  function renderList(list) {
    const el = $('list'); if (!el) return;
    el.innerHTML = '';
    if (!list.length) { el.innerHTML = '<li>No workouts yet.</li>'; return; }
    [...list].sort((a, b) => b.date.localeCompare(a.date)).forEach(w => {
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = `${w.date} · ${w.type} · ${w.minutes} min` +
        (w.calories ? ` · ${w.calories} kcal` : '') + (w.note ? ` — ${w.note}` : '');
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.onclick = () => { save(load().filter(x => x.id !== w.id)); render(); };
      li.append(text, del); el.append(li);
    });
  }

  function render() {
    const list = load();
    renderToday(list); renderStats(list); renderBars(list); renderHeat(list); renderList(list);
  }

  // header date
  if ($('today-label'))
    $('today-label').textContent = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

  // goal input (dashboard)
  if ($('goal')) $('goal').addEventListener('change', e => {
    const v = Math.max(5, Math.min(600, Number(e.target.value) || 30));
    localStorage.setItem(GOAL_KEY, v); render();
  });

  // log form (log page)
  const form = $('form');
  if (form) {
    form.date.value = key(new Date());
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form), minutes = Number(f.get('minutes'));
      if (!(minutes > 0)) { $('err').textContent = 'Enter valid minutes.'; return; }
      const list = load();
      list.push({
        id: Date.now().toString(36), type: f.get('type').trim(),
        minutes, calories: Number(f.get('calories')) || 0,
        date: f.get('date'), note: (f.get('note') || '').trim()
      });
      save(list);
      window.location.href = '/history';
    });
  }

  render();
})();
