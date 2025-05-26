const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const tunnelSSH = require('tunnel-ssh');

const app = express();
app.use(cors());
app.use(express.json());

const configSSH = {
  username: 'root',
  host: '172.20.100.100',
  port: 22,
  password: 'eecj8389',
  dstHost: '127.0.0.1',
  dstPort: 3306,
  localHost: '127.0.0.1',
  localPort: 3308,
};

let pool;

// Fungsi untuk buat koneksi pool mysql lewat tunnel ssh
function createPool() {
  pool = mysql.createPool({
    host: configSSH.localHost,
    port: configSSH.localPort,
    user: 'edge',
    password: 'eecRadar',
    database: 'EdgeBite',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // 10 detik timeout
  });
}

tunnelSSH(configSSH, (error, server) => {
  if (error) {
    console.error('SSH Tunnel error:', error);
    process.exit(1);
  }
  console.log('SSH Tunnel connected.');

  createPool();

  // Tes koneksi pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Gagal koneksi ke MySQL lewat tunnel:', err);
      process.exit(1);
    }
    console.log('Berhasil koneksi ke MySQL lewat tunnel');
    connection.release();
  });

  // Baru listen setelah tunnel siap
  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`Backend API berjalan di http://localhost:${PORT}`);
  });
});

// Endpoint test sederhana supaya bisa cek backend jalan
app.get('/test', (req, res) => {
  res.json({ message: 'API backend berjalan dengan baik' });
});

// Endpoint ambil data
app.get('/api/data', (req, res) => {
  if (!pool) return res.status(500).json({ error: 'Database belum terkoneksi' });

  const query = 'SELECT * FROM ddcbite ORDER BY time DESC LIMIT 100';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error query:', err);
      return res.status(500).json({ error: 'Database query error' });
    }
    console.log('Query results count:', results.length);
    // Balik data supaya waktu lama di depan, terbaru di belakang (sesuai kebutuhan grafik)
    res.json(results.reverse());
  });
});
