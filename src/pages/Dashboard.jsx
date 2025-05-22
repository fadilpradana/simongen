import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
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
import "../index.css";

function WelcomeText({ onComplete }) {
  const text = "Selamat Datang di Sistem Monitoring Genset Taruna!";
  const letters = text.split("");

  // Variants untuk animasi huruf masuk
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        when: "beforeChildren",
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.8 },
    },
  };

  const letter = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  useEffect(() => {
    // Tunggu 4 detik setelah animasi masuk baru jalankan onComplete (keluar)
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="text-3xl font-bold text-center select-none"
      variants={container}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {letters.map((char, index) => (
        <motion.span key={index} variants={letter}>
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.div>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const indexRef = useRef(0);

  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    Papa.parse("/simonradtesan.csv", {
      download: true,
      header: false,
      complete: (results) => {
        setData(results.data);
      },
    });
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    if (!showWelcome) {
      // Start interval untuk update data setiap 1 detik
      const interval = setInterval(() => {
        setCurrentData(data[indexRef.current]);
        indexRef.current = (indexRef.current + 1) % data.length;
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [data, showWelcome]);

  useEffect(() => {
    if (!currentData) return;

    setGraphData((prev) => {
      const newData = [
        ...prev,
        {
          time: currentData[9],
          teg_r: Number(currentData[1]),
          teg_s: Number(currentData[2]),
          teg_t: Number(currentData[3]),
          arus_r: Number(currentData[4]),
          arus_s: Number(currentData[5]),
          arus_t: Number(currentData[6]),
        },
      ];
      if (newData.length > 20) newData.shift();
      return newData;
    });
  }, [currentData]);

  const handleLogout = () => {
    window.location.href = "/";
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const [
    id,
    teg_r,
    teg_s,
    teg_t,
    arus_r,
    arus_s,
    arus_t,
    daya,
    frekuensi,
    timestamp,
  ] = currentData || [];

  const isNormal = (val) => val >= 210 && val <= 230;

  const voltageCircle = (label, val, arus) => (
    <div className="flex flex-col items-center">
      <div
        className={`relative group
          w-28 h-28 rounded-full border-4 flex items-center justify-center text-xl font-bold
          ${isNormal(+val) ? "border-green-400" : "border-yellow-400 pulse"}
          bg-opacity-10 backdrop-blur-md cursor-pointer transition-transform duration-300
          hover:scale-110
        `}
      >
        {val} V
        <div
          className="tooltip-popup absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10"
          style={{ whiteSpace: "nowrap" }}
        >
          <div className="font-semibold mb-1">Tegangan {label}</div>
          <div>{val} Volt</div>
          <div>Arus: {arus} A</div>
        </div>
      </div>
      <p className="mt-2 text-sm">Arus: {arus} A</p>
      <p className="mt-1 font-bold text-lg">{label}</p>
    </div>
  );

  const pageVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.6 } },
  };

  // Tampilan Selamat Datang - tengah layar full viewport
  if (showWelcome)
    return (
      <div
        className={`transition-colors duration-700 ${
          darkMode ? "bg-black text-white" : "bg-white text-black"
        } min-h-screen flex items-center justify-center px-4`}
        style={{ minHeight: "100vh" }}
      >
        <AnimatePresence mode="wait">
          <motion.div key="welcome" className="max-w-xl text-center">
            <WelcomeText onComplete={() => setShowWelcome(false)} />
          </motion.div>
        </AnimatePresence>
      </div>
    );

  // Setelah welcome selesai, dan data belum ready (jika pernah terjadi)
  if (!currentData)
    return (
      <div
        className={`transition-colors duration-700 ${
          darkMode ? "bg-black text-white" : "bg-white text-black"
        } min-h-screen flex items-center justify-center`}
      >
        Memuat data...
      </div>
    );

  return (
    <div
      className={`transition-colors duration-700 ${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      } min-h-screen`}
    >
      {/* Logo dan tombol tetap */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-4">
        <div className="relative w-10 h-10">
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
        <div className="relative w-10 h-10">
          <img
            src="/logostmkg.png"
            alt="Logo STMKG"
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 dark:bg-gray-300 dark:hover:bg-gray-400 transition-colors duration-300"
          title="Toggle dark mode"
        >
          💡
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors duration-300"
          title="Logout"
        >
          Logout
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!showChart ? (
          <motion.div
            key="mainPage"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen flex flex-col items-center justify-center px-4"
          >
            <h1 className="text-3xl font-bold mb-8 text-center">
              Sistem Monitoring Tegangan Genset
            </h1>

            <div className="flex gap-10 mb-6">
              {voltageCircle("R", teg_r, arus_r)}
              {voltageCircle("S", teg_s, arus_s)}
              {voltageCircle("T", teg_t, arus_t)}
            </div>

            <div className="text-sm mt-4 flex justify-center gap-8">
              <p>Frekuensi: {frekuensi} Hz</p>
              <p>Daya: {daya} W</p>
              <p>Waktu: {timestamp}</p>
            </div>

            <button
              onClick={() => setShowChart(true)}
              className="mt-8 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-semibold transition-colors duration-300"
            >
              Lihat Grafik
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="chartPage"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen flex flex-col items-center justify-center px-4"
          >
            <h1 className="text-3xl font-bold mb-8 text-center">
              Grafik Monitoring Tegangan & Arus
            </h1>

            <div className="w-full max-w-4xl mb-8" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={graphData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="teg_r"
                    stroke="#8884d8"
                    name="Tegangan R (V)"
                  />
                  <Line
                    type="monotone"
                    dataKey="teg_s"
                    stroke="#82ca9d"
                    name="Tegangan S (V)"
                  />
                  <Line
                    type="monotone"
                    dataKey="teg_t"
                    stroke="#ffc658"
                    name="Tegangan T (V)"
                  />
                  <Line
                    type="monotone"
                    dataKey="arus_r"
                    stroke="#ff7300"
                    name="Arus R (A)"
                  />
                  <Line
                    type="monotone"
                    dataKey="arus_s"
                    stroke="#0088fe"
                    name="Arus S (A)"
                  />
                  <Line
                    type="monotone"
                    dataKey="arus_t"
                    stroke="#00c49f"
                    name="Arus T (A)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <button
              onClick={() => setShowChart(false)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-full text-white font-semibold transition-colors duration-300"
            >
              Kembali
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
