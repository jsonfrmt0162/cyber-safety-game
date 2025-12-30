import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Leaderboard() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    api.get("/game/leaderboard").then(res => setScores(res.data));
  }, []);

  return (
    <div className="dashboard-container">
      <h1>🏆 Leaderboard</h1>
      {scores.map((s, i) => (
        <p key={i}>{i + 1}. {s.username} — {s.high_score}</p>
      ))}
    </div>
  );
}
