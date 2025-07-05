import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import "./Header.css";

function Header({ onToggleSidebar }) {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("weatherLocation");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [logoutAt, setLogoutAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const locations = [
    { label: "천안", nx: 67, ny: 110 },
    { label: "서울", nx: 60, ny: 127 },
    { label: "부산", nx: 98, ny: 76 },
  ];

  const skyMap = { 1: "맑음", 3: "구름많음", 4: "흐림" };
  const fetchWeather = () => {
    if (!location) return;
    fetch(
      `/api/weather/daily?nx=${location.nx}&ny=${location.ny}`,
      { credentials: "include" },
    )
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setWeather(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {});

    if (!location) {
      setLocation(locations[0]);
      return;
    }
    fetchWeather();

    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setLogoutAt(data.expiresAt);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!location) return;
    localStorage.setItem("weatherLocation", JSON.stringify(location));
    fetchWeather();
    const id = setInterval(fetchWeather, 600000); // 10 minutes
    return () => clearInterval(id);
  }, [location]);

  useEffect(() => {
    if (!logoutAt) return undefined;
    function updateTimer() {
      const diff = new Date(logoutAt) - new Date();
      setTimeLeft(diff > 0 ? diff : 0);
    }
    updateTimer();
    const id = setInterval(updateTimer, 1000);
    return () => clearInterval(id);
  }, [logoutAt]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  };

  return (
    <header className="app-header shadow-sm">
      <button type="button" className="btn menu-btn" onClick={onToggleSidebar}>
        ☰
      </button>
      <Link to="/dashboard" className="ms-2 fw-bold brand-link">
        내의미
      </Link>
      {weather && (
        <div className="weather-info ms-3 d-flex align-items-center gap-2">
          <span>
            {weather.temperature ?? "-"}℃ {skyMap[weather.sky] ?? weather.sky ?? "-"}
          </span>
          <select
            className="form-select form-select-sm weather-select"
            value={location ? location.label : ""}
            onChange={(e) => {
              const loc = locations.find((l) => l.label === e.target.value);
              if (loc) setLocation(loc);
            }}
          >
            {locations.map((l) => (
              <option key={l.label} value={l.label}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="user-info ms-auto">
        <Link to="/weather" className="me-3">
          날씨
        </Link>
        {user && <span className="me-3">{user.name || user.username}</span>}
        {timeLeft !== null && (
          <span className="me-3 text-muted">
            로그아웃 {Math.floor(timeLeft / 60000)}:
            {String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, "0")}
          </span>
        )}
        <button type="button" className="btn btn-link" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}

export default Header;

Header.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
};
