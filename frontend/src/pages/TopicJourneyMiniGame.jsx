import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";

/**
 * Topic 1: Digital Footprint Trail Run (side runner + "THINK" slow mode + footprints meter)
 * Topic 2: Treasure Guard (top-down + block pirates asking info + deliver treasure)
 * Topic 3: Password Forge (platform-ish lane + collect tiles to build strong passphrase)
 * Topic 4: Privacy Switch Maze (top-down maze + toggle privacy switches to open gates)
 *
 * All:
 * - Big responsive canvas
 * - Keyboard controls + big on-screen controls
 * - Score + End screen
 * - Save score to backend /scores
 */

// ---------- Shared helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

function useCanvasSize(containerRef, targetAspect = 16 / 9) {
  const [size, setSize] = useState({ w: 1200, h: 675 });

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;

      // Keep aspect ratio but fill as much as possible
      let w = cw;
      let h = Math.round(w / targetAspect);
      if (h > ch) {
        h = ch;
        w = Math.round(h * targetAspect);
      }

      setSize({ w: Math.max(900, w), h: Math.max(520, h) });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, targetAspect]);

  return size;
}

function BigControls({ keysRef, disabled }) {
  // Big on-screen buttons for kids / mobile
  const setKey = (name, val) => {
    if (!keysRef.current) return;
    keysRef.current[name] = val;
  };

  return (
    <div style={ui.controlsWrap}>
      <div style={ui.controlsCol}>
        <button
          disabled={disabled}
          style={ui.bigBtn}
          onMouseDown={() => setKey("up", true)}
          onMouseUp={() => setKey("up", false)}
          onMouseLeave={() => setKey("up", false)}
          onTouchStart={() => setKey("up", true)}
          onTouchEnd={() => setKey("up", false)}
        >
          ⬆
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            disabled={disabled}
            style={ui.bigBtn}
            onMouseDown={() => setKey("left", true)}
            onMouseUp={() => setKey("left", false)}
            onMouseLeave={() => setKey("left", false)}
            onTouchStart={() => setKey("left", true)}
            onTouchEnd={() => setKey("left", false)}
          >
            ⬅
          </button>
          <button
            disabled={disabled}
            style={ui.bigBtn}
            onMouseDown={() => setKey("right", true)}
            onMouseUp={() => setKey("right", false)}
            onMouseLeave={() => setKey("right", false)}
            onTouchStart={() => setKey("right", true)}
            onTouchEnd={() => setKey("right", false)}
          >
            ➡
          </button>
        </div>
        <button
          disabled={disabled}
          style={ui.bigBtn}
          onMouseDown={() => setKey("down", true)}
          onMouseUp={() => setKey("down", false)}
          onMouseLeave={() => setKey("down", false)}
          onTouchStart={() => setKey("down", true)}
          onTouchEnd={() => setKey("down", false)}
        >
          ⬇
        </button>
      </div>

      <div style={ui.controlsCol}>
        <button
          disabled={disabled}
          style={{ ...ui.bigBtn, width: 160 }}
          onMouseDown={() => setKey("action", true)}
          onMouseUp={() => setKey("action", false)}
          onMouseLeave={() => setKey("action", false)}
          onTouchStart={() => setKey("action", true)}
          onTouchEnd={() => setKey("action", false)}
        >
          ⭐ ACTION
        </button>

        <button
          disabled={disabled}
          style={{ ...ui.bigBtn, width: 160 }}
          onMouseDown={() => setKey("think", true)}
          onMouseUp={() => setKey("think", false)}
          onMouseLeave={() => setKey("think", false)}
          onTouchStart={() => setKey("think", true)}
          onTouchEnd={() => setKey("think", false)}
        >
          🧠 THINK
        </button>
      </div>
    </div>
  );
}

async function saveScoreToBackend({ userId, gameId, score }) {
  if (!userId || !gameId) return;
  try {
    await api.post("/scores", { user_id: userId, game_id: gameId, score });
  } catch (e) {
    // don’t break gameplay UI if backend fails
    console.error("Score save failed:", e?.response?.data || e.message);
  }
}

// ---------- A shared “mission frame” ----------
function MissionFrame({
    title,
    subtitle,
    instructions,
    badgeLeft,
    badgeRight,
    children,
    onBack,
    theme = "ocean",
    embedded = false, // ✅ NEW
  }) {
    const themeVars = theme === "ocean" ? ui.themeOcean : ui.themeSunset;
  
    // ✅ EMBEDDED: no full-page chrome
    if (embedded) {
      return (
        <div style={{ ...ui.embedWrap, ...themeVars }}>
          {/* compact header row */}
          <div style={ui.embedTop}>
            <div style={ui.embedTitle}>
              <div style={ui.embedTitleMain}>{title}</div>
              <div style={ui.embedTitleSub}>{subtitle}</div>
            </div>
            <div style={ui.embedBadges}>
              <div style={ui.embedBadge}>{badgeLeft}</div>
              <div style={ui.embedBadge}>{badgeRight}</div>
            </div>
          </div>
  
          {/* compact goal */}
          <div style={ui.embedGoal}>{instructions}</div>
  
          {children}
        </div>
      );
    }
  
    // FULL PAGE (optional)
    return (
      <div style={{ ...ui.page, ...themeVars }}>
        <div style={ui.topBar}>
          <button style={ui.backBtn} onClick={onBack}>
            ⬅ Back
          </button>
  
          <div style={ui.titleBlock}>
            <div style={ui.title}>{title}</div>
            <div style={ui.subTitle}>{subtitle}</div>
          </div>
  
          <div style={ui.badges}>
            <div style={ui.badge}>{badgeLeft}</div>
            <div style={ui.badge}>{badgeRight}</div>
          </div>
        </div>
  
        <div style={ui.instructionsCard}>
          <div style={ui.instructionsTitle}>🎯 Goal + Controls</div>
          <div style={ui.instructionsText}>{instructions}</div>
        </div>
  
        {children}
      </div>
    );
  }
  

// ============================================================
// TOPIC 1 — Digital Footprint Trail Run
// mechanic: side-runner journey, jump with ACTION, THINK slows time,
// collect ✅ “Good Posts” to increase score, avoid ❌ “Overshare” traps,
// reach finish line. Footprint meter punishes mistakes.
// ============================================================
export function DigitalFootprintJourney2D({ userId, gameId, onBack, embedded = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, action: false, think: false });

  const { w, h } = useCanvasSize(containerRef, 16 / 9);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [footprints, setFootprints] = useState(0); // lower is better
  const [distanceRun, setDistanceRun] = useState(0);
  const [saving, setSaving] = useState(false);

  // world state in refs for smooth animation
  const stateRef = useRef({
    t: 0,
    player: { x: 120, y: 0, vy: 0, grounded: true },
    items: [],
    clouds: [],
    finishX: 5200,
  });

  const theme = "ocean";

  // keyboard listeners
  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = true;
      if (e.code === "Space") keys.current.action = true; // jump
      if (e.key === "Shift") keys.current.think = true; // slow
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = false;
      if (e.code === "Space") keys.current.action = false;
      if (e.key === "Shift") keys.current.think = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const reset = () => {
    stateRef.current = {
      t: 0,
      player: { x: 120, y: 0, vy: 0, grounded: true },
      items: [],
      clouds: Array.from({ length: 10 }).map((_, i) => ({
        x: i * 600 + rand(0, 300),
        y: rand(40, 160),
        s: rand(0.3, 0.7),
      })),
      finishX: 5200,
    };
    setScore(0);
    setFootprints(0);
    setDistanceRun(0);
    setDone(false);
    setRunning(true);
  };

  // spawn items along the road
  const ensureItems = () => {
    const st = stateRef.current;
    if (st.items.length > 0) return;
    const goodWords = ["Be kind ✅", "Ask first ✅", "Think ✅", "Privacy ✅", "Positive ✅"];
    const badWords = ["Overshare ❌", "Post ID ❌", "Live location ❌", "DM stranger ❌", "Click now ❌"];
    for (let x = 450; x < st.finishX - 200; x += 260) {
      const isBad = Math.random() < 0.35;
      st.items.push({
        id: Math.random().toString(36).slice(2),
        x,
        y: 0,
        r: 22,
        type: isBad ? "bad" : "good",
        text: isBad
          ? badWords[Math.floor(rand(0, badWords.length))]
          : goodWords[Math.floor(rand(0, goodWords.length))],
      });
    }
  };

  const finish = async () => {
    setRunning(false);
    setDone(true);
    setSaving(true);
    await saveScoreToBackend({ userId, gameId, score: Math.max(0, score - footprints * 10) });
    setSaving(false);
  };

  useEffect(() => {
    if (!running) return;
    ensureItems();

    let raf;
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const st = stateRef.current;
      st.t += 1;

      const slow = keys.current.think ? 0.45 : 1;
      const dt = 1 * slow;

      const groundY = h * 0.72;

      // movement
      let speed = 5.2 * dt;
      // auto forward to feel like “journey”
      st.player.x += speed + (keys.current.right ? 2.0 * dt : 0) - (keys.current.left ? 2.4 * dt : 0);

      // jump (ACTION)
      if (keys.current.action && st.player.grounded) {
        st.player.vy = -15.5;
        st.player.grounded = false;
      }

      // gravity
      st.player.vy += 0.8 * dt;
      st.player.y += st.player.vy * dt;

      if (st.player.y > 0) {
        st.player.y = 0;
        st.player.vy = 0;
        st.player.grounded = true;
      }

      // progress
      setDistanceRun(Math.floor((st.player.x / st.finishX) * 100));

      // collisions
      const px = st.player.x;
      const py = groundY - 55 - st.player.y; // y above ground
      for (const item of st.items) {
        if (item.hit) continue;
        const ix = item.x;
        const iy = groundY - 25;
        if (dist(px, py, ix, iy) < 46) {
          item.hit = true;
          if (item.type === "good") {
            setScore((s) => s + 80);
          } else {
            setFootprints((f) => f + 1);
            setScore((s) => Math.max(0, s - 30));
          }
        }
      }

      // finish check
      if (st.player.x >= st.finishX) {
        finish();
        return;
      }

      // draw
      ctx.clearRect(0, 0, w, h);

      // background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0b1020");
      grad.addColorStop(1, "#06111a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // clouds + stars
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < 90; i++) {
        ctx.beginPath();
        ctx.arc((i * 97) % w, (i * 61 + st.t * 0.6) % (h * 0.7), 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // camera follow
      const camX = clamp(px - w * 0.35, 0, st.finishX - w * 0.2);

      // road
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, groundY, w, h - groundY);

      // dashed line
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 3;
      ctx.setLineDash([18, 14]);
      ctx.beginPath();
      ctx.moveTo(0, groundY + 42);
      ctx.lineTo(w, groundY + 42);
      ctx.stroke();
      ctx.setLineDash([]);

      // items
      for (const item of st.items) {
        if (item.hit) continue;
        const x = item.x - camX;
        if (x < -80 || x > w + 80) continue;

        ctx.beginPath();
        ctx.fillStyle = item.type === "good" ? "#22c55e" : "#ef4444";
        ctx.arc(x, groundY - 25, item.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0b1020";
        ctx.font = `700 ${Math.round(w * 0.016)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(item.type === "good" ? "✅" : "⚠️", x, groundY - 20);

        // label
        ctx.font = `600 ${Math.round(w * 0.014)}px system-ui`;
        ctx.fillStyle = "rgba(226,232,240,0.95)";
        ctx.fillText(item.text, x, groundY - 55);
      }

      // finish flag
      const fx = st.finishX - camX;
      if (fx > -100 && fx < w + 100) {
        ctx.fillStyle = "#eab308";
        ctx.fillRect(fx - 10, groundY - 170, 8, 170);
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(fx - 2, groundY - 160);
        ctx.lineTo(fx + 70, groundY - 135);
        ctx.lineTo(fx - 2, groundY - 110);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = `800 ${Math.round(w * 0.022)}px system-ui`;
        ctx.textAlign = "left";
        ctx.fillText("FINISH", fx + 80, groundY - 130);
      }

      // player
      const rx = px - camX;
      ctx.save();
      ctx.translate(rx, py);
      // body
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.roundRect(-22, -34, 44, 48, 14);
      ctx.fill();
      // face
      ctx.fillStyle = "#0b1020";
      ctx.beginPath();
      ctx.arc(-8, -12, 4, 0, Math.PI * 2);
      ctx.arc(8, -12, 4, 0, Math.PI * 2);
      ctx.fill();
      // cape
      ctx.fillStyle = "rgba(34,197,94,0.65)";
      ctx.beginPath();
      ctx.moveTo(-22, -30);
      ctx.lineTo(-56, -18);
      ctx.lineTo(-22, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // HUD overlay
      ctx.fillStyle = "rgba(2,6,23,0.5)";
      ctx.fillRect(18, 18, w - 36, 64);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `800 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText("👣 Digital Footprint Trail Run", 32, 58);

      // meters
      const safeScore = Math.max(0, score - footprints * 10);
      ctx.font = `700 ${Math.round(w * 0.016)}px system-ui`;
      ctx.textAlign = "right";
      ctx.fillText(`Score: ${safeScore}`, w - 28, 44);
      ctx.fillText(`Footprints: ${footprints}`, w - 28, 66);

      // progress bar
      const pct = clamp((px / st.finishX) * 100, 0, 100);
      ctx.fillStyle = "rgba(148,163,184,0.25)";
      ctx.fillRect(32, 76, w - 64, 10);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(32, 76, ((w - 64) * pct) / 100, 10);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, w, h, score, footprints]);

  const instructions = (
    <>
      <b>Goal:</b> Reach the finish line while keeping your footprint “clean”. Collect ✅ good choices, avoid ⚠️ oversharing traps.
      <br />
      <b>Controls:</b> Move ⬅➡ (or A/D). Jump = SPACE / ⭐ ACTION. Hold 🧠 THINK (Shift) to slow down and choose safely.
    </>
  );

  const safeScore = Math.max(0, score - footprints * 10);

  return (
    <MissionFrame
      embedded={embedded}
      title="Topic 1 Mini-Game"
      subtitle="My Digital Footprint — Journey Run"
      instructions={instructions}
      badgeLeft={`👣 Footprints: ${footprints}`}
      badgeRight={`🏆 Score: ${safeScore}`}
      onBack={onBack || (() => window.history.back())}
      theme={theme}
    >
      <div ref={containerRef} style={ui.gameArea}>
        <div style={ui.canvasShell}>
          <canvas ref={canvasRef} width={w} height={h} style={ui.canvas} />
          {(!running && !done) && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Ready to run? 🏃‍♂️✨</div>
                <div style={ui.overlayText}>
                  Your mission is to make smart choices while you travel online.
                  Collect good choices, avoid oversharing, and finish strong!
                </div>
                <button style={ui.primaryBtn} onClick={reset}>🚀 Start Journey</button>
              </div>
            </div>
          )}

          {done && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Mission Complete! 🎉</div>
                <div style={ui.overlayText}>
                  Final Score: <b>{safeScore}</b>
                  <br />
                  Footprints: <b>{footprints}</b>
                </div>
                <div style={ui.overlaySmall}>{saving ? "Saving score..." : "Score saved ✅"}</div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button style={ui.primaryBtn} onClick={reset}>🔁 Play Again</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <BigControls keysRef={keys} disabled={!running} />
      </div>
    </MissionFrame>
  );
}

// ============================================================
// TOPIC 2 — Personal Info Treasure Guard (different game)
// mechanic: top-down journey, escort treasure to exit,
// “pirates” approach asking info; press ACTION near them to block with a “NO!” shield.
// Collect locks/keys for bonus.
// ============================================================
export function PersonalInfoJourney2D({ userId, gameId, onBack, embedded = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, action: false, think: false });
  const { w, h } = useCanvasSize(containerRef, 16 / 9);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);
  const [saving, setSaving] = useState(false);

  const stRef = useRef({
    t: 0,
    player: { x: 180, y: 220, r: 18 },
    treasure: { x: 160, y: 240, carried: true },
    exit: { x: 2600, y: 320, r: 36 },
    pirates: [],
    goodies: [],
    shield: { active: false, t: 0 },
    camX: 0,
  });

  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = true;
      if (e.code === "Space") keys.current.action = true;
      if (e.key === "Shift") keys.current.think = true;
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = false;
      if (e.code === "Space") keys.current.action = false;
      if (e.key === "Shift") keys.current.think = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const reset = () => {
    stRef.current = {
      t: 0,
      player: { x: 180, y: 220, r: 18 },
      treasure: { x: 160, y: 240, carried: true },
      exit: { x: 2600, y: 320, r: 36 },
      pirates: Array.from({ length: 10 }).map((_, i) => ({
        id: "p" + i,
        x: 520 + i * 220 + rand(-40, 40),
        y: rand(140, 520),
        r: 18,
        speed: rand(0.6, 1.2),
        msg: ["Name?", "Birthday?", "School?", "Address?", "Password?"][Math.floor(rand(0, 5))],
        hit: false,
      })),
      goodies: Array.from({ length: 14 }).map((_, i) => ({
        id: "g" + i,
        x: 360 + i * 170 + rand(-30, 30),
        y: rand(140, 520),
        r: 14,
        taken: false,
      })),
      shield: { active: false, t: 0 },
      camX: 0,
    };
    setScore(0);
    setHp(3);
    setDone(false);
    setRunning(true);
  };

  const finish = async () => {
    setRunning(false);
    setDone(true);
    setSaving(true);
    await saveScoreToBackend({ userId, gameId, score });
    setSaving(false);
  };

  useEffect(() => {
    if (!running) return;

    let raf;
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const st = stRef.current;
      st.t++;

      const slow = keys.current.think ? 0.5 : 1;
      const dt = 1 * slow;

      // player move
      let vx = 0, vy = 0;
      if (keys.current.left) vx -= 4.4 * dt;
      if (keys.current.right) vx += 4.4 * dt;
      if (keys.current.up) vy -= 4.0 * dt;
      if (keys.current.down) vy += 4.0 * dt;

      st.player.x += vx;
      st.player.y += vy;

      // bounds
      st.player.y = clamp(st.player.y, 100, h - 120);

      // carry treasure
      if (st.treasure.carried) {
        st.treasure.x = st.player.x - 26;
        st.treasure.y = st.player.y + 16;
      }

      // action = shield pulse
      if (keys.current.action && !st.shield.active) {
        st.shield.active = true;
        st.shield.t = 24;
      }
      if (st.shield.active) {
        st.shield.t -= 1;
        if (st.shield.t <= 0) st.shield.active = false;
      }

      // camera follow (wide journey)
      st.camX = clamp(st.player.x - w * 0.35, 0, st.exit.x - w * 0.3);

      // goodies
      for (const g of st.goodies) {
        if (g.taken) continue;
        if (dist(st.player.x, st.player.y, g.x, g.y) < st.player.r + g.r + 6) {
          g.taken = true;
          setScore((s) => s + 60);
        }
      }

      // pirates chase
      for (const p of st.pirates) {
        if (p.hit) continue;
        // move toward player (but slow)
        const dx = st.player.x - p.x;
        const dy = st.player.y - p.y;
        const L = Math.max(1, Math.hypot(dx, dy));
        p.x += (dx / L) * p.speed * dt;
        p.y += (dy / L) * p.speed * dt;

        // if shield active and close => block pirate
        if (st.shield.active && dist(st.player.x, st.player.y, p.x, p.y) < 70) {
          p.hit = true;
          setScore((s) => s + 120);
        } else if (dist(st.player.x, st.player.y, p.x, p.y) < st.player.r + p.r + 6) {
          // pirate hits you => lose HP
          p.hit = true;
          setHp((hpNow) => Math.max(0, hpNow - 1));
        }
      }

      // lose condition
      if (hp <= 0) {
        setRunning(false);
        setDone(true);
        return;
      }

      // win condition: reach exit with treasure
      if (dist(st.player.x, st.player.y, st.exit.x, st.exit.y) < st.exit.r + 22) {
        setScore((s) => s + 200);
        finish();
        return;
      }

      // draw
      ctx.clearRect(0, 0, w, h);

      // background (ocean map)
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#081b2a");
      g.addColorStop(1, "#04111c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // path (sand)
      ctx.fillStyle = "rgba(234,179,8,0.12)";
      ctx.fillRect(0, 110, w, h - 200);

      // islands
      ctx.fillStyle = "rgba(34,197,94,0.22)";
      for (let i = 0; i < 8; i++) {
        const ix = ((i * 380 + st.t * 0.4) % (w + 400)) - 200;
        ctx.beginPath();
        ctx.ellipse(ix, 180 + (i % 3) * 140, 90, 36, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const camX = st.camX;

      // exit gate
      const ex = st.exit.x - camX;
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(ex, st.exit.y, st.exit.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("SAFE", ex, st.exit.y + 8);

      // goodies (keys)
      for (const k of st.goodies) {
        if (k.taken) continue;
        const x = k.x - camX;
        if (x < -80 || x > w + 80) continue;
        ctx.fillStyle = "#93c5fd";
        ctx.beginPath();
        ctx.arc(x, k.y, k.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.018)}px system-ui`;
        ctx.fillText("🔑", x, k.y + 6);
      }

      // pirates
      for (const p of st.pirates) {
        if (p.hit) continue;
        const x = p.x - camX;
        if (x < -120 || x > w + 120) continue;

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.018)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("🏴‍☠️", x, p.y + 6);

        // speech bubble
        ctx.fillStyle = "rgba(226,232,240,0.95)";
        ctx.font = `800 ${Math.round(w * 0.014)}px system-ui`;
        ctx.fillText(p.msg, x, p.y - 26);
      }

      // treasure
      const tx = st.treasure.x - camX;
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.roundRect(tx - 18, st.treasure.y - 14, 36, 28, 10);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("💎", tx, st.treasure.y + 6);

      // player
      const px = st.player.x - camX;
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.roundRect(px - 18, st.player.y - 22, 36, 44, 12);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
      ctx.fillText("🛡️", px, st.player.y + 6);

      // shield ring
      if (st.shield.active) {
        ctx.strokeStyle = "rgba(34,197,94,0.85)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(px, st.player.y, 58, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(226,232,240,0.9)";
        ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
        ctx.fillText("NO!", px, st.player.y - 60);
      }

      // HUD
      ctx.fillStyle = "rgba(2,6,23,0.55)";
      ctx.fillRect(18, 18, w - 36, 62);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText("🧰 Personal Info Treasure Guard", 32, 56);

      ctx.textAlign = "right";
      ctx.font = `800 ${Math.round(w * 0.016)}px system-ui`;
      ctx.fillText(`Score: ${score}`, w - 28, 44);
      ctx.fillText(`Lives: ${"❤️".repeat(hp)}`, w - 28, 66);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, w, h, score, hp]);

  const instructions = (
    <>
      <b>Goal:</b> Escort the 💎 treasure to the green SAFE zone. Pirates will ask for your info—block them!
      <br />
      <b>Controls:</b> Move ⬅⬆⬇➡. Press ⭐ ACTION to shout <b>NO!</b> shield near pirates. Hold 🧠 THINK to slow down.
    </>
  );

  return (
    <MissionFrame
      embedded={embedded}
      title="Topic 2 Mini-Game"
      subtitle="Personal Information — Treasure Guard Journey"
      instructions={instructions}
      badgeLeft={`❤️ Lives: ${hp}`}
      badgeRight={`🏆 Score: ${score}`}
      onBack={onBack || (() => window.history.back())}
      theme="ocean"
    >
      <div ref={containerRef} style={ui.gameArea}>
        <div style={ui.canvasShell}>
          <canvas ref={canvasRef} width={w} height={h} style={ui.canvas} />

          {(!running && !done) && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Guard your treasure! 💎</div>
                <div style={ui.overlayText}>
                  Pirates want your personal info. Use your shield to block them and reach the SAFE zone.
                </div>
                <button style={ui.primaryBtn} onClick={reset}>🧭 Start Journey</button>
              </div>
            </div>
          )}

          {done && !running && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>{hp > 0 ? "You made it! 🎉" : "Oof! Try again 💪"}</div>
                <div style={ui.overlayText}>Final Score: <b>{score}</b></div>
                <div style={ui.overlaySmall}>{saving ? "Saving score..." : "Score saved ✅"}</div>
                <button style={ui.primaryBtn} onClick={reset}>🔁 Play Again</button>
              </div>
            </div>
          )}
        </div>

        <BigControls keysRef={keys} disabled={!running} />
      </div>
    </MissionFrame>
  );
}

// ============================================================
// TOPIC 3 — Password Forge (different game)
// mechanic: lane runner + collect password tiles to build a strong passphrase.
// Collect: LENGTH, SYMBOL, NUMBER, UNIQUE. Avoid REUSE goblins.
// When you collect all 4, you unlock the gate and finish.
// ============================================================
export function PasswordsJourney2D({ userId, gameId, onBack, embedded = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, action: false, think: false });
  const { w, h } = useCanvasSize(containerRef, 16 / 9);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [parts, setParts] = useState({ length: false, symbol: false, number: false, unique: false });
  const [strikes, setStrikes] = useState(0);
  const [saving, setSaving] = useState(false);

  const stRef = useRef({
    t: 0,
    lane: 1, // 0,1,2
    x: 0,
    items: [],
    gateX: 3600,
  });

  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = true;
      if (e.code === "Space") keys.current.action = true;
      if (e.key === "Shift") keys.current.think = true;
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = false;
      if (e.code === "Space") keys.current.action = false;
      if (e.key === "Shift") keys.current.think = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const reset = () => {
    stRef.current = {
      t: 0,
      lane: 1,
      x: 0,
      gateX: 3600,
      items: [],
    };

    // spawn items along journey
    const types = [
      { k: "length", label: "LONG", emoji: "📏", good: true },
      { k: "symbol", label: "SYMBOL", emoji: "✨", good: true },
      { k: "number", label: "NUMBER", emoji: "🔢", good: true },
      { k: "unique", label: "UNIQUE", emoji: "🧬", good: true },
      { k: "reuse", label: "REUSE!", emoji: "👾", good: false },
    ];

    for (let x = 280; x < 3400; x += 200) {
      const lane = Math.floor(rand(0, 3));
      const pick = Math.random() < 0.22
        ? types.find((t) => t.k === "reuse")
        : types[Math.floor(rand(0, 4))];

      stRef.current.items.push({
        id: Math.random().toString(36).slice(2),
        x,
        lane,
        type: pick.k,
        label: pick.label,
        emoji: pick.emoji,
        good: pick.good,
        taken: false,
      });
    }

    setScore(0);
    setParts({ length: false, symbol: false, number: false, unique: false });
    setStrikes(0);
    setDone(false);
    setRunning(true);
  };

  const allComplete = parts.length && parts.symbol && parts.number && parts.unique;

  const finish = async () => {
    setRunning(false);
    setDone(true);
    setSaving(true);
    await saveScoreToBackend({ userId, gameId, score });
    setSaving(false);
  };

  useEffect(() => {
    if (!running) return;

    let raf;
    const loop = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const st = stRef.current;
      st.t++;

      const slow = keys.current.think ? 0.55 : 1;
      const dt = 1 * slow;

      // lane change
      if (keys.current.up) { st.lane = clamp(st.lane - 1, 0, 2); keys.current.up = false; }
      if (keys.current.down) { st.lane = clamp(st.lane + 1, 0, 2); keys.current.down = false; }

      // forward
      st.x += 6.0 * dt;

      // collision check at player position
      const playerX = st.x + 140;
      const laneY = (lane) => h * (0.34 + lane * 0.18);

      for (const it of st.items) {
        if (it.taken) continue;
        const dx = Math.abs((it.x) - playerX);
        const dy = Math.abs(laneY(it.lane) - laneY(st.lane));
        if (dx < 34 && dy < 18) {
          it.taken = true;
          if (it.good) {
            setParts((p) => ({ ...p, [it.type]: true }));
            setScore((s) => s + 120);
          } else {
            setStrikes((k) => k + 1);
            setScore((s) => Math.max(0, s - 80));
          }
        }
      }

      // win: pass gate AND all parts collected
      if (st.x >= st.gateX && allComplete) {
        setScore((s) => s + 250);
        finish();
        return;
      }

      // draw
      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0a1224");
      bg.addColorStop(1, "#071024");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // track
      ctx.fillStyle = "rgba(148,163,184,0.10)";
      ctx.fillRect(0, h * 0.24, w, h * 0.56);

      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = "rgba(226,232,240,0.12)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h * (0.34 + i * 0.18));
        ctx.lineTo(w, h * (0.34 + i * 0.18));
        ctx.stroke();
      }

      // camera
      const cam = st.x;

      // items
      for (const it of st.items) {
        if (it.taken) continue;
        const x = it.x - cam + 140;
        if (x < -80 || x > w + 80) continue;

        const y = laneY(it.lane);
        ctx.fillStyle = it.good ? "#22c55e" : "#ef4444";
        ctx.beginPath();
        ctx.roundRect(x - 28, y - 22, 56, 44, 12);
        ctx.fill();

        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.018)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(it.emoji, x, y + 8);

        ctx.fillStyle = "rgba(226,232,240,0.95)";
        ctx.font = `800 ${Math.round(w * 0.013)}px system-ui`;
        ctx.fillText(it.label, x, y - 30);
      }

      // gate
      const gateX = st.gateX - cam + 140;
      ctx.fillStyle = allComplete ? "#22c55e" : "#f59e0b";
      ctx.fillRect(gateX - 18, h * 0.24, 36, h * 0.56);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText(allComplete ? "OPEN!" : "LOCKED", gateX + 30, h * 0.18);

      // player
      const py = laneY(st.lane);
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.roundRect(120, py - 26, 64, 52, 16);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.018)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("🔐", 152, py + 10);

      // HUD
      ctx.fillStyle = "rgba(2,6,23,0.60)";
      ctx.fillRect(18, 18, w - 36, 92);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText("🏰 Password Forge Journey", 32, 52);

      ctx.textAlign = "right";
      ctx.font = `800 ${Math.round(w * 0.016)}px system-ui`;
      ctx.fillText(`Score: ${score}`, w - 28, 44);
      ctx.fillText(`Strikes: ${strikes}`, w - 28, 70);

      // parts bar
      const partChip = (ok, label, x) => {
        ctx.fillStyle = ok ? "#22c55e" : "rgba(148,163,184,0.25)";
        ctx.beginPath();
        ctx.roundRect(x, 66, 140, 34, 14);
        ctx.fill();
        ctx.fillStyle = ok ? "#0b1020" : "rgba(226,232,240,0.9)";
        ctx.font = `900 ${Math.round(w * 0.013)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(label, x + 70, 90);
      };

      partChip(parts.length, "📏 LENGTH", 32);
      partChip(parts.symbol, "✨ SYMBOL", 184);
      partChip(parts.number, "🔢 NUMBER", 336);
      partChip(parts.unique, "🧬 UNIQUE", 488);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, w, h, score, parts, strikes, allComplete]);

  const instructions = (
    <>
      <b>Goal:</b> Build a strong password by collecting 4 parts: LENGTH, SYMBOL, NUMBER, UNIQUE. Avoid 👾 REUSE traps.
      <br />
      <b>Controls:</b> Use ⬆⬇ to switch lanes. Hold 🧠 THINK to slow down. Reach the gate only when all parts are collected.
    </>
  );

  return (
    <MissionFrame
      embedded={embedded}
      title="Topic 3 Mini-Game"
      subtitle="Passwords — Forge a Strong Passphrase"
      instructions={instructions}
      badgeLeft={`🧩 Parts: ${Object.values(parts).filter(Boolean).length}/4`}
      badgeRight={`🏆 Score: ${score}`}
      onBack={onBack || (() => window.history.back())}
      theme="ocean"
    >
      <div ref={containerRef} style={ui.gameArea}>
        <div style={ui.canvasShell}>
          <canvas ref={canvasRef} width={w} height={h} style={ui.canvas} />

          {(!running && !done) && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Forge your password! 🔐</div>
                <div style={ui.overlayText}>
                  Collect all 4 ingredients to unlock the gate. Avoid “REUSE” monsters!
                </div>
                <button style={ui.primaryBtn} onClick={reset}>⚒ Start Forge</button>
              </div>
            </div>
          )}

          {done && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Forge Complete! 🎉</div>
                <div style={ui.overlayText}>Final Score: <b>{score}</b></div>
                <div style={ui.overlaySmall}>{saving ? "Saving score..." : "Score saved ✅"}</div>
                <button style={ui.primaryBtn} onClick={reset}>🔁 Play Again</button>
              </div>
            </div>
          )}
        </div>

        <BigControls keysRef={keys} disabled={!running} />
      </div>
    </MissionFrame>
  );
}

// ============================================================
// TOPIC 4 — Social Media Privacy Switch Maze (different game)
// mechanic: maze journey with gates: PUBLIC gate blocks until you toggle switch to PRIVATE.
// Collect “settings icons”, avoid strangers. Use ACTION on switches.
// ============================================================
export function SocialMediaJourney2D({ userId, gameId, onBack, embedded = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const keys = useRef({ left: false, right: false, up: false, down: false, action: false, think: false });
  const { w, h } = useCanvasSize(containerRef, 16 / 9);

  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [privacy, setPrivacy] = useState("public"); // public/private
  const [saving, setSaving] = useState(false);

  const stRef = useRef({
    t: 0,
    player: { x: 160, y: 220, r: 18 },
    exit: { x: 2600, y: 420, r: 36 },
    switches: [
      { x: 700, y: 220, flipped: false },
      { x: 1500, y: 420, flipped: false },
      { x: 2100, y: 260, flipped: false },
    ],
    gates: [
      { x: 980, y: 180, w: 28, h: 260, needs: "private" },
      { x: 1760, y: 330, w: 28, h: 260, needs: "private" },
    ],
    strangers: Array.from({ length: 7 }).map((_, i) => ({
      x: 520 + i * 300 + rand(-40, 40),
      y: rand(150, 520),
      r: 18,
      alive: true,
      msg: ["DM?", "Follow me!", "Click link!", "Add me!", "Where u live?"][Math.floor(rand(0, 5))],
    })),
    pickups: Array.from({ length: 10 }).map((_, i) => ({
      x: 360 + i * 230 + rand(-30, 30),
      y: rand(160, 520),
      r: 14,
      taken: false,
    })),
    camX: 0,
  });

  useEffect(() => {
    const down = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = true;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = true;
      if (e.code === "Space") keys.current.action = true;
      if (e.key === "Shift") keys.current.think = true;
    };
    const up = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") keys.current.up = false;
      if (e.key === "ArrowDown" || e.key === "s") keys.current.down = false;
      if (e.code === "Space") keys.current.action = false;
      if (e.key === "Shift") keys.current.think = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const reset = () => {
    stRef.current.player = { x: 160, y: 220, r: 18 };
    stRef.current.camX = 0;

    // reset all items
    stRef.current.pickups.forEach((p) => (p.taken = false));
    stRef.current.strangers.forEach((s) => (s.alive = true));
    stRef.current.switches.forEach((sw) => (sw.flipped = false));

    setScore(0);
    setPrivacy("public");
    setDone(false);
    setRunning(true);
  };

  const finish = async () => {
    setRunning(false);
    setDone(true);
    setSaving(true);
    await saveScoreToBackend({ userId, gameId, score });
    setSaving(false);
  };

  const canPassGate = (gate) => privacy === gate.needs;

  useEffect(() => {
    if (!running) return;

    let raf;
    const loop = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      const st = stRef.current;
      st.t++;

      const slow = keys.current.think ? 0.55 : 1;
      const dt = 1 * slow;

      // move
      let nx = st.player.x;
      let ny = st.player.y;
      if (keys.current.left) nx -= 4.4 * dt;
      if (keys.current.right) nx += 4.4 * dt;
      if (keys.current.up) ny -= 4.1 * dt;
      if (keys.current.down) ny += 4.1 * dt;

      ny = clamp(ny, 110, h - 120);

      // check gates collision (block if privacy not correct)
      const tryMove = (tx, ty) => {
        for (const g of st.gates) {
          const gx = g.x;
          const gy = g.y;
          const gw = g.w;
          const gh = g.h;

          // AABB collision
          const px = tx, py = ty, pr = st.player.r;
          const hit =
            px + pr > gx &&
            px - pr < gx + gw &&
            py + pr > gy &&
            py - pr < gy + gh;

          if (hit && !canPassGate(g)) {
            return { x: st.player.x, y: st.player.y };
          }
        }
        return { x: tx, y: ty };
      };

      const moved = tryMove(nx, ny);
      st.player.x = moved.x;
      st.player.y = moved.y;

      // camera
      st.camX = clamp(st.player.x - w * 0.35, 0, st.exit.x - w * 0.3);

      // pickups
      for (const p of st.pickups) {
        if (p.taken) continue;
        if (dist(st.player.x, st.player.y, p.x, p.y) < st.player.r + p.r + 6) {
          p.taken = true;
          setScore((s) => s + 80);
        }
      }

      // strangers: if close while public => penalty, while private => ignore
      for (const s of st.strangers) {
        if (!s.alive) continue;
        if (dist(st.player.x, st.player.y, s.x, s.y) < 58) {
          if (privacy === "public") {
            s.alive = false;
            setScore((sc) => Math.max(0, sc - 100));
          }
        }
      }

      // action near switch toggles to private (one way per switch)
      if (keys.current.action) {
        for (const sw of st.switches) {
          if (!sw.flipped && dist(st.player.x, st.player.y, sw.x, sw.y) < 60) {
            sw.flipped = true;
            setPrivacy("private");
            setScore((s) => s + 120);
          }
        }
      }

      // win: reach exit
      if (dist(st.player.x, st.player.y, st.exit.x, st.exit.y) < st.exit.r + 22) {
        setScore((s) => s + 200);
        finish();
        return;
      }

      // draw
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0b1020");
      bg.addColorStop(1, "#040b14");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // city blocks
      ctx.fillStyle = "rgba(99,102,241,0.08)";
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.roundRect(((i * 260 + st.t * 0.5) % (w + 400)) - 200, 120 + (i % 4) * 120, 160, 64, 18);
        ctx.fill();
      }

      const cam = st.camX;

      // gates
      for (const g2 of st.gates) {
        const x = g2.x - cam;
        ctx.fillStyle = canPassGate(g2) ? "rgba(34,197,94,0.55)" : "rgba(245,158,11,0.55)";
        ctx.fillRect(x, g2.y, g2.w, g2.h);

        ctx.fillStyle = "rgba(226,232,240,0.9)";
        ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText(canPassGate(g2) ? "✅" : "🔒", x + g2.w / 2, g2.y - 10);
      }

      // switches
      for (const sw of st.switches) {
        const x = sw.x - cam;
        ctx.fillStyle = sw.flipped ? "#22c55e" : "#93c5fd";
        ctx.beginPath();
        ctx.roundRect(x - 22, sw.y - 18, 44, 36, 10);
        ctx.fill();

        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
        ctx.fillText(sw.flipped ? "PRIVATE" : "SWITCH", x, sw.y + 6);
      }

      // pickups
      for (const p2 of st.pickups) {
        if (p2.taken) continue;
        const x = p2.x - cam;
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(x, p2.y, p2.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("⚙️", x, p2.y + 6);
      }

      // strangers
      for (const s2 of st.strangers) {
        if (!s2.alive) continue;
        const x = s2.x - cam;
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(x, s2.y, s2.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0b1020";
        ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
        ctx.fillText("👤", x, s2.y + 6);

        ctx.fillStyle = "rgba(226,232,240,0.95)";
        ctx.font = `800 ${Math.round(w * 0.013)}px system-ui`;
        ctx.fillText(s2.msg, x, s2.y - 28);
      }

      // exit
      const ex = st.exit.x - cam;
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(ex, st.exit.y, st.exit.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.018)}px system-ui`;
      ctx.fillText("🏁", ex, st.exit.y + 8);

      // player
      const px = st.player.x - cam;
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.roundRect(px - 18, st.player.y - 22, 36, 44, 12);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.016)}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText("📱", px, st.player.y + 6);

      // privacy badge above player
      ctx.fillStyle = privacy === "private" ? "rgba(34,197,94,0.9)" : "rgba(245,158,11,0.9)";
      ctx.beginPath();
      ctx.roundRect(px - 54, st.player.y - 62, 108, 28, 12);
      ctx.fill();
      ctx.fillStyle = "#0b1020";
      ctx.font = `900 ${Math.round(w * 0.013)}px system-ui`;
      ctx.fillText(privacy.toUpperCase(), px, st.player.y - 42);

      // HUD
      ctx.fillStyle = "rgba(2,6,23,0.60)";
      ctx.fillRect(18, 18, w - 36, 72);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `900 ${Math.round(w * 0.02)}px system-ui`;
      ctx.textAlign = "left";
      ctx.fillText("🧭 Privacy Switch Maze Journey", 32, 52);

      ctx.textAlign = "right";
      ctx.font = `800 ${Math.round(w * 0.016)}px system-ui`;
      ctx.fillText(`Score: ${score}`, w - 28, 44);
      ctx.fillText(`Mode: ${privacy}`, w - 28, 68);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, w, h, score, privacy]);

  const instructions = (
    <>
      <b>Goal:</b> Reach the finish 🏁. Public mode is risky—strangers can drain your score.
      <br />
      <b>Controls:</b> Move with ⬅⬆⬇➡. Use ⭐ ACTION near a switch to turn <b>PRIVATE</b> and open 🔒 gates.
    </>
  );

  return (
    <MissionFrame
      embedded={embedded}
      title="Topic 4 Mini-Game"
      subtitle="Social Media Safety — Privacy Switch Maze"
      instructions={instructions}
      badgeLeft={`🔐 Mode: ${privacy}`}
      badgeRight={`🏆 Score: ${score}`}
      onBack={onBack || (() => window.history.back())}
      theme="ocean"
    >
      <div ref={containerRef} style={ui.gameArea}>
        <div style={ui.canvasShell}>
          <canvas ref={canvasRef} width={w} height={h} style={ui.canvas} />

          {(!running && !done) && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Set your privacy! 🔒</div>
                <div style={ui.overlayText}>
                  Find switches to turn PRIVATE and unlock gates. Avoid strangers when PUBLIC.
                </div>
                <button style={ui.primaryBtn} onClick={reset}>🧩 Start Maze</button>
              </div>
            </div>
          )}

          {done && (
            <div style={ui.overlay}>
              <div style={ui.overlayCard}>
                <div style={ui.overlayTitle}>Great job! 🎉</div>
                <div style={ui.overlayText}>Final Score: <b>{score}</b></div>
                <div style={ui.overlaySmall}>{saving ? "Saving score..." : "Score saved ✅"}</div>
                <button style={ui.primaryBtn} onClick={reset}>🔁 Play Again</button>
              </div>
            </div>
          )}
        </div>

        <BigControls keysRef={keys} disabled={!running} />
      </div>
    </MissionFrame>
  );
}

// ---------- UI styles (colors match your logo vibe: dark navy + sky/teal) ----------
const ui = {
  themeOcean: {
    background:
      "radial-gradient(1200px 700px at 15% 20%, rgba(98,174,218,0.20), transparent 60%), radial-gradient(900px 600px at 85% 10%, rgba(34,197,94,0.14), transparent 55%), linear-gradient(180deg, #050a12, #070f1b)",
  },
  themeSunset: {
    background:
      "radial-gradient(1200px 700px at 20% 10%, rgba(251,146,60,0.18), transparent 60%), radial-gradient(900px 600px at 85% 30%, rgba(99,102,241,0.18), transparent 55%), linear-gradient(180deg, #070a12, #0b1020)",
  },
  page: {
    minHeight: "100vh",
    width: "100%",
    padding: "18px 18px 28px",
    boxSizing: "border-box",
    color: "#e2e8f0",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  backBtn: {
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(2,6,23,0.5)",
    color: "#e2e8f0",
    borderRadius: 14,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  titleBlock: { flex: 1, minWidth: 260 },
  title: { fontSize: 26, fontWeight: 900, letterSpacing: 0.2 },
  subTitle: { opacity: 0.85, marginTop: 2, fontSize: 14, fontWeight: 600 },
  badges: { display: "flex", gap: 10 },
  badge: {
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.45)",
    borderRadius: 16,
    padding: "10px 12px",
    fontWeight: 800,
    minWidth: 140,
    textAlign: "center",
  },
  instructionsCard: {
    marginTop: 14,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.48)",
    borderRadius: 18,
    padding: "12px 14px",
  },
  instructionsTitle: { fontWeight: 900, fontSize: 14, marginBottom: 6 },
  instructionsText: { fontSize: 14, lineHeight: 1.35, opacity: 0.95 },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "rgba(2,6,23,0.50)",
    backdropFilter: "blur(6px)",
  },
  overlayCard: {
    width: "min(520px, 92%)",
    borderRadius: 18,
    background: "rgba(2,6,23,0.88)",
    border: "1px solid rgba(148,163,184,0.28)",
    padding: "18px 18px 16px",
    textAlign: "center",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
  },
  overlayTitle: { fontSize: 22, fontWeight: 900, marginBottom: 6 },
  overlayText: { opacity: 0.92, lineHeight: 1.35, marginBottom: 12, fontSize: 14 },
  overlaySmall: { opacity: 0.8, marginBottom: 10, fontSize: 12 },
  primaryBtn: {
    border: "none",
    borderRadius: 999,
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: 900,
    color: "#04111c",
    background: "linear-gradient(135deg, #62aeda, #22c55e)",
    boxShadow: "0 16px 40px rgba(98,174,218,0.25)",
  },

  controlsCol: { display: "flex", flexDirection: "column", gap: 10, alignItems: "center" },
 

//   ------------------------------------------------------------

embedWrap: {
    width: "100%",
    borderRadius: 18,
    padding: 12,
    boxSizing: "border-box",
  },
  embedTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  embedTitle: { minWidth: 240 },
  embedTitleMain: { fontSize: 18, fontWeight: 900, color: "#e2e8f0" },
  embedTitleSub: { fontSize: 12, fontWeight: 700, opacity: 0.85 },
  embedBadges: { display: "flex", gap: 8, flexWrap: "wrap" },
  embedBadge: {
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.45)",
    borderRadius: 14,
    padding: "8px 10px",
    fontWeight: 800,
    fontSize: 12,
    textAlign: "center",
    minWidth: 110,
  },
  embedGoal: {
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,6,23,0.35)",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 12,
    lineHeight: 1.3,
    marginBottom: 10,
    color: "#e2e8f0",
  },

  gameArea: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ IMPORTANT: make canvas always stay inside the card
  canvasShell: {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.22)",
    overflow: "hidden",
    boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
  },
  canvas: {
    display: "block",
    width: "100%",
    height: "auto",
    background: "#020617",
  },

  // ✅ reduce control size in embedded mode (optional)
  controlsWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  bigBtn: {
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.55)",
    color: "#e2e8f0",
    padding: "12px 14px",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    minWidth: 64,
  },


};
