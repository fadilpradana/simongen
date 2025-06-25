const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// Koneksi ke database Radar
// ==============================
const radarPool = mysql.createPool({
  host: '172.20.100.100',
  port: 3306,
  user: 'edge',
  password: 'eecRadar',
  database: 'EdgeBite',
  waitForConnections: true,
  connectionLimit: 10,
});

// ==============================
// Koneksi ke database Genset
// ==============================
const gensetPool = mysql.createPool({
  host: '192.168.11.201',
  port: 3306,
  user: 'teknisi',
  password: 't3kn1s1!',
  database: 'radmon',
  waitForConnections: true,
  connectionLimit: 10,
});

// ==============================
// Endpoint uji koneksi backend
// ==============================
app.get('/test', (req, res) => {
  res.json({ message: 'API backend jalan' });
});

// ==============================
// Endpoint data terbaru dari Radar
// ==============================
app.get('/api/radar/latest', (req, res) => {
  radarPool.query('SELECT * FROM ddcbite ORDER BY eid DESC LIMIT 1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Query radar error', detail: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Data radar tidak ditemukan' });
    res.json(results[0]);
  });
});

// ==============================
// Endpoint data terbaru dari Genset
// ==============================
app.get('/api/genset/latest', (req, res) => {
  gensetPool.query('SELECT * FROM simongen ORDER BY datetime DESC LIMIT 1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Query genset error', detail: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Data genset tidak ditemukan' });
    res.json(results[0]);
  });
});

// ==============================
// Endpoint grafik data radar (rentang waktu)
// Contoh panggilan: /api/radar/grafik?start=2025-05-25T00:00:00&end=2025-05-28T23:59:59
// ==============================
app.get('/api/radar/grafik', (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Parameter "start" dan "end" wajib diisi (format ISO: YYYY-MM-DDTHH:mm:ss)' });
  }

  const query = `
    SELECT *
    FROM ddcbite
    WHERE waktu BETWEEN ? AND ?
    ORDER BY waktu ASC
  `;

  radarPool.query(query, [start, end], (err, results) => {
    if (err) return res.status(500).json({ error: 'Query grafik radar error', detail: err.message });
    res.json(results);
  });
});

// Ambil data radar 1 jam terakhir
app.get('/api/radar/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 20; // default 20
  radarPool.query(
    `SELECT * FROM ddcbite WHERE time >= NOW() - INTERVAL 1 HOUR ORDER BY time ASC LIMIT ?`,
    [limit],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Query history error', detail: err.message });
      res.json(results);
    }
  );
});



// ==============================
// Jalankan server
// ==============================
const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API backend berjalan di http://0.0.0.0:${PORT}`);
});
