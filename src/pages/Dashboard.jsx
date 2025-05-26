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
import { useNavigate } from "react-router-dom";
import "../index.css";

function WelcomeText({ onComplete }) {
  const fullText = "Selamat Datang di Sistem Monitoring Soekarno Hatta!";
  const [lines, setLines] = useState([fullText]);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 640;
      const words = fullText.split(" ");
      const mid = Math.ceil(words.length / 2);
      const firstLine = words.slice(0, mid).join(" ");
      const secondLine = words.slice(mid).join(" ");
      setLines(isMobile ? [firstLine, secondLine] : [fullText]);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="select-none px-4 max-w-xl mx-auto text-center leading-snug text-lg sm:text-2xl font-semibold tracking-tight text-white dark:text-white"
      variants={container}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {lines.map((line, idx) => (
        <div key={idx} className="inline-block">
          {line.split("").map((char, index) => (
            <motion.span key={index} variants={letter}>
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
          <br />
        </div>
      ))}
    </motion.div>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [currentData, setCurrentData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showChartPage, setShowChartPage] = useState(false);
  const indexRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    Papa.parse("/simonradtesan.csv", {
      download: true,
      header: false,
      complete: (results) => setData(results.data.filter(row => row.length >= 10)),
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
          daya: Number(currentData[7]),
          frekuensi: Number(currentData[8]),
        },
      ];
      if (newData.length > 20) newData.shift();
      return newData;
    });
  }, [currentData]);

  const handleLogout = () => (window.location.href = "/");
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

  if (showWelcome) {
    return (
      <div className={`${darkMode ? "bg-black text-white" : "bg-white text-black"} min-h-screen flex items-center justify-center px-4 transition-colors duration-700`}>
        <AnimatePresence mode="wait">
          <motion.div key="welcome" className="max-w-xl text-center">
            <WelcomeText onComplete={() => setShowWelcome(false)} />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className={`${darkMode ? "bg-black text-white" : "bg-white text-black"} min-h-screen flex items-center justify-center transition-colors duration-700`}>
        Memuat data...
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "bg-black text-white" : "bg-white text-black"} min-h-screen relative transition-colors duration-700`}>
      {/* LOGO & BUTTONS */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-3 sm:gap-4">
        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
          <img
            src="/logobmkglight.png"
            alt="Logo BMKG Light"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${darkMode ? "opacity-100" : "opacity-0"}`}
          />
          <img
            src="/logobmkg.png"
            alt="Logo BMKG"
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${darkMode ? "opacity-0" : "opacity-100"}`}
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
          title="Dark Mode"
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
          <ChartPage graphData={graphData} setShowChartPage={setShowChartPage} />
        ) : (
          <HomePage
            currentData={{ teg_r, teg_s, teg_t, arus_r, arus_s, arus_t, daya, frekuensi, timestamp }}
            setShowChartPage={setShowChartPage}
            navigate={navigate}
            isNormal={isNormal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChartPage({ graphData, setShowChartPage }) {
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
        Grafik Tegangan Genset Soekarno Hatta
      </h1>

      <div className="w-full h-80 bg-opacity-60 backdrop-blur-md rounded-lg p-4 border border-white dark:border-gray-700">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="teg_r" stroke="#8884d8" name="Tegangan R" dot={false} />
            <Line type="monotone" dataKey="teg_s" stroke="#82ca9d" name="Tegangan S" dot={false} />
            <Line type="monotone" dataKey="teg_t" stroke="#ffc658" name="Tegangan T" dot={false} />
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


function HomePage({ currentData, setShowChartPage, navigate, isNormal }) {
  const { teg_r, teg_s, teg_t, arus_r, arus_s, arus_t, daya, frekuensi, timestamp } = currentData;

  return (
    <motion.main
      key="home"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="flex flex-col items-center justify-start min-h-screen px-4 pt-24 pb-20 gap-6 max-w-4xl mx-auto"
    >
      <h1 className="text-center font-extrabold text-3xl sm:text-4xl mb-6">
        Monitoring Genset Soekarno Hatta
      </h1>

      <div className="flex justify-center gap-8 mb-6">
        {["R", "S", "T"].map((label, i) => {
          const val = currentData[`teg_${label.toLowerCase()}`];
          const arus = currentData[`arus_${label.toLowerCase()}`];
          return (
            <div key={label} className="flex flex-col items-center m-2 min-w-[88px]">
              <div
                className={`relative group w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex items-center justify-center text-lg sm:text-xl font-bold
                ${isNormal(+val) ? "border-green-400" : "border-yellow-400 pulse"}
                bg-opacity-10 backdrop-blur-md cursor-pointer transition-transform duration-300 hover:scale-110`}
              >
                {val} V
                <div className="tooltip-popup absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
                  <div className="font-semibold mb-1">Tegangan {label}</div>
                  <div>{val} Volt</div>
                  <div>Arus: {arus} A</div>
                </div>
              </div>
              <p className="mt-2 text-xs sm:text-sm">Arus: {arus} A</p>
              <p className="mt-1 font-bold text-md sm:text-lg">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="text-center mb-6 space-x-4 text-sm sm:text-base">
        <span><span className="font-semibold">Frekuensi:</span> {frekuensi} Hz</span>
        <span><span className="font-semibold">Daya:</span> {daya} W</span>
        <span><span className="font-semibold">Waktu:</span> {timestamp || "—"}</span>
      </div>

      <div className="flex gap-6">
        <button
          onClick={() => setShowChartPage(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:brightness-110 transition"
        >
          Lihat Grafik
        </button>
        <button
          onClick={() => navigate("/monitoring-radar")}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold hover:brightness-110 transition"
        >
          Monitoring Radar
        </button>
      </div>
    </motion.main>
  );
}
