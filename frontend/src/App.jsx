// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import Glossary from "./pages/Glossary";
import PhishBlasterPage from "./pages/PhishBlasterPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/glossary" element={<Glossary />} />
        <Route path="/adventure" element={<PhishBlasterPage />}  />
      </Routes>
    </Router>
  );
}
