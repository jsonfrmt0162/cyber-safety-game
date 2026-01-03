import React, { useEffect, useRef, useState } from "react";
import Toast from "../components/Toast";
import { api } from "../services/api";

const GAME_WIDTH = 900;
const GAME_HEIGHT = 600;

const ROCK_TYPES = {
  BAD: "bad",
  GOOD: "good",
};

const RANKS = [
  { threshold: 0, label: "CADET" },
  { threshold: 500, label: "SCOUT" },
  { threshold: 1200, label: "DEFENDER" },
  { threshold: 2500, label: "GUARDIAN" },
];

function getRank(score) {
  let current = RANKS[0].label;
  for (const r of RANKS) {
    if (score >= r.threshold) current = r.label;
  }
  return current;
}

export default function PhishBlasterGame({ userId, gameId }) {
  const canvasRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [lives, setLives] = useState(3);
  const [rank, setRank] = useState("CADET");
  const [laser, setLaser] = useState(null);
  const [rocks, setRocks] = useState([]);
  const [tick, setTick] = useState(0);
  const [difficulty, setDifficulty] = useState(1);

  const [leaderboard, setLeaderboard] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // simple player state
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2);
  const playerY = GAME_HEIGHT - 80;
  const keys = useRef({ left: false, right: false, shoot: false });

  // ========= API helpers =========

  const fetchLeaderboard = async () => {
    if (!gameId) return;
    try {
      const res = await api.get(`/scores/leaderboard/${gameId}`);
      setLeaderboard(res.data);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  };

  const saveScore = async (finalScore) => {
    try {
      if (!userId || !gameId) return;
      setIsSaving(true);

      await api.post("/scores", {
        user_id: userId,
        game_id: gameId,
        score: finalScore,
      });

      // refresh leaderboard after saving
      await fetchLeaderboard();
    } catch (err) {
      console.error("Failed to save score:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // fetch leaderboard once when component mounts or gameId changes
  useEffect(() => {
    fetchLeaderboard();
  }, [gameId]);

  // ========= Input handling =========
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "a" || e.key === "ArrowLeft") keys.current.left = true;
      if (e.key === "d" || e.key === "ArrowRight") keys.current.right = true;
      if (e.code === "Space") keys.current.shoot = true;
    };
    const handleKeyUp = (e) => {
      if (e.key === "a" || e.key === "ArrowLeft") keys.current.left = false;
      if (e.key === "d" || e.key === "ArrowRight") keys.current.right = false;
      if (e.code === "Space") keys.current.shoot = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // ========= Game loop =========
  useEffect(() => {
    if (!running) return;

    let animationId;

    const spawnRock = () => {
      const isBad = Math.random() < 0.55; // more bad than good
      const type = isBad ? ROCK_TYPES.BAD : ROCK_TYPES.GOOD;
      const speed = isBad ? 0.7 + difficulty * 0.4 : 0.4 + difficulty * 0.35;
      const textOptionsBad = [
        "FREE ROBUX NOW!",
        "YOU WON A PRIZE!",
        "CLICK FOR FREE SKINS!",
        "CLAIM YOUR REWARD",
      ];
      const textOptionsGood = [
        "UPDATE AVAILABLE",
        "FRIEND MESSAGE",
        "SCHOOL WEBSITE",
        "GAME PATCH NOTES",
      ];
      return {
        id: Math.random().toString(36).slice(2),
        x: 80 + Math.random() * (GAME_WIDTH - 160),
        y: -60,
        radius: 52,
        type,
        speed,
        text:
          type === ROCK_TYPES.BAD
            ? textOptionsBad[Math.floor(Math.random() * textOptionsBad.length)]
            : textOptionsGood[
                Math.floor(Math.random() * textOptionsGood.length)
              ],
      };
    };

    const update = () => {
      setTick((t) => t + 1);

      // difficulty ramps up slowly
      setDifficulty((d) => Math.min(8, d + 0.003));

      // move player
      setPlayerX((x) => {
        let nx = x;
        if (keys.current.left) nx -= 6;
        if (keys.current.right) nx += 6;
        return Math.min(GAME_WIDTH - 40, Math.max(40, nx));
      });

      // shooting
      setLaser((currentLaser) => {
        if (!currentLaser && keys.current.shoot) {
          return { x: playerX, y: playerY - 20 };
        }
        if (currentLaser) {
          const ny = currentLaser.y - 10;
          if (ny < -20) return null;
          return { ...currentLaser, y: ny };
        }
        return currentLaser;
      });

      // spawn rocks depending on difficulty
      setRocks((prev) => {
        let next = prev.map((r) => ({ ...r, y: r.y + r.speed }));
        const spawnChance = 0.015 + difficulty * 0.004;
        if (Math.random() < spawnChance) {
          next = [...next, spawnRock()];
        }
        // remove off-screen
        return next.filter((r) => r.y < GAME_HEIGHT + 80);
      });

      // collision detection + scoring
      setRocks((prev) => {
        if (!laser) return prev;
        const hitIndex = prev.findIndex((r) => {
          const dx = r.x - laser.x;
          const dy = r.y - laser.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          return dist < r.radius + 10;
        });

        if (hitIndex === -1) return prev;

        const hitRock = prev[hitIndex];
        setLaser(null);

        if (hitRock.type === ROCK_TYPES.BAD) {
          setScore((s) => {
            const newScore = s + 100;
            setRank(getRank(newScore));
            return newScore;
          });
        } else {
          // penalty for shooting safe content
          setScore((s) => Math.max(0, s - 50));
        }

        return [...prev.slice(0, hitIndex), ...prev.slice(hitIndex + 1)];
      });

      // rocks hitting player (only bad ones)
      setRocks((prev) => {
        let hit = false;
        const next = prev.filter((r) => {
          if (r.type !== ROCK_TYPES.BAD) return true;
          const dy = r.y - playerY;
          const dx = r.x - playerX;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < r.radius + 22) {
            hit = true;
            return false;
          }
          return true;
        });

        if (hit) {
          setLives((l) => Math.max(0, l - 1));
        }
        return next;
      });

      // timer
      setTimeLeft((t) => Math.max(0, t - 1 / 60));
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // background
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, "#050816");
      gradient.addColorStop(1, "#020617");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // stars
      ctx.fillStyle = "#ffffff33";
      for (let i = 0; i < 70; i++) {
        ctx.beginPath();
        ctx.arc(
          (i * 97) % GAME_WIDTH,
          (i * 53 + tick * 0.3) % GAME_HEIGHT,
          1.1,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // player
      ctx.save();
      ctx.translate(playerX, playerY);
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(20, 22);
      ctx.lineTo(-20, 22);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(0, -5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // legs
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(playerX - 10, playerY + 20, 6, 14);
      ctx.fillRect(playerX + 4, playerY + 20, 6, 14);

      // laser
      if (laser) {
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(laser.x, laser.y);
        ctx.lineTo(laser.x, laser.y + 25);
        ctx.stroke();
      }

      // rocks
      rocks.forEach((r) => {
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(((r.y + tick) / 80) % (Math.PI * 2));
        ctx.fillStyle = r.type === ROCK_TYPES.BAD ? "#ef4444" : "#22c55e";
        ctx.beginPath();
        ctx.moveTo(-r.radius, -r.radius / 2);
        ctx.lineTo(0, -r.radius);
        ctx.lineTo(r.radius, -r.radius / 2);
        ctx.lineTo(r.radius * 0.7, r.radius);
        ctx.lineTo(-r.radius * 0.7, r.radius);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.font = "11px 'Fredoka', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const maxWidth = r.radius * 1.6;
        const words = r.text.split(" ");
        let line = "";
        let lines = [];
        for (let w of words) {
          const test = line + (line ? " " : "") + w;
          if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = w;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);

        lines.forEach((ln, idx) => {
          ctx.fillText(ln, 0, -5 + idx * 13);
        });

        ctx.restore();
      });
    };

    const loop = () => {
      update();
      draw();

      setTimeLeft((t) => {
        if (t <= 0) {
          setRunning(false);
          setGameOver(true);
          saveScore(score);
        }
        return t;
      });

      setLives((l) => {
        if (l <= 0) {
          setRunning(false);
          setGameOver(true);
          saveScore(score);
        }
        return l;
      });

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, playerX, laser, rocks, difficulty, score, lives, timeLeft]);

  const startGame = () => {
    setScore(0);
    setRank("CADET");
    setTimeLeft(60);
    setLives(3);
    setLaser(null);
    setRocks([]);
    setDifficulty(1);
    setGameOver(false);
    setRunning(true);
  };

  // ========= UI =========
  return (
    <div style={styles.wrapper}>
      <div style={styles.gameAndSidebar}>
        <div style={styles.gamePanel}>
          <div style={styles.topBar}>
            <div style={styles.topStat}>
              <span style={styles.label}>SCORE</span>
              <span style={styles.value}>{score}</span>
            </div>
            <div style={styles.rankBadge}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>RANK</span>
              <span style={{ fontWeight: 700 }}>{rank}</span>
            </div>
            <div style={styles.topStat}>
              <span style={styles.label}>TIME</span>
              <span style={styles.value}>{Math.ceil(timeLeft)}s</span>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            style={styles.canvas}
          />

          <div style={styles.instructions}>
            <strong>Controls:</strong> Use <kbd>A</kbd>/<kbd>D</kbd> or arrow
            keys to move. Press <kbd>Space</kbd> to shoot the{" "}
            <span style={{ color: "#f97316" }}>phishing rocks (red)</span>. Don’t
            hit the safe ones (<span style={{ color: "#22c55e" }}>green</span>)!
          </div>

          <div style={styles.buttonsRow}>
            {!running && !gameOver && (
              <button style={styles.primaryButton} onClick={startGame}>
                🚀 Start mission
              </button>
            )}
            {gameOver && (
              <button style={styles.primaryButton} onClick={startGame}>
                🔁 Play again
              </button>
            )}
            {running && (
              <button
                style={styles.secondaryButton}
                onClick={() => setRunning(false)}
              >
                ⏸ Pause
              </button>
            )}
          </div>

          {gameOver && (
            <div style={styles.overlay}>
              <div style={styles.overlayCard}>
                <h2 style={{ marginBottom: "0.5rem" }}>Mission complete! 🎉</h2>
                <p style={{ marginBottom: "0.2rem" }}>Final score: {score}</p>
                <p style={{ marginBottom: "0.8rem" }}>Rank: {rank}</p>

                <h3 style={{ fontSize: "1rem", marginBottom: "0.3rem" }}>
                  What did you learn?
                </h3>
                <ul style={styles.tipList}>
                  <li>Red rocks are phishing lures – they’re trying to trick you.</li>
                  <li>
                    Real sites don’t promise free rewards or Robux just for clicking.
                  </li>
                  <li>
                    Always check the message carefully before you “shoot” (click).
                  </li>
                </ul>

                <button style={styles.primaryButton} onClick={startGame}>
                  Play again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== Right-hand leaderboard ===== */}
        <aside style={styles.sidebar}>
          <h3 style={{ marginBottom: "0.5rem" }}>Game Leaderboard</h3>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: "0.5rem" }}>
            Top players for this mission.
          </p>

          {leaderboard.length === 0 ? (
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              No scores yet. Be the first cadet to record a high score! 🚀
            </p>
          ) : (
            <ol style={styles.leaderList}>
              {leaderboard.map((item, index) => (
                <li key={index} style={styles.leaderRow}>
                  <span style={styles.leaderRank}>{index + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={styles.leaderName}>{item.username}</div>
                    <div style={styles.leaderScore}>{item.score} pts</div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {isSaving && (
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: "0.5rem" }}>
              Saving score…
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

// --------- simple inline styles ---------
const styles = {
  wrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "1.5rem 0 2rem",
  },
  gameAndSidebar: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "flex-start",
  },
  gamePanel: {
    position: "relative",
    background: "rgba(15,23,42,0.96)",
    borderRadius: 24,
    padding: "1rem 1rem 1.5rem",
    boxShadow: "0 24px 60px rgba(15,23,42,0.65)",
    border: "1px solid rgba(148,163,184,0.35)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.7rem",
    color: "white",
  },
  topStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.7,
  },
  value: {
    fontWeight: 700,
    fontSize: 20,
  },
  rankBadge: {
    minWidth: 130,
    height: 40,
    borderRadius: 999,
    background: "linear-gradient(90deg,#22c55e,#a3e635)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#0f172a",
    boxShadow: "0 12px 30px rgba(34,197,94,0.55)",
  },
  canvas: {
    borderRadius: 20,
    display: "block",
    background: "#020617",
  },
  instructions: {
    fontSize: 13,
    color: "#e5e7eb",
    marginTop: "0.75rem",
  },
  buttonsRow: {
    marginTop: "0.9rem",
    display: "flex",
    gap: "0.75rem",
  },
  primaryButton: {
    border: "none",
    borderRadius: 999,
    padding: "0.55rem 1.4rem",
    background:
      "linear-gradient(135deg, #f97316 0%, #fb923c 45%, #facc15 100%)",
    color: "#0f172a",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    borderRadius: 999,
    border: "1px solid #e5e7eb44",
    padding: "0.55rem 1.4rem",
    background: "transparent",
    color: "#e5e7eb",
    cursor: "pointer",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(8px)",
  },
  overlayCard: {
    background: "#020617",
    borderRadius: 20,
    padding: "1.4rem 1.6rem",
    color: "#e5e7eb",
    maxWidth: 420,
    textAlign: "left",
    boxShadow: "0 20px 50px rgba(15,23,42,0.9)",
  },
  tipList: {
    fontSize: 13,
    marginBottom: "1rem",
    paddingLeft: "1.2rem",
  },
  sidebar: {
    width: 260,
    background: "white",
    borderRadius: 24,
    padding: "1rem 1.1rem 1.2rem",
    boxShadow: "0 14px 40px rgba(15,23,42,0.18)",
    border: "1px solid rgba(148,163,184,0.45)",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
  },
  leaderList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  leaderRow: {
    display: "flex",
    alignItems: "center",
    padding: "0.35rem 0",
    borderBottom: "1px solid #e5e7eb",
  },
  leaderRank: {
    width: 24,
    fontWeight: 700,
    color: "#6b7280",
    fontSize: 13,
  },
  leaderName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
  },
  leaderScore: {
    fontSize: 12,
    color: "#6b7280",
  },
};
