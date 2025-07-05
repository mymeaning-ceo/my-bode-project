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
    { label: "대구", nx: 89, ny: 90 },
    { label: "인천", nx: 55, ny: 124 },
    { label: "광주", nx: 58, ny: 74 },
    { label: "대전", nx: 67, ny: 100 },
    { label: "울산", nx: 102, ny: 84 },
    { label: "세종", nx: 66, ny: 103 },
    { label: "경기", nx: 60, ny: 120 },
    { label: "강원", nx: 73, ny: 134 },
    { label: "충북", nx: 69, ny: 107 },
    { label: "충남", nx: 68, ny: 100 },
    { label: "전북", nx: 63, ny: 89 },
    { label: "전남", nx: 51, ny: 67 },
    { label: "경북", nx: 91, ny: 106 },
    { label: "경남", nx: 91, ny: 77 },
    { label: "제주", nx: 52, ny: 38 },
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setLogoutAt(null);
    setTimeLeft(null);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
      <div className="container-fluid">
        <button type="button" className="btn btn-link me-2 text-decoration-none" onClick={onToggleSidebar}>
          ☰
        </button>
        <Link to="/dashboard" className="navbar-brand fw-bold">
          내의미
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#topNavbar">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="topNavbar">
          {weather && (
            <div className="d-flex align-items-center ms-3 gap-2">
              <span>
                {weather.temperature ?? '-'}℃ {skyMap[weather.sky] ?? weather.sky ?? '-'}
              </span>
              <select
                className="form-select form-select-sm weather-select"
                value={location ? location.label : ''}
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
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <Link to="/weather" className="nav-link">날씨</Link>
            </li>
            {user ? (
              <>
                <li className="nav-item">
                  <Link to="/profile" className="nav-link">
                    {user.name || user.username}
                  </Link>
                </li>
                {timeLeft !== null && (
                  <li className="nav-item text-muted mx-2">
                    {String(Math.floor(timeLeft / 3600000)).padStart(2, '0')}:
                    {String(Math.floor((timeLeft % 3600000) / 60000)).padStart(2, '0')}:
                    {String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0')}
                  </li>
                )}
                <li className="nav-item">
                  <button type="button" className="btn btn-link nav-link" onClick={handleExtend}>
                    시간연장
                  </button>
                </li>
                <li className="nav-item">
                  <button type="button" className="btn btn-link nav-link" onClick={handleLogout}>
                    로그아웃
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">로그인</Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link">회원가입</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Header;

Header.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
};
