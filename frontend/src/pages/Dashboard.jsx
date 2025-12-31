// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../styles/Dashboard.css";
import "../pages/PhishBlasterGame";
import DashboardSkeleton from "../components/DashboardSkeleton";
import {
  getUserDashboard,
  getGlobalLeaderboard,
  getGames,
  getUserProgress,
} from "../services/api";
import { useNavigate } from "react-router-dom";


const CYBER_TIPS = [
  "Think before you post — once it's online, it can stay forever.",
  "Use strong, unique passwords for every account.",
  "Review your privacy settings regularly on your apps and social media.",
  "Avoid oversharing your birthday, school, or address online.",
  "Limit location sharing — not everyone needs to know where you are.",
  "Be cautious with 'fun' quizzes and random apps that want your data.",
]; // from best-practice section of the module :contentReference[oaicite:1]{index=1}

const SAFETY_CHECKLIST = [
    "Think before you post anything online.",
    "Use strong, unique passwords or passphrases.",
    "Turn on multi-factor authentication (MFA) when possible.",
    "Review your app and social media privacy settings regularly.",
    "Limit location sharing and avoid posting your real-time location.",
    "Never overshare personal details like school, home address, or full birthday.",
  ];  

function GameCard({ game, progress, onPlay, locked, prereqTitle }) {
    const percent = progress?.percent ?? 0;
    const bestScore = progress?.best_score ?? 0;
    const maxScore = progress?.max_score ?? 0;
  
    const isComplete = percent >= 100;
  
    return (
      <div className="game-card kids-card">
        {/* header */}
        <div className="game-card-header">
          <span className="game-icon">{game.emoji}</span>
          <div className="game-header-text">
            <h3 className="game-title">{game.title}</h3>
            <p className="game-subtitle">Cyber Safety Quiz</p>
          </div>
          {locked ? (
            <span className="badge badge-locked">Locked</span>
          ) : isComplete ? (
            <span className="badge badge-complete">Completed</span>
          ) : (
            <span className="badge badge-progress">In progress</span>
          )}
        </div>
  
        {/* progress */}
        <div className="game-card-progress">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="progress-percent">{percent}%</span>
        </div>
  
        {/* footer */}
        <div className="game-card-footer">
          <span className="score-text">
            Best: <strong>{bestScore}</strong> / {maxScore}
          </span>
          <button
            className={`play-btn ${locked ? "play-btn-disabled" : ""}`}
            onClick={locked ? undefined : onPlay}
            disabled={locked}
          >
            {locked ? "Finish previous" : "▶ Start"}
          </button>
        </div>
  
        {locked && prereqTitle && (
          <p className="locked-text">
            Unlock by completing <strong>{prereqTitle}</strong>.
          </p>
        )}
      </div>
    );
  }  
  

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [topicProgress, setTopicProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUserId = localStorage.getItem("user_id");
        if (!storedUserId) {
          navigate("/");
          return;
        }

        const [userData, leaderboardData, gameData, progressData] =
          await Promise.all([
            getUserDashboard(storedUserId),
            getGlobalLeaderboard(),
            getGames(),
            getUserProgress(storedUserId),
          ]);

        setUser(userData);
        setLeaderboard(leaderboardData);
        setGames(gameData);
        setTopicProgress(progressData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const summary = useMemo(() => {
    if (!topicProgress.length) return null;

    const completed = topicProgress.filter((p) => p.percent >= 100).length;
    const total = topicProgress.length;
    const overallPercent =
      topicProgress.reduce((sum, p) => sum + p.percent, 0) / total;

    const nextTopic = topicProgress.find((p) => p.percent < 100);

    return {
      completed,
      total,
      overallPercent: Math.round(overallPercent),
      nextTopic,
    };
  }, [topicProgress]);

  const topicsCompleted = summary?.completed ?? 0;
  const totalTopics = summary?.total ?? (topicProgress?.length || 4);

  const levelLabel = summary
  ? summary.overallPercent === 100
    ? "Cyber Safety Pro"
    : summary.overallPercent >= 50
    ? "Cyber Safety Explorer"
    : "Cyber Safety Beginner"
  : "Cyber Safety Beginner";

  const todaysTip = useMemo(() => {
    if (!CYBER_TIPS.length) return "";
    const index = new Date().getDate() % CYBER_TIPS.length;
    return CYBER_TIPS[index];
  }, []);

  const handlePlayGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    navigate("/");
  };

  const getProgressForGame = (gameId) =>
    topicProgress.find((p) => p.game_id === gameId);

    if (loading) {
        return (
          <div className="dashboard-container">
            <DashboardSkeleton />
          </div>
        );
      }
  if (!user) return <p>Error loading user data.</p>;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header kids-header">
      <div className="header-left">
       <div className="shield-circle">🛡️</div>
       <div>
         <h1>Hello, {user.username}!</h1>
         <p>
           Age: {user.age} · Global Score: <strong>{user.high_score ?? 0}</strong>
         </p>
         <span className="level-chip">{levelLabel}</span>
       </div>
     </div>

      
        <div className="header-buttons">
        <button
           className="ghost-button"
           type="button"
           onClick={() => navigate("/adventure", { state: { userId: user.id } })}
         >
           Anti-Phish Blaster  🎮
         </button>

          <button
            className="ghost-button"
            type="button"
            onClick={() => navigate("/glossary")}
          >
            Glossary 📚
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout ➜]
          </button>
        </div>
      </header>


      <section className="section-heading">
         <span className="section-label">
           🧭 Your Cyber Safety Journey
         </span>
      </section>


      <section className="dashboard-row">
          {/* Progress Summary */}
          <div className="summary-card">
            <div className="card-title-row">
              <span className="card-icon">📊</span>
              <h2>Progress Summary</h2>
            </div>

            {summary ? (
              <>
                <p>
                  Topics completed:{" "}
                  <strong>{summary.completed}</strong> / {summary.total}
                </p>
            
                <div className="summary-progress-bar">
                  <div
                    className="summary-progress-fill"
                    style={{ width: `${summary.overallPercent}%` }}
                  />
                </div>
            
                <p className="overall-text">
                  Overall completion: {summary.overallPercent}%
                </p>
            
                {summary.nextTopic && (
                  <p className="next-topic">
                    Next recommended topic:{" "}
                    <strong>
                      {summary.nextTopic.emoji} {summary.nextTopic.title}
                    </strong>
                  </p>
                )}
              </>
            ) : (
              <p>Play your first quiz to start tracking your progress!</p>
            )}
          </div>
            
          {/* Cyber Safety Tip */}
          <div className="tip-card">
            <div className="card-title-row">
              <span className="card-icon">💡</span>
              <h2>Cyber Safety Tip</h2>
            </div>
            <p>{todaysTip}</p>
          </div>
            
          {/* Your Achievements */}
          <div className="achieve-card">
            <div className="card-title-row">
              <span className="card-icon">🏅</span>
              <h2>Your Achievements</h2>
            </div>
            <ul className="achieve-list">
              <li>⭐ Topics completed: {topicsCompleted} / {totalTopics}</li>
              <li>🎯 Highest score: {user.high_score ?? 0}</li>
            </ul>
          </div>
        </section>

 

    {/* Smart habits section (checklist + why it matters) */}
    <section className="info-section">
      <div className="info-title">
        <h2>🧠 Smart Online Habits</h2>
        <p>Remember these ideas whenever you learn, play, or chat online.</p>
      </div>

      <div className="info-grid">
        {/* left: checklist */}
        <div className="safety-card">
          <h2>🛡️ Cyber Safety Checklist</h2>
          <p className="safety-intro">
            Before you go online, remember these smart habits from your lessons.
          </p>
          {/* keep your existing checklist list here */}
         <ul className="safety-list">
           {SAFETY_CHECKLIST.map((item, idx) => (
             <li key={idx}>
               <span className="safety-bullet">✔</span>
               <span>{item}</span>
             </li>
           ))}
         </ul>
        </div>

        {/* right: why it matters */}
        <div className="why-card">
          <h2>🌍 Why Cyber Safety Matters</h2>
          <p>
            The internet is an amazing place to learn, create, play, and connect
            with others. But just like crossing the street, we need to stay smart
            and safe. These topics help you protect your identity, your passwords,
            and your digital footprint — now and in the future.
          </p>
        </div>
      </div>
    </section>


      {/* Topic description heading */}
      <section className="topic-overview">
        <h2>🧙‍♂️ Cyber Safety Topics</h2>
        <p className="topic-overview-text">
          These four quizzes match your lesson topics: digital footprints,
          personal information, passwords & passphrases, and social media
          privacy. Each game uses real-life scenarios just like in your module.
        </p>
      </section>

      {/* Game Cards */}
      <section className="game-cards">
          {games
            .slice() // copy to avoid mutating
            .sort((a, b) => a.id - b.id)
            .map((game, index, arr) => {
              const progress = getProgressForGame(game.id);
              let locked = false;
              let prereqTitle = "";
            
              if (index > 0) {
                const prevGame = arr[index - 1];
                const prevProgress = getProgressForGame(prevGame.id);
                if (!prevProgress || prevProgress.percent < 100) {
                  locked = true;
                  prereqTitle = prevGame.title;
                }
              }
          
              return (
                <GameCard
                  key={game.id}
                  game={game}
                  progress={progress}
                  locked={locked}
                  prereqTitle={prereqTitle}
                  onPlay={() => handlePlayGame(game.id)}
                />
              );
            })}
        </section>

      {/* Leaderboard */}
      <section className="leaderboard-section kids-leaderboard">
        <h2>🏆 Global Leaderboard</h2>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>High Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((item, index) => (
              <tr
                key={item.id}
                className={
                  item.id === user.id ? "leaderboard-row-current" : ""
                }
              >
                <td>{index + 1}</td>
                <td>{item.username}</td>
                <td>{item.high_score}</td>
              </tr> 
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
