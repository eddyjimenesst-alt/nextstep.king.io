const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios'); // 👈 IMPORTANTE

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./database.db');

// TABLAS
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    type TEXT,
    company TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    opportunity_id INTEGER
  )`);
});

// REGISTER
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  db.run(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, password],
    function (err) {
      if (err) return res.json({ success: false, message: "Usuario ya existe" });
      res.json({ success: true });
    }
  );
});

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, user) => {
      if (user) res.json({ success: true, user });
      else res.json({ success: false });
    }
  );
});

// 🔥 TRABAJOS REALES CON API (ADZUNA)
app.get('/jobs', async (req, res) => {
  try {
    const APP_ID = "920a068a";
    const APP_KEY = "c7c7507d0748a506499f392943c063d0";

    const url = `https://api.adzuna.com/v1/api/jobs/do/search/1?app_id=${APP_ID}&app_key=${APP_KEY}&results_per_page=10&what=junior`;

    const response = await axios.get(url);

    let jobs = response.data.results.map(job => ({
      title: job.title,
      company: job.company.display_name,
      link: job.redirect_url
    }));

    if (jobs.length === 0) {
      jobs = [
        {
          title: "Pasantía en ITLA",
          company: "ITLA",
          link: "https://itla.edu.do"
        },
        {
          title: "Programa Primer Empleo",
          company: "Ministerio de Trabajo",
          link: "https://mt.gob.do"
        }
      ];
    }

    res.json(jobs);

  } catch (error) {
    console.log("Error API:", error.message);

    res.json([
      {
        title: "No se pudieron cargar empleos reales",
        company: "Sistema",
        link: "https://do.linkedin.com/jobs/santo-domingo-empleos"
      }
    ]);
  }
});

// HOME
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => console.log('NextStep funcionando en http://localhost:3000'));