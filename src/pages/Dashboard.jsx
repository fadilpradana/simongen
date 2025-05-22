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

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, when: "beforeChildren" },
    },
    exit: { opacity: 0, transition: { duration: 0.8 } },
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
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="text-2xl sm:text-3xl font-bold text-center select-none px-4"
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
      complete: (results) => setData(results.data),
    });
  }, []);

  useEffect(() => {
    if (data.length === 0) return;
    if (!showWelcome) {
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
    <div className="flex flex-col items-center m-2">
      <div
        className={`relative group
          w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex items-center justify-center text-lg sm:text-xl font-bold
          ${isNormal(+val) ? "border-green-400" : "border-yellow-400 pulse"}
          bg-opacity-10 backdrop-blur-md cursor-pointer transition-transform duration-300
          hover:scale-110
        `}
      >
        {val} V
        <div
          className="tooltip-popup absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap"
          style={{ minWidth: 100 }}
        >
          <div className="font-semibold mb-1">Tegangan {label}</div>
          <div>{val} Volt</div>
          <div>Arus: {arus} A</div>
        </div>
      </div>
      <p className="mt-2 text-xs sm:text-sm">Arus: {arus} A</p>
      <p className="mt-1 font-bold text-md sm:text-lg">{label}</p>
    </div>
  );

  const pageVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.6 } },
  };

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
      {/* Logo dan tombol */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-3 sm:gap-4">
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
            className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-8"
          >
            <h1 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center px-2">
              Sistem Monitoring Tegangan Genset
            </h1>

            {/* Layout flex-wrap untuk responsif */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-10 mb-6 max-w-4xl w-full">
              {voltageCircle("R", teg_r, arus_r)}
              {voltageCircle("S", teg_s, arus_s)}
              {voltageCircle("T", teg_t, arus_t)}
            </div>

            <div className="text-xs sm:text-sm mt-4 flex flex-wrap justify-center gap-6 px-2">
              <p>Frekuensi: {frekuensi} Hz</p>
              <p>Daya: {daya} W</p>
              <p>Waktu: {timestamp}</p>
            </div>

            <button
              onClick={() => setShowChart(true)}
              className="mt-6 sm:mt-8 px-5 py-3 sm:px-7 sm:py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors duration-300"
            >
              Lihat Grafik Tegangan
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="chartPage"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8"
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">
              Grafik Tegangan 3 Fasa
            </h2>
            <div className="w-full max-w-4xl h-72 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" minTickGap={20} />
                  <YAxis
                    domain={[200, 250]}
                    label={{
                      value: "Volt",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                    }}
                  />
                  <Tooltip />
                  <Legend verticalAlign="top" />
                  <Line
                    type="monotone"
                    dataKey="teg_r"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="teg_s"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="teg_t"
                    stroke="#ff7300"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => setShowChart(false)}
              className="mt-6 px-5 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors duration-300"
            >
              Kembali
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
