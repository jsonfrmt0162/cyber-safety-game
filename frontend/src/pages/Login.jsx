import { useState } from "react";
import { loginUser, registerUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    birthday: "",
    age: ""
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const calculateAge = (birthday) => {
    const b = new Date(birthday);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    if (
      t.getMonth() < b.getMonth() ||
      (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "birthday") {
      setForm({ ...form, birthday: value, age: calculateAge(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const res = await loginUser({
          email: form.email,
          password: form.password
        });
        localStorage.setItem("user_id", res.data.id);
        navigate("/dashboard");
      } else {
        await registerUser(form);
        alert("🎉 Registered! Please login.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{isLogin ? "🎮 Game Login" : "📝 Register"}</h1>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input name="username" placeholder="Username" onChange={handleChange} required />
              <input type="date" name="birthday" onChange={handleChange} required />
              <input value={form.age ? `${form.age} years old` : ""} readOnly />
            </>
          )}

          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />

          <button type="submit">{isLogin ? "Login" : "Register"}</button>
        </form>

        <p onClick={() => setIsLogin(!isLogin)} className="toggle">
          {isLogin ? "Create account" : "Back to login"}
        </p>
      </div>
    </div>
  );
}
