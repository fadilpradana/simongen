import { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const PARAMETERS_CONFIG = [
  { label: 'Forward Power', index: 27, unit: 'Power', color: '#2563eb' }, // blue-600
  { label: 'Reverse Power', index: 28, unit: 'Power', color: '#16a34a' }, // green-600
  { label: 'Cabinet Temp', index: 16, unit: '°C', color: '#dc2626' }, // red-600
  { label: 'Hot Box Temp', index: 17, unit: '°C', color: '#f97316' }, // orange-500
  { label: 'HVPS V', index: 20, unit: 'V', color: '#7c3aed' }, // purple-700
  { label: 'HVPS I', index: 21, unit: 'I', color: '#92400e' }, // amber-900 brownish
  { label: 'MAG I', index: 22, unit: 'I', color: '#db2777' }, // pink-600 magenta-ish
  { label: 'VSWR', index: 29, unit: 'Ratio', color: '#0891b2' }, // cyan-600
];

// Simple loading spinner component
const Spinner = () => (
  <div className="flex justify-center mt-20">
    <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
  </div>
);

const MonitoringRadar = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const previousDataRef = useRef(null);

  useEffect(() => {
    let isMounted = true; // Untuk mencegah update state jika component sudah unmounted

    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/data');
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const json = await res.json();

        if (isMounted) {
          // Update data hanya jika berbeda dari sebelumnya
          if (JSON.stringify(json) !== JSON.stringify(previousDataRef.current)) {
            setData(json);
            previousDataRef.current = json;
          }
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Gagal memuat data, coba refresh atau periksa koneksi.');
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <Spinner />;

  if (error)
    return (
      <div className="text-red-500 text-center mt-10">
        {error}
      </div>
    );

  // Ambil 20 data terakhir dan balik urutan agar waktu terbaru di kanan grafik
  const latestData = data.slice(-20).reverse();

  // Labels: waktu dari setiap data
  const labels = latestData.map((row) => row.time);

  // Dataset untuk setiap parameter
  const datasets = PARAMETERS_CONFIG.map(({ label, index, color }) => ({
    label,
    data: latestData.map((row) => Number(row[index]) ?? 0),
    borderColor: color,
    backgroundColor: color + '88', // semi-transparent fill color
    tension: 0.3,
    fill: false,
    pointRadius: 3,
    borderWidth: 2,
  }));

  const chartData = { labels, datasets };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 12, boxWidth: 15, boxHeight: 15, font: { size: 14 } },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.75)',
      },
    },
    scales: {
      x: {
        ticks: { color: '#eee', maxRotation: 30, minRotation: 20, maxTicksLimit: 10 },
        grid: { color: '#444' },
      },
      y: {
        ticks: { color: '#eee' },
        grid: { color: '#444' },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans max-w-7xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-center tracking-wide">
        Monitoring Radar Genset
      </h1>

      <div className="bg-gray-800 p-6 rounded-xl shadow-xl" style={{ height: '400px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4 border-b border-gray-700 pb-2">
        Data Terbaru
      </h2>

      <div className="overflow-x-auto rounded-lg shadow-lg">
        <table className="w-full table-auto border-collapse border border-gray-700 text-sm">
          <thead className="bg-gray-700">
            <tr>
              <th className="border border-gray-600 px-3 py-2 text-left">Waktu</th>
              {PARAMETERS_CONFIG.map(({ label, unit }) => (
                <th key={label} className="border border-gray-600 px-3 py-2 text-center whitespace-nowrap">
                  {label} ({unit})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {latestData.map((row, i) => (
              <tr
                key={i}
                className={`hover:bg-gray-700 ${i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}`}
              >
                <td className="border border-gray-700 px-3 py-2 font-mono">{row.time}</td>
                {PARAMETERS_CONFIG.map(({ index }) => (
                  <td
                    key={index}
                    className="border border-gray-700 px-3 py-2 text-center font-mono"
                  >
                    {row[index] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="text-center mt-12 text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Monitoring Radar Genset
      </footer>
    </div>
  );
};

export default MonitoringRadar;
