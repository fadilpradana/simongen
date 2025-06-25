import { useEffect, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../index.css";

export default function App() {
  const [currentData, setCurrentData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [showChartPage, setShowChartPage] = useState(false);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/genset/latest");
      if (!response.ok) throw new Error("Failed to fetch data");
      const json = await response.json();
      setCurrentData(json);
      setGraphData((prev) => {
        const newData = [
          ...prev,
          {
            time: new Date(json.datetime).toLocaleTimeString(),
            teg_r: Number(json.vr),
            teg_s: Number(json.vs),
            teg_t: Number(json.vt),
            solar: Number(json.tangki),
            genset: Number(json.genset), // Tambahkan genset ke graphData
          },
        ];
        if (newData.length > 20) newData.shift();
        return newData;
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleLogout = () => (window.location.href = "/");
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const isNormal = (val) => val >= 210 && val <= 230;

  return (
    <div
      className={`${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      } min-h-screen relative transition-colors duration-700`}
    >
      {/* Logo kiri atas */}
      <div className="fixed top-4 left-4 flex items-center gap-3 z-50">
        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
          <img
            src="/logobmkglight.png"
            alt="Logo BMKG Light"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${
              darkMode ? "opacity-100" : "opacity-0"
            }`}
          />
          <img
            src="/logobmkg.png"
            alt="Logo BMKG"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${
              darkMode ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>
        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
          <img
            src="/logostmkg.png"
            alt="Logo STMKG"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Tombol Radar, Dark Mode, Logout kanan atas */}
      <div className="fixed top-4 right-4 flex gap-2 items-center z-50">
        <button
          onClick={() => navigate("/radar")}
          className="px-4 py-2 rounded-md font-semibold text-white bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:brightness-110 transition"
          title="Monitoring Radar"
        >
          Radar
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 dark:bg-gray-300 dark:hover:bg-gray-400 transition-colors duration-300"
          title="Toggle Dark Mode"
        >
          💡
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors duration-300"
          title="Logout"
        >
          Logout
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showChartPage ? (
          <ChartPage graphData={graphData} setShowChartPage={setShowChartPage} darkMode={darkMode} />
        ) : (
          <>
            <Header />
            {!currentData ? (
              <div className="text-center mt-20 font-semibold text-lg">
                Memuat data...
              </div>
            ) : (
              <HomePage
                currentData={currentData}
                setShowChartPage={setShowChartPage}
                isNormal={isNormal}
                darkMode={darkMode}
                navigate={navigate}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header() {
  return (
    <header className="pt-24 pb-6 max-w-4xl mx-auto text-center">
      <h1 className="font-extrabold text-3xl sm:text-4xl">
        <div>Monitoring Genset</div>
        <div className="text-xl sm:text-2xl font-normal mt-1">
          Stasiun Meteorologi Kelas I Soekarno Hatta
        </div>
      </h1>
    </header>
  );
}

// Tambahkan prop darkMode ke ChartPage
function ChartPage({ graphData, setShowChartPage, darkMode }) {
  // Tambahkan warna stroke yang berbeda untuk genset jika diperlukan
  const getLineColor = (key) => {
    if (key === "genset") {
      return darkMode ? "#ADD8E6" : "#4682B4"; // Warna light blue untuk genset
    }
    // Warna default untuk yang lain
    switch (key) {
      case "teg_r": return "#8884d8";
      case "teg_s": return "#82ca9d";
      case "teg_t": return "#ffc658";
      case "solar": return "#ff7300";
      default: return "#cccccc";
    }
  };

  const axisTickColor = darkMode ? "#fff" : "#000";

  return (
    <motion.main
      key="chart"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="flex flex-col items-center justify-start min-h-screen px-4 pt-24 pb-20 gap-6 max-w-5xl mx-auto"
    >
      <h1 className="text-center font-extrabold text-3xl sm:text-4xl mb-6">
        Grafik Genset Soekarno Hatta
      </h1>

      <div className={`w-full h-80 rounded-lg p-4 transition-colors duration-700
          ${darkMode ? "bg-white/5 border border-white/10" : "bg-gray-100/70 border border-gray-300"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#ccc"} />
            <XAxis dataKey="time" tick={{ fill: axisTickColor }} />
            <YAxis tick={{ fill: axisTickColor }} />
            <Tooltip contentStyle={{ backgroundColor: darkMode ? "#333" : "#fff", borderColor: darkMode ? "#555" : "#ddd", color: darkMode ? "#fff" : "#000" }} />
            <Legend />
            <Line
              type="monotone"
              dataKey="teg_r"
              stroke={getLineColor("teg_r")}
              name="Tegangan R"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="teg_s"
              stroke={getLineColor("teg_s")}
              name="Tegangan S"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="teg_t"
              stroke={getLineColor("teg_t")}
              name="Tegangan T"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="solar"
              stroke={getLineColor("solar")}
              name="Solar"
              dot={false}
            />
             <Line
              type="monotone"
              dataKey="genset"
              stroke={getLineColor("genset")} // Menggunakan warna yang berbeda untuk genset
              name="Backup Fuel"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <button
        onClick={() => setShowChartPage(false)}
        className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
      >
        Kembali
      </button>
    </motion.main>
  );
}


function HomePage({ currentData, setShowChartPage, isNormal, darkMode }) {
  const { vr, vs, vt, tangki, genset, statgenset, statpompa, datetime } = currentData;
  const solarLevel = Math.min(Math.max(tangki, 0), 100); // Pastikan antara 0-100
  const backupFuelLevel = Math.min(Math.max(genset, 0), 100); // Data genset untuk backup fuel

  return (
    <motion.main
      key="home"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="flex flex-col items-center justify-start min-h-screen px-4 pb-20 gap-6 max-w-4xl mx-auto"
    >
      <div className="flex justify-center items-end gap-8 mb-6 flex-wrap"> {/* flex-wrap untuk responsif */}
        {["r", "s", "t"].map((phase) => {
          const val = currentData[`v${phase}`];
          return (
            <div
              key={phase}
              className="flex flex-col items-center m-2 min-w-[88px]"
            >
              <div
                className={`relative group w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex items-center justify-center text-lg sm:text-xl font-bold
                ${
                  isNormal(+val)
                    ? "border-green-400"
                    : "border-yellow-400 pulse"
                }
                bg-opacity-10 backdrop-blur-md cursor-pointer transition-transform duration-300 hover:scale-110`}
              >
                {val} V
                <div className="tooltip-popup absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="font-semibold mb-1">
                    Tegangan {phase.toUpperCase()}
                  </div>
                  <div>{val} Volt</div>
                </div>
              </div>
              <p className="mt-1 font-bold text-md sm:text-lg">{phase.toUpperCase()}</p>
            </div>
          );
        })}

        {/* Tangki solar visual */}
        <div className="flex flex-col items-center m-2 min-w-[88px]">
          <div
            className={`relative group w-16 h-32 rounded-lg overflow-hidden transition-colors duration-700 ${
              darkMode ? "bg-gray-800" : "bg-gray-200"
            } cursor-pointer`}
          >
            <div
              className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${
                solarLevel < 20 ? "bg-red-500" : darkMode ? "bg-gray-100" : "bg-gray-900"
              }`}
              style={{ height: `${solarLevel}%` }}
            />
            <div
              className={`absolute inset-0 flex items-center justify-center font-bold transition-colors duration-700 ${
                darkMode ? "text-black" : "text-white"
              }`}
            >
              {solarLevel}L
            </div>

            {/* Tooltip */}
            <div className="tooltip-popup absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="font-semibold mb-1">Level Solar Tangki Utama</div>
              <div>{solarLevel}%</div>
            </div>
          </div>
          <p className="mt-2 font-bold text-md sm:text-lg">Solar</p>
        </div>

        {/* --- VISUAL BACKUP FUEL BARU --- */}
        <div className="flex flex-col items-center m-2 min-w-[88px]">
          <div
            className={`relative group w-16 h-32 rounded-lg overflow-hidden transition-colors duration-700 ${
              darkMode ? "bg-gray-800" : "bg-gray-200"
            } cursor-pointer`}
          >
            <div
              className={`absolute bottom-0 left-0 w-full transition-all duration-500 ${
                backupFuelLevel < 20 ? "bg-red-500" : darkMode ? "bg-gray-100" : "bg-gray-900"
              }`}
              style={{ height: `${backupFuelLevel}%` }}
            />
            <div
              className={`absolute inset-0 flex items-center justify-center font-bold transition-colors duration-700 ${
                darkMode ? "text-black" : "text-white"
              }`}
            >
              {backupFuelLevel}L
            </div>

            {/* Tooltip */}
            <div className="tooltip-popup absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="font-semibold mb-1">Level Solar Cadangan</div>
              <div>{backupFuelLevel}%</div>
            </div>
          </div>
          <p className="mt-2 font-bold text-md sm:text-lg">Cadangan</p> {/* Label untuk Backup Fuel */}
        </div>
        {/* --- AKHIR VISUAL BACKUP FUEL --- */}

      </div>

      {/* Status genset, pompa, waktu */}
      <div className="text-center mb-6 space-x-4 text-sm sm:text-base">
        <span>
          <span className="font-semibold">Status Genset:</span>{" "}
          {statgenset === 1 ? "ON" : "OFF"}
        </span>
        <span>
          <span className="font-semibold">Status Pompa:</span>{" "}
          {statpompa === 1 ? "ON" : "OFF"}
        </span>
        <span>
          <span className="font-semibold">Waktu:</span>{" "}
          {new Date(datetime).toLocaleString()}
        </span>
      </div>

      <button
        onClick={() => setShowChartPage(true)}
        className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 via-cyan-600 to-blue-600 hover:brightness-110 transition"
      >
        Lihat Grafik
      </button>
    </motion.main>
  );
}