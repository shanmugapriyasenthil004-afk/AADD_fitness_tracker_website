const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const pub = path.join(__dirname, 'public');

app.use(express.static(pub));

app.get('/', (req, res) => res.sendFile(path.join(pub, 'index.html')));
app.get('/log', (req, res) => res.sendFile(path.join(pub, 'log.html')));
app.get('/history', (req, res) => res.sendFile(path.join(pub, 'history.html')));

app.use((req, res) => res.status(404).send('Page not found'));

app.listen(PORT, () => console.log(`Lane running on http://localhost:${PORT}`));
