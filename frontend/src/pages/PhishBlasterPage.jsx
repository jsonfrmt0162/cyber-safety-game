import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PhishBlasterGame from "../pages/PhishBlasterGame";

export default function PhishBlasterPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const userId = location.state?.userId ?? null;

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          alignSelf: "flex-start",
          marginBottom: "1rem",
          borderRadius: "999px",
          border: "none",
          padding: "0.4rem 0.9rem",
          cursor: "pointer",
          background: "#e5e7eb",
        }}
      >
        ⬅ Back to dashboard
      </button>
      <PhishBlasterGame userId={userId} gameId={5} />
    </div>
  );
}
