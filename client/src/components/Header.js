import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import "./Header.css";

function Header({ onToggleSidebar }) {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);
  const [logoutAt, setLogoutAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const skyMap = { 1: "맑음", 3: "구름많음", 4: "흐림" };
  useEffect(() => {
    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {});

    fetch("/api/weather/daily", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setWeather(data);
      })
      .catch(() => {});

    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setLogoutAt(data.expiresAt);
      })
      .catch(() => {});
  }, []);

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

  const handleExtend = async () => {
    const res = await fetch("/api/auth/extend", {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLogoutAt(data.expiresAt);
    }
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
        <div className="weather-info ms-3">
          <span>
            {weather.temperature ?? "-"}℃{" "}
            {skyMap[weather.sky] ?? weather.sky ?? "-"}
          </span>
        </div>
      )}
      <div className="user-info ms-auto">
        <Link to="/weather" className="me-3">
          날씨
        </Link>
        {user && <span className="me-3">{user.name || user.username}</span>}
        {timeLeft !== null && (
          <span className="me-3 text-muted">
            시간연장 {String(Math.floor(timeLeft / 3600000)).padStart(2, "0")}:
            {String(Math.floor((timeLeft % 3600000) / 60000)).padStart(2, "0")}:
            {String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, "0")}
          </span>
        )}
        <button type="button" className="btn btn-link" onClick={handleExtend}>
          시간연장
        </button>
      </div>
    </header>
  );
}

export default Header;

Header.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
};
