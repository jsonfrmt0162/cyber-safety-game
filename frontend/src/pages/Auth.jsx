// src/pages/Auth.jsx
import { useState } from "react";
import { login, register } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import Toast from "../components/Toast";
import LoadingOverlay from "../components/LoadingOverlay";
import cyberQuestLogo from "../assets/cyber_logo.jpeg";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    birthday: "",
    age: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState("info");
  const [toastMsg, setToastMsg] = useState("");

  const navigate = useNavigate();

  const calculateAge = (birthday) => {
    const birthDate = new Date(birthday);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "birthday") {
      const age = calculateAge(value);
      setForm({ ...form, birthday: value, age });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const showToast = (type, msg) => {
    setToastType(type);
    setToastMsg(msg);
    setToastOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const data = await login(form.email, form.password);

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.username);
        showToast("success", `Welcome back, ${data.username || "player"}!`);
        navigate("/dashboard");
      } else {
        await register(form);
        showToast("success", "🎉 Registration successful! Please log in.");
        setIsLogin(true);
      }
    } catch (err) {
        const msg =
        err.response?.data?.detail ||
        err.message ||
        (isLogin ? "Login failed. Please check your details." : "Could not register. Try again.");
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-shell">
          {/* LEFT HERO PANEL */}
          <div className="login-hero">
            <div className="login-hero-heading">
              <div className="hero-brand-row">
                <img
                  src={cyberQuestLogo}
                  alt="CyberQuest logo"
                  className="hero-logo"
                />
                <div>
                  <h1 className="login-hero-title">
                    <span className="emoji">🛡️</span> CyberQuest
                  </h1>
                  <p className="login-hero-tagline">
                    Level up your digital defense
                  </p>
                </div>
              </div>
  
              <p className="login-hero-subtitle">
                Log in to keep leveling up your skills in digital footprints,
                personal information, passwords, and social media safety.
              </p>
  
              <div className="login-hero-chips">
                <div className="hero-chip">
                  <span className="icon">🔍</span> Spot phishing scams
                </div>
                <div className="hero-chip">
                  <span className="icon">🧩</span> Quiz-based challenges
                </div>
                <div className="hero-chip">
                  <span className="icon">🏆</span> Climb the leaderboard
                </div>
              </div>
            </div>
  
            <div className="login-hero-footer">
              <div className="login-hero-footer-icon">💡</div>
              <div className="login-hero-footer-text">
                <strong>Tip:</strong> Never reuse the same password on every
                site — even games!
              </div>
            </div>
          </div>
  
          {/* RIGHT FORM PANEL */}
          <div className="login-card">
            <div className="login-logo">
              <img
                src={cyberQuestLogo}
                alt="CyberQuest logo small"
                className="login-logo-img"
              />
              <div className="login-logo-text">
                <span className="login-logo-title">CyberQuest</span>
                <span className="login-logo-subtitle">
                  Secure Player Portal
                </span>
              </div>
            </div>
  
            {/* Toggle tabs */}
            <div className="auth-toggle">
              <button
                type="button"
                className={`auth-tab ${isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(true)}
              >
                Log in
              </button>
              <button
                type="button"
                className={`auth-tab ${!isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(false)}
              >
                Sign up
              </button>
            </div>
  
            <div>
              <h2 className="login-title">
                {isLogin ? "Welcome back, Agent!" : "Create your player profile"}
              </h2>
              <p className="login-subtext">
                {isLogin
                  ? "Enter your details to continue your CyberQuest journey."
                  : "Just a few details so we can track your missions and scores."}
              </p>
            </div>
  
            {error && <p className="login-error">{error}</p>}
  
            <form onSubmit={handleSubmit} className="login-form">
              {!isLogin && (
                <>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="login-input"
                  />
  
                  <input
                    type="date"
                    name="birthday"
                    value={form.birthday}
                    onChange={handleChange}
                    required
                    className="login-input"
                  />
  
                  <input
                    type="text"
                    value={form.age ? `${form.age} years old` : ""}
                    readOnly
                    className="login-input"
                    placeholder="Age"
                  />
                </>
              )}
  
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                className="login-input"
              />
  
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="login-input"
              />
  
              <button type="submit" className="login-button" disabled={loading}>
                {loading
                  ? isLogin
                    ? "Logging you into CyberQuest..."
                    : "Creating your CyberQuest profile..."
                  : isLogin
                  ? "Enter CyberQuest"
                  : "Join CyberQuest"}
              </button>
  
              <p className="login-meta">
                By continuing, you agree to play safely and protect your personal
                information online.
              </p>
            </form>
  
            <p className="signup-text">
              {isLogin ? "New recruit? " : "Already have an account? "}
              <span
                className="signup-link"
                onClick={() => setIsLogin((prev) => !prev)}
              >
                {isLogin ? "Create a CyberQuest account" : "Log in instead"}
              </span>
            </p>
          </div>
        </div>
      </div>
  
      {/* Loading overlay */}
      <LoadingOverlay
        show={loading}
        text={
          isLogin
            ? "Checking your credentials..."
            : "Setting up your CyberQuest profile..."
        }
      />
  
      {/* Toast for success / error */}
      <Toast
        open={toastOpen}
        type={toastType}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
  
}
