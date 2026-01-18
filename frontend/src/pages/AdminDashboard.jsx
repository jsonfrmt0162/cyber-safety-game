import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // your axios instance

export default function AdminDashboard() {
  const [tab, setTab] = useState("users"); // users | suspicious | reports
  const [users, setUsers] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const token = localStorage.getItem("token");
  const isAdmin = localStorage.getItem("is_admin") === "true";

  useEffect(() => {
    if (!isAdmin) setMsg("❌ Admin access required.");
  }, [isAdmin]);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", { headers });
      setUsers(res.data);
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadSuspicious = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users/suspicious", { headers });
      setSuspicious(res.data);
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Failed to load suspicious users");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/report/summary", { headers });
      setSummary(res.data);
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    setMsg("");
    if (tab === "users") loadUsers();
    if (tab === "suspicious") loadSuspicious();
    if (tab === "reports") loadSummary();
    // eslint-disable-next-line
  }, [tab, isAdmin]);

  const blockUser = async (userId) => {
    const reason = prompt("Reason for blocking?", "Suspicious activity");
    if (!reason) return;

    setLoading(true);
    try {
      await api.post(`/admin/users/${userId}/block`, { reason }, { headers });
      setMsg("✅ User blocked");
      tab === "users" ? loadUsers() : loadSuspicious();
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Failed to block user");
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId) => {
    setLoading(true);
    try {
      await api.post(`/admin/users/${userId}/unblock`, {}, { headers });
      setMsg("✅ User unblocked");
      tab === "users" ? loadUsers() : loadSuspicious();
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Failed to unblock user");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={styles.page}>
        <h1 style={styles.h1}>Admin Dashboard</h1>
        <p style={styles.error}>{msg}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.top}>
        <h1 style={styles.h1}>🛠 Admin Dashboard</h1>
        <div style={styles.tabs}>
          <button style={tabBtn(tab === "users")} onClick={() => setTab("users")}>
            Users
          </button>
          <button
            style={tabBtn(tab === "suspicious")}
            onClick={() => setTab("suspicious")}
          >
            Suspicious
          </button>
          <button
            style={tabBtn(tab === "reports")}
            remember
            onClick={() => setTab("reports")}
          >
            Reports
          </button>
        </div>
      </div>

      {msg && <div style={styles.toast}>{msg}</div>}
      {loading && <div style={styles.loading}>Loading…</div>}

      {tab === "users" && (
        <div style={styles.card}>
          <h2 style={styles.h2}>All Users</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Blocked</th>
                <th>Failed Logins</th>
                <th>Last IP</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.is_blocked ? "✅ Yes" : "No"}</td>
                  <td>{u.failed_login_attempts}</td>
                  <td>{u.last_login_ip || "-"}</td>
                  <td>
                    {u.is_blocked ? (
                      <button style={styles.btnOk} onClick={() => unblockUser(u.id)}>
                        Unblock
                      </button>
                    ) : (
                      <button style={styles.btnBad} onClick={() => blockUser(u.id)}>
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "suspicious" && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Suspicious Users</h2>
          <p style={styles.small}>
            Rule: failed logins ≥ 5 (you can change the rules in backend).
          </p>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Failed Logins</th>
                <th>Last IP</th>
                <th>Blocked</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {suspicious.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.failed_login_attempts}</td>
                  <td>{u.last_login_ip || "-"}</td>
                  <td>{u.is_blocked ? "✅ Yes" : "No"}</td>
                  <td>
                    {u.is_blocked ? (
                      <button style={styles.btnOk} onClick={() => unblockUser(u.id)}>
                        Unblock
                      </button>
                    ) : (
                      <button style={styles.btnBad} onClick={() => blockUser(u.id)}>
                        Block Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {suspicious.length === 0 && (
                <tr>
                  <td colSpan="6" style={styles.small}>No suspicious users 🎉</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "reports" && (
        <div style={styles.card}>
          <h2 style={styles.h2}>Reports</h2>
          {!summary ? (
            <p style={styles.small}>No data loaded.</p>
          ) : (
            <div style={styles.grid}>
              <div style={styles.stat}>👥 Total Users: <b>{summary.total_users}</b></div>
              <div style={styles.stat}>⛔ Blocked: <b>{summary.total_blocked}</b></div>
              <div style={styles.stat}>🚩 Suspicious: <b>{summary.total_suspicious}</b></div>

              <div style={{ ...styles.stat, gridColumn: "1 / -1" }}>
                <b>Top Scores</b>
                <ul>
                  {summary.top_scores.map((s, i) => (
                    <li key={i}>
                      User {s.user_id} • Game {s.game_id} • Score {s.score}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <button style={styles.btnOk} onClick={loadSummary}>Refresh</button>
        </div>
      )}
    </div>
  );
}

const tabBtn = (active) => ({
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(148,163,184,0.25)",
  background: active ? "rgba(34,197,94,0.25)" : "rgba(2,6,23,0.35)",
  color: "#e2e8f0",
  cursor: "pointer",
  fontWeight: 800,
});

const styles = {
  page: {
    minHeight: "100vh",
    padding: 18,
    background: "linear-gradient(180deg,#050a12,#070f1b)",
    color: "#e2e8f0",
    fontFamily: "system-ui,Segoe UI,Roboto",
  },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 },
  tabs: { display: "flex", gap: 10, flexWrap: "wrap" },
  h1: { margin: 0, fontSize: 28, fontWeight: 900 },
  h2: { marginTop: 0 },
  card: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.45)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  toast: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    background: "rgba(2,6,23,0.55)",
    border: "1px solid rgba(148,163,184,0.25)",
  },
  loading: { marginTop: 12, opacity: 0.9 },
  error: { marginTop: 10, color: "#fca5a5", fontWeight: 800 },
  small: { opacity: 0.85, fontSize: 12 },
  btnBad: {
    border: "none",
    borderRadius: 12,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  btnOk: {
    border: "none",
    borderRadius: 12,
    padding: "8px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 },
  stat: {
    padding: 12,
    borderRadius: 14,
    background: "rgba(15,23,42,0.6)",
    border: "1px solid rgba(148,163,184,0.18)",
  },
};
