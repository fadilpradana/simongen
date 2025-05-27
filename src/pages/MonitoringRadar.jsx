import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function MonitoringRadar() {
  const [data, setData] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const navigate = useNavigate();

  const fetchLatestData = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/radar/latest");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error fetching radar data:", error);
    }
  };

  useEffect(() => {
    fetchLatestData();
    const interval = setInterval(fetchLatestData, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => (window.location.href = "/");
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const goToGenset = () => navigate("/genset");

  const importantKeys = [
    "el",
    "az",
    "cab_temp",
    "hot_box_temp",
    "forward_pwr",
    "reverse_pwr",
    "vswr",
    "az_motor_error",
    "el_motor_error",
  ];

  const keyTitles = {
    el: "Elevasi Sudut",
    az: "Azimuth Sudut",
    cab_temp: "Suhu Kabinet (°C)",
    hot_box_temp: "Suhu Hot Box (°C)",
    forward_pwr: "Daya Maju (W)",
    reverse_pwr: "Daya Mundur (W)",
    vswr: "VSWR",
    az_motor_error: "Error Motor Azimuth",
    el_motor_error: "Error Motor Elevasi",
  };

  const getStatusColor = (key, value) => {
    if (key.includes("error")) return value ? "bg-red-600" : "bg-green-600";
    if (key === "vswr")
      return value > 2
        ? "bg-red-600"
        : value > 1.5
        ? "bg-yellow-500"
        : "bg-green-600";
    if (key.includes("temp"))
      return value > 60
        ? "bg-red-600"
        : value > 40
        ? "bg-yellow-500"
        : "bg-green-600";
    if (key.includes("pwr")) return value > 100 ? "bg-red-600" : "bg-green-600";
    if (key === "az" || key === "el") return "bg-green-600";
    return "bg-gray-500";
  };

  const formatUTCDateTime12h = (utcString) => {
    if (!utcString) return "—";
    const dt = new Date(utcString);

    const day = dt.getUTCDate().toString().padStart(2, "0");
    const month = (dt.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = dt.getUTCFullYear();

    let hours = dt.getUTCHours();
    const minutes = dt.getUTCMinutes().toString().padStart(2, "0");
    const seconds = dt.getUTCSeconds().toString().padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;

    const hourStr = hours.toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hourStr}:${minutes}:${seconds} ${ampm} UTC`;
  };

  return (
    <div
      className={`${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      } transition-colors duration-700 min-h-screen relative`}
      style={{ overflowY: "auto" }}
    >
      {/* Logo kiri atas */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
        <div className="relative w-10 h-10">
          <img
            src="/logobmkglight.png"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${
              darkMode ? "opacity-100" : "opacity-0"
            }`}
            alt="Logo BMKG Light"
          />
          <img
            src="/logobmkg.png"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${
              darkMode ? "opacity-0" : "opacity-100"
            }`}
            alt="Logo BMKG Dark"
          />
        </div>
        <div className="relative w-10 h-10">
          <img
            src="/logostmkg.png"
            className="absolute inset-0 w-full h-full object-contain"
            alt="Logo STMKG"
          />
        </div>
      </div>

      {/* Tombol kanan atas: Monitoring Genset, Toggle Dark Mode, Logout */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <button
          onClick={goToGenset}
          className="px-4 py-2 rounded-md font-semibold text-white bg-green-600 hover:brightness-110 transition"
          title="Monitoring Genset"
        >
          Genset
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 dark:bg-gray-300 dark:hover:bg-gray-400 transition-colors"
          title="Toggle Mode"
        >
          💡
        </button>

        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
          title="Logout"
        >
          Logout
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.main
          key="monitoring-radar"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex flex-col items-center justify-start pt-24 pb-16 px-4 max-w-6xl mx-auto"
          style={{ minHeight: "100vh" }}
        >
          <h1 className="text-center font-extrabold text-3xl sm:text-4xl mb-4">
            <div>Monitoring Radar Cuaca</div>
            <div className="text-xl sm:text-2xl font-normal mt-1">
              Stasiun Meteorologi Kelas I Soekarno-Hatta
            </div>
          </h1>

          {!data ? (
            <div className="text-center text-lg">Memuat data radar...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-6 bg-white/5 dark:bg-white/10 rounded-xl shadow-inner backdrop-blur-lg w-full">
              {importantKeys.map((key) => (
                <div
                  key={key}
                  className={`flex flex-col items-center justify-center text-center p-4 rounded-lg text-white shadow-md ${getStatusColor(
                    key,
                    data[key]
                  )}`}
                >
                  <div className="text-sm font-semibold">
                    {keyTitles[key] || key.toUpperCase()}
                  </div>
                  <div className="text-2xl font-bold">{String(data[key])}</div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-6 text-sm text-gray-400 w-full max-w-2xl">
            Waktu data: {formatUTCDateTime12h(data?.time)}
          </div>

          {/* Tombol lihat detail di bawah parameter */}
          <div className="mt-6 mb-10 flex gap-4 flex-wrap justify-center w-full max-w-2xl">
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="px-5 py-2 rounded-md font-semibold bg-blue-600 hover:bg-blue-700 transition"
            >
              {showDetail ? "Sembunyikan Detail" : "Lihat Semua Parameter"}
            </button>
          </div>

          {showDetail && data && (
            <div className="mt-6 px-4 py-4 rounded-xl bg-white/10 max-h-[300px] overflow-auto w-full max-w-6xl">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.entries(data)
                  .filter(
                    ([key]) =>
                      !importantKeys.includes(key) &&
                      key !== "time" // exclude waktu
                  )
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-gray-700/40 p-3 rounded-lg text-sm text-white flex flex-col items-center text-center"
                    >
                      <div className="font-semibold">{key}</div>
                      <div className="text-lg">{String(value)}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
