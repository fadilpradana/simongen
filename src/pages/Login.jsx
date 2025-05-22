import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ darkMode, setDarkMode, setIsLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const validUsername = "z";
    const validPassword = "z";

    if (username === validUsername && password === validPassword) {
      setIsLoggedIn(true); // Set status login ke true di parent (App.jsx)
      navigate("/dashboard");
    } else {
      setError("Username atau password salah.");
    }
  };

  return (
    <div
      className={`${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      } min-h-screen flex items-center justify-center transition-colors duration-500`}
    >
      {/* Toggle Dark Mode Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 dark:bg-gray-300 dark:hover:bg-gray-400 transition-colors duration-300"
        title="Toggle dark mode"
      >
        💡
      </button>

      <form
        onSubmit={handleLogin}
        className="bg-opacity-20 p-8 rounded-xl shadow-lg backdrop-blur-md w-80 border border-gray-300 dark:border-gray-600"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <label className="block mb-2 font-semibold">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 mb-4 rounded bg-gray-100 dark:bg-gray-100 border border-gray-300 dark:border-gray-600 text-black dark:text-black focus:outline-none"
          required
          autoComplete="username"
        />

        <label className="block mb-2 font-semibold">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-4 rounded bg-gray-100 dark:bg-gray-100 border border-gray-300 dark:border-gray-600 text-black dark:text-black focus:outline-none"
          required
          autoComplete="current-password"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Masuk
        </button>
      </form>
    </div>
  );
}
