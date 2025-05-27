// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const tunnel = require('tunnel-ssh');

const app = express();
app.use(cors());
app.use(express.json());

// ===== Konfigurasi SSH Radar =====
const SSH_RADAR = {
  host: '172.20.100.100',
  port: 22,
  username: 'root',
  password: 'eecj8389',
  dstHost: '127.0.0.1',
  dstPort: 3306,
  localHost: '127.0.0.1',
  localPort: 3308
};

// ===== Konfigurasi SSH Genset (opsional jika pakai SSH juga, kalau LAN langsung tanpa tunnel, tidak perlu ini) =====
// Jika koneksi LAN langsung, kita konek langsung di pool Genset tanpa tunnel

let radarPool, gensetPool;

function connectRadarTunnel() {
  return new Promise((resolve, reject) => {
    tunnel(SSH_RADAR, (err, server) => {
      if (err) {
        console.error('❌ Gagal membuat SSH tunnel radar:', err);
        return reject(err);
      }
      console.log('✅ SSH Tunnel radar aktif');

      radarPool = mysql.createPool({
        host: SSH_RADAR.localHost,
        port: SSH_RADAR.localPort,
        user: 'edge',
        password: 'eecRadar',
        database: 'EdgeBite',
        waitForConnections: true,
        connectionLimit: 10,
      });

      radarPool.getConnection((err, connection) => {
        if (err) {
          console.error('❌ Gagal konek MySQL radar:', err);
          return reject(err);
        }
        console.log('✅ Koneksi radar MySQL OK');
        connection.release();
        resolve();
      });
    });
  });
}

function connectGensetDB() {
  return new Promise((resolve, reject) => {
    gensetPool = mysql.createPool({
      host: '192.168.11.201',
      port: 3306,
      user: 'teknisi',
      password: 't3kn1s1!',
      database: 'radmon',
      waitForConnections: true,
      connectionLimit: 10,
    });

    gensetPool.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Gagal konek MySQL genset:', err);
        return reject(err);
      }
      console.log('✅ Koneksi genset MySQL OK');
      connection.release();
      resolve();
    });
  });
}

// ===== Endpoint test
app.get('/test', (req, res) => {
  res.json({ message: 'API backend jalan' });
});

// ===== Endpoint RADAR
app.get('/api/radar/latest', (req, res) => {
  if (!radarPool) return res.status(500).json({ error: 'Radar DB belum siap' });

  radarPool.query('SELECT * FROM ddcbite ORDER BY eid DESC LIMIT 1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Query radar error' });
    if (results.length === 0) return res.status(404).json({ error: 'Data radar tidak ditemukan' });
    res.json(results[0]);
  });
});

// ===== Endpoint GENSET
app.get('/api/genset/latest', (req, res) => {
  if (!gensetPool) return res.status(500).json({ error: 'Genset DB belum siap' });

  gensetPool.query('SELECT * FROM simongen ORDER BY datetime DESC LIMIT 1', (err, results) => {
    if (err) return res.status(500).json({ error: 'Query genset error' });
    if (results.length === 0) return res.status(404).json({ error: 'Data genset tidak ditemukan' });
    res.json(results[0]);
  });
});

// ===== Jalankan server
async function startServer() {
  try {
    await connectRadarTunnel();
    await connectGensetDB();

    const PORT = 4000;
    app.listen(PORT, () => {
      console.log(`🚀 API backend berjalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server gagal start:', err);
  }
}

startServer();
