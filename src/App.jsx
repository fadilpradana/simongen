import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MonitoringRadar from "./pages/MonitoringRadar"; // sesuai nama file

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Routes>
      {/* Route untuk halaman login */}
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" />
          ) : (
            <Login
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              setIsLoggedIn={setIsLoggedIn}
            />
          )
        }
      />

      {/* Route untuk halaman dashboard genset */}
      <Route
        path="/dashboard"
        element={
          isLoggedIn ? (
            <Dashboard
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              setIsLoggedIn={setIsLoggedIn}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* Route untuk halaman monitoring radar BITE */}
      <Route
        path="/monitoring-radar"
        element={
          isLoggedIn ? (
            <MonitoringRadar
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              setIsLoggedIn={setIsLoggedIn}
            />
          ) : (
            <Navigate to="/" />
          )
        }
      />
    </Routes>
  );
}

export default App;
