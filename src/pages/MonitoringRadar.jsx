import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function MonitoringRadar() {
  const [data, setData] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [radarImageSrc, setRadarImageSrc] = useState("");
  const [radarStatus, setRadarStatus] = useState(null); // State baru untuk data monitoring status radar
  const navigate = useNavigate();

  // useRef untuk menyimpan ID interval agar bisa dibersihkan
  const dataIntervalRef = useRef(null);
  const statusIntervalRef = useRef(null);
  const imageIntervalRef = useRef(null);

  const importantKeys = [
    "el", "az", "cab_temp",
    "hot_box_temp", "forward_pwr", "reverse_pwr",
    "vswr", "az_motor_error", "el_motor_error",
  ];

  const chartKeys = [
    "forward_pwr", "reverse_pwr", "cab_temp", "hot_box_temp",
    "hvps_v", "hvps_i", "mag_i", "vswr",
  ];

  const keyTitles = {
    el: "Elevasi Sudut", az: "Azimuth Sudut", cab_temp: "Suhu Kabinet (°C)",
    hot_box_temp: "Suhu Hot Box (°C)", forward_pwr: "Daya Maju (W)",
    reverse_pwr: "Daya Mundur (W)", vswr: "VSWR",
    az_motor_error: "Error Motor Azimuth", el_motor_error: "Error Motor Elevasi",
    hvps_v: "HVPS Tegangan (V)", hvps_i: "HVPS Arus (A)", mag_i: "Mag Arus (A)",
    tx_status_age: "Usia Status TX", tx_control_timeout: "TX Kontrol Timeout",
    local: "Lokal", radar_pwr: "Daya Radar", mod_pwr: "Daya Modulator",
    tx_warmup_done: "TX Pemanasan Selesai", tx_warmup: "TX Pemanasan",
    tx_safe: "TX Aman", interlock: "Interlock", standby: "Siaga",
    radiate: "Radiasi", wg_press: "Tekanan WG", hot_box_door: "Pintu Hot Box",
    mag_air: "Udara Mag", pwid: "PWID", trig_over_duty: "Trigger Over Duty",
    filament_timeout: "Filamen Timeout", filament_fault: "Filamen Fault",
    tx_din_bank0: "TX DIN Bank 0", tx_din_bank1: "TX DIN Bank 1",
    measured_prf: "PRF Terukur", vswr_fault: "VSWR Fault", vswr_under_range: "VSWR Under Range",
    rx_status_age: "Usia Status RX", afc_v: "AFC Tegangan", drx_pwid: "DRX PWID",
    rx_p15v: "RX +15V", rx_n15v: "RX -15V", rx_p24v: "RX +24V",
    ped_status_age: "Usia Status PED", servo_pwr: "Daya Servo",
    az_offset: "Azimuth Offset", el_offset: "Elevasi Offset", az_safe: "Azimuth Aman",
    el_safe: "Elevasi Aman", az_motor_online: "Motor Azimuth Online",
    el_motor_online: "Motor Elevasi Online", az_motor_fatal: "Motor Azimuth Fatal",
    el_motor_fatal: "Motor Elevasi Fatal", a_pwid: "A PWID",
    tx_din_banked_prf: "TX DIN Banked PRF", pv: "PV", az_0: "Azimuth 0",
    otor_error: "Motor Error (Generic)", tx_dibank0: "TX DIBank0",
    hot_box_tempv: "Suhu Hot Box V", eaz_motor_online: "EAZ Motor Online",
    az_mootor_error: "AZ Mootor Error", rx_status_agex_pwid: "RX Status Age X PWID",
    bank0: "Bank 0", rx_pwid: "RX PWID", e: "E", elmotor_fatal: "EL Motor Fatal",
    az_motor_onaz_motor_fatal: "AZ Motor ON AZ Motor Fatal", rx_p273: "RX P273",
    el_motor_onliine: "EL Motor Online (Alt)", el_mot_pwr: "EL Motor Power",
    rx_77: "RX 77", servo: "Servo", el_moto_pwr: "EL Moto Power", rx_p243: "RX P243",
    measur: "Measure", e_pwr: "E Power", ator_online: "Ator Online",
    az_motoaz_motor_fatal: "AZ Moto AZ Motor Fatal", r14: "R14", wid: "WID",
    el_motol_motor_fatal: "EL Moto EL Motor Fatal", ped_status1: "PED Status 1",
    vswr_f: "VSWR F", el_m_motor_fatal: "EL M Motor Fatal",
    el_motoor_online: "EL Motoor Online", ped_status6: "PED Status 6",
    az_motor_oaz_motor_fatal: "AZ Motor O AZ Motor Fatal", rx_p231: "RX P231",
    mea: "MEA", serv: "SERV", vswr_faultotor_fatal: "VSWR Fault Otor Fatal",
    el_motor_oonline: "EL Motor OOnline", el_motor_onliotor_fatal: "EL Motor Onli Otor Fatal",
    tx_stat_pwr: "TX Stat Power", wg_pbox_temp: "WG PBox Temp", el_motop: "EL Motop",
    el_motomotor_fatal: "EL Moto Motor Fatal", el_motor_p: "EL Motor P",
    el_motoed_prf: "EL Motoed PRF", az_m_pwr: "AZ M Power", el_vps_i: "EL VPS I",
    reversed_prf: "Reversed PRF", emotor_fatal: "EMotor Fatal", measure: "Measure (Alt)",
    el_motorvps_i: "EL Motor VPS I", rx_p216: "RX P216", ped_status54: "PED Status 54",
    eel_motor_online: "EEL Motor Online", ped_2: "PED 2", z_motor_online: "Z Motor Online",
    l_motor_error: "L Motor Error", el_motorr_online: "EL Motor R Online",
    ped_status_ag7: "PED Status AG7", el_motor__pwr: "EL Motor Power (Alt)",
    el_motor_omotor_fatal: "EL Motor OMotor Fatal", ped_status_ag40: "PED Status AG40",
    el_motor_onlvps_i: "EL Motor Onl VPS I", el_motmotor_fatal: "EL Mot Motor Fatal",
    el_motovps_i: "EL Moto VPS I", el_motor_onlinp: "EL Motor Onlin P", servaz: "Servaz",
    txerror: "TX Error", e_motor_fatal: "E Motor Fatal", rxp15v: "RXP15V", pwr: "Power",
    el_motor__online: "EL Motor Online (Alt 2)", el_motor_onlintor_fatal: "EL Motor Onlin Tor Fatal",
    el_motor_onlibox_temp: "EL Motor Onli Box Temp", el_motor_onnline: "EL Motor Onnline",
    el_motor_tor_fatal: "EL Motor Tor Fatal", ped_status_21: "PED Status 21",
    ped_status73: "PED Status 73", el_pwr: "EL Power", rx_8: "RX 8", m: "M",
    el_motor_ootor_fatal: "EL Motor OOTOR Fatal", el_motor_onlinne: "EL Motor Onlinne",
    servk0: "ServK0", el_saf_motor_online: "EL Safe Motor Online", tor_fatal: "Tor Fatal",
    el_motor_onlline: "EL Motor Onlline", meask0: "MeasK0", el_saffe: "EL Saffe",
    el_safr_error: "EL Safe R Error", eor: "EOR", rx_statx_pwid: "RX StatX PWID",
    reverse_pwrz_motor_online: "Reverse PWRZ Motor Online", elonline: "EL Online",
    el_motor_motor_fatal: "EL Motor Motor Fatal", el_z_motor_fatal: "EL Z Motor Fatal",
    ped_st41: "PED ST41", az_motor_z_motor_fatal: "AZ Motor Z Motor Fatal", rx_p68: "RX P68",
  };

  const isError = (key, value) => {
    if (key.includes("error") || key.includes("fatal") || key.includes("fault")) return Boolean(value);
    if (key === "vswr") return value > 2;
    if (key.includes("temp")) return value > 60;
    if (key.includes("pwr") && !key.includes("reverse")) return value > 100;
    if (key === "hvps_v") return value > 400;
    if (key === "hvps_i") return value > 10;
    if (key === "mag_i") return value > 20;
    return false;
  };

  const chartLimits = {
    forward_pwr: { min: 81.5, max: 85, color: "#3b82f6" },
    reverse_pwr: { min: 39, max: 64, color: "#22c55e" },
    cab_temp: { min: 0.5, max: 31.5, color: "#ef4444" },
    hot_box_temp: { min: 0.5, max: 31.5, color: "#f97316" },
    hvps_v: { min: 649.5, max: 714.5, color: "#8b5cf6" },
    hvps_i: { min: 0.3, max: 8, color: "#7c4a1d" },
    mag_i: { min: 4.5, max: 59.5, color: "#c026d3" },
    vswr: { min: 0.5, max: 1.2, color: "#06b6d4" },
  };

  // Asumsi alamat IP laptop adalah 192.168.11.207 atau 192.168.11.252
  // Kita akan asumsikan 192.168.11.252 adalah IP server backend Anda.
  // Jika server backend Anda di port 4000 juga berjalan di 192.168.11.252,
  // maka kita konsisten menggunakan IP tersebut.
  const RADAR_API_BASE_URL = "http://localhost:4000"; // Ganti jika port 4000 berjalan di IP berbeda
  const RADAR_STATUS_IMAGE_BASE_URL = "http://192.168.11.252:8085";

  const fetchLatestData = async () => {
    try {
      const res = await fetch(`${RADAR_API_BASE_URL}/api/radar/latest`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error fetching radar data:", error);
      setData(null);
    }
  };

  const fetchRadarStatus = async () => {
    try {
      const res = await fetch(`${RADAR_STATUS_IMAGE_BASE_URL}/status`);
      if (!res.ok) throw new Error("Failed to fetch radar status");
      const json = await res.json();
      setRadarStatus(json);
    } catch (error) {
      console.error("Error fetching radar status:", error);
      setRadarStatus(null);
    }
  };

  const fetchChartData = async () => {
    try {
      const res = await fetch(
        `${RADAR_API_BASE_URL}/api/radar/history?limit=20`
      );
      if (!res.ok) throw new Error("Failed to fetch chart data");
      const json = await res.json();

      const formatted = json.map((item) => {
        const timeOptions = {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: true, timeZone: "UTC",
        };
        const obj = { time: new Date(item.time).toLocaleTimeString("en-US", timeOptions) + " UTC" };
        chartKeys.forEach((key) => {
          obj[key] = item[key];
        });
        return obj;
      });
      setChartData(formatted);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData([]);
    }
  };

  useEffect(() => {
    fetchLatestData();
    fetchRadarStatus(); // Panggil saat mount
    dataIntervalRef.current = setInterval(fetchLatestData, 1000);
    statusIntervalRef.current = setInterval(fetchRadarStatus, 1000); // Interval untuk status radar

    const updateRadarImage = () => {
      setRadarImageSrc(`${RADAR_STATUS_IMAGE_BASE_URL}/static/latest_radar.png?v=${new Date().getTime()}`);
    };

    updateRadarImage();
    imageIntervalRef.current = setInterval(updateRadarImage, 1000);

    return () => {
      clearInterval(dataIntervalRef.current);
      clearInterval(statusIntervalRef.current); // Bersihkan interval status
      clearInterval(imageIntervalRef.current);
    };
  }, []);

  const handleLogout = () => (window.location.href = "/");
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const goToGenset = () => navigate("/genset");

  const toggleChart = () => {
    if (!showChart) {
      fetchChartData();
    }
    setShowChart(!showChart);
  };

  const toggleDetail = () => setShowDetail(!showDetail);

  const getLineColor = (key, value) => {
    if (!chartLimits[key]) return "#4f46e5";
    const { min, max, color } = chartLimits[key];
    return value < min || value > max ? "#000000" : color;
  };

  const currentDetailKeys = data
    ? Object.keys(data).filter(
        (key) => !importantKeys.includes(key) && key !== "time" && key !== "eid"
      )
    : [];

  // Tentukan warna teks status berdasarkan radarStatus
  const statusTextColorClass = radarStatus?.status === "stale"
    ? "text-red-500" // Merah jika "stale"
    : "text-green-500"; // Hijau jika tidak "stale" (misal: "ok")

  return (
    <div
      className={`${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      } min-h-screen relative transition-colors duration-700 ease-in-out`}
    >
      {/* Top left logo */}
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

      {/* Top right buttons */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <button
          onClick={goToGenset}
          className="px-4 py-2 rounded-md font-semibold text-white bg-green-600 hover:brightness-110 transition"
        >
          Genset
        </button>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 dark:bg-gray-300 dark:hover:bg-gray-400 transition-colors"
        >
          💡
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
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
          className="flex flex-col items-center justify-start pt-24 pb-16 px-4 max-w-4xl mx-auto"
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
            <>
              {/* Gabungan Radar + Parameter - BACKGROUND ABU-ABU INI */}
              <div
                className={`w-full p-4 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-start
                  ${darkMode ? "bg-gray-900" : "bg-gray-100"}
                  transition-colors duration-700 ease-in-out
                `}
              >

                {/* Container Gambar radar DAN KETERANGAN */}
                <div className="w-full md:w-1/2 flex flex-col">
                    <div className="flex justify-center items-center flex-grow">
                      <img
                        src={radarImageSrc}
                        alt="Radar Snapshot"
                        className="w-full max-h-72 object-contain rounded-lg shadow-md"
                        onError={(e) => {
                          console.error("Failed to load radar image:", e.target.src);
                          e.target.alt = "Gambar radar tidak tersedia";
                          e.target.src = "https://via.placeholder.com/600x250?text=Gambar+Tidak+Tersedia";
                        }}
                      />
                    </div>
                    {/* Keterangan di bawah gambar, di dalam kotak abu-abu yang sama */}
                    <div
                        className={`text-center text-sm font-semibold mt-2 ${
                            darkMode ? "text-gray-100" : "text-gray-700"
                        }`}
                    >
                      Citra Radar Cuaca
                    </div>
                </div>

                {/* Parameter utama dan Status Radar di sisi kanan */}
                <div
                  className="w-full md:w-1/2 flex flex-col justify-between"
                  style={{ height: '300px' }}
                >
                  <div className="grid grid-cols-3 gap-3 h-full">
                    {importantKeys.map((key) => {
                      const error = isError(key, data[key]);
                      return (
                        <div
                          key={key}
                          className={`flex flex-col items-center justify-center text-center p-2.5 rounded-md shadow transition-colors duration-700 ease-in-out ${
                            error
                              ? "bg-red-700 text-white"
                              : darkMode
                              ? "bg-gray-800 text-white"
                              : "bg-white text-black"
                          }`}
                        >
                          <div className="font-semibold text-xs sm:text-sm">
                            {keyTitles[key] || key.toUpperCase()}
                          </div>
                          <div
                            className={`font-bold text-base sm:text-lg ${
                              error ? "text-red-300" : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {String(data[key])}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Timestamp dan Status Radar (Dipindahkan ke sini) */}
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400 w-full">
                    {data.time && (
                      <span className="mb-1 sm:mb-0">
                        <span className="font-semibold">Waktu Data:</span>{" "}
                        {new Date(data.time).toLocaleTimeString("en-US", {
                          hour: "2-digit", minute: "2-digit", second: "2-digit",
                          hour12: true, timeZone: "UTC",
                        })}{" "}
                        UTC
                      </span>
                    )}
                    {radarStatus && (
                      <span className="mb-1 sm:mb-0">
                        <span className="font-semibold">File Radar:</span>{" "}
                        {radarStatus.filename || "N/A"}
                      </span>
                    )}
                    {radarStatus && (
                      <span>
                        <span className="font-semibold">Status Update:</span>{" "}
                        <span className={statusTextColorClass}>
                          {radarStatus.status.toUpperCase()}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tombol */}
              <div className="mt-6 flex justify-center gap-4 flex-wrap">
                <button
                  onClick={toggleDetail}
                  className="px-5 py-2 rounded-md font-semibold bg-gray-700 hover:bg-gray-600 text-white transition"
                >
                  {showDetail ? "Sembunyikan Parameter Lainnya" : "Parameter Lainnya"}
                </button>

                <button
                  onClick={toggleChart}
                  className="px-5 py-2 rounded-md font-semibold bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  {showChart ? "Tutup Grafik" : "Lihat Grafik"}
                </button>
              </div>

              {/* Parameter lainnya */}
              {showDetail && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 p-4 bg-white/5 dark:bg-white/10 rounded-xl shadow-inner backdrop-blur-lg w-full mt-6">
                  {currentDetailKeys.length === 0 ? (
                    <div className="col-span-full text-center text-sm text-gray-400">
                      Tidak ada parameter lainnya.
                    </div>
                  ) : (
                    currentDetailKeys.map((key) => {
                      const error = isError(key, data[key]);
                      return (
                        <div
                          key={key}
                          className={`flex flex-col items-center justify-center text-center p-2 rounded-lg shadow-md transition-colors duration-700 ease-in-out ${
                            error
                              ? "bg-red-700 text-white"
                              : darkMode
                              ? "bg-gray-900 text-white"
                              : "bg-white text-black"
                          }`}
                        >
                          <div className="text-xs font-semibold">
                            {keyTitles[key] || key.toUpperCase()}
                          </div>
                          <div
                            className={`text-base font-bold ${
                              error
                                ? "text-red-300"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {String(data[key])}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Grafik */}
              {showChart && (
                <div className="w-full mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {chartKeys.map((key) => (
                    <div
                      key={key}
                      className="bg-white/5 dark:bg-white/10 rounded-xl p-4 shadow-lg flex flex-col justify-between"
                    >
                      <h2 className="text-md font-semibold mb-2 text-center">
                        {keyTitles[key] || key.toUpperCase()}
                      </h2>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                          <XAxis
                            dataKey="time"
                            tick={{ fill: darkMode ? "#fff" : "#000", fontSize: 10 }}
                          />
                          <YAxis
                            tick={{ fill: darkMode ? "#fff" : "#000", fontSize: 10 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: darkMode ? "#111" : "#fff",
                              borderColor: darkMode ? "#333" : "#ccc",
                              color: darkMode ? "#fff" : "#000",
                              fontSize: 12,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey={key}
                            stroke={
                              chartData.length > 0
                                ? getLineColor(key, chartData[chartData.length - 1][key])
                                : "#4f46e5"
                            }
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}