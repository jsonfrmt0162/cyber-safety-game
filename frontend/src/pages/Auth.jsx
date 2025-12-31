// src/pages/Auth.jsx
import { useState } from "react";
import { login, register } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import Toast from "../components/Toast";
import LoadingOverlay from "../components/LoadingOverlay";

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
      <div className="login-card">
        <h1 className="login-title">
          {isLogin ? "🎮 Cyber Safety Game Login" : "📝 Sign Up"}
        </h1>

        {error && <p className="login-error">{error}</p>}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
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
              ? "Logging you in..."
              : "Creating your account..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>
        </form>

        <p className="signup-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="signup-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>

      <LoadingOverlay

        show={loading}

        text={isLogin ? "Logging you in..." : "Setting up your player profile..."}

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
