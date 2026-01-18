import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import "../styles/AdminDashboard.css";
import { useNavigate } from "react-router-dom";

const TOPIC_LABELS = {
  1: "Topic 1 (Digital Footprint)",
  2: "Topic 2 (Personal Info)",
  3: "Topic 3 (Passwords)",
  4: "Topic 4 (Social Media)",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [progress, setProgress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | blocked | suspicious | players | admins

  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, suspiciousRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/users/suspicious").catch(() => ({ data: [] })), // if route not yet deployed, don't crash
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setSuspiciousUsers(suspiciousRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (user) => {
    setSelectedUser(user);
    setProgress(null);
    const res = await api.get(`/admin/users/${user.id}/progress`);
    setProgress(res.data);
  };

  const blockUser = async (user) => {
    const reason = window.prompt(
      `Block ${user.username}?\n\nEnter reason (optional):`,
      "Suspicious activity"
    );

    // If admin pressed Cancel, do nothing
    if (reason === null) return;

    setBusyUserId(user.id);
    try {
      await api.post(`/admin/users/${user.id}/block`, { reason });
      await fetchAll();

      // refresh selected user view
      if (selectedUser?.id === user.id) {
        const updated = (prev) =>
          prev ? { ...prev, is_blocked: true, blocked_reason: reason } : prev;
        setSelectedUser(updated);
      }
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to block user");
    } finally {
      setBusyUserId(null);
    }
  };

  const unblockUser = async (user) => {
    const ok = window.confirm(`Unblock ${user.username}?`);
    if (!ok) return;

    setBusyUserId(user.id);
    try {
      await api.post(`/admin/users/${user.id}/unblock`);
      await fetchAll();

      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) =>
          prev ? { ...prev, is_blocked: false, blocked_reason: null } : prev
        );
      }
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to unblock user");
    } finally {
      setBusyUserId(null);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suspiciousIds = useMemo(() => {
    return new Set((suspiciousUsers || []).map((u) => u.id));
  }, [suspiciousUsers]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (users || [])
      .filter((u) => {
        if (!q) return true;
        return (
          String(u.id).includes(q) ||
          (u.username || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
        );
      })
      .filter((u) => {
        if (filter === "all") return true;
        if (filter === "blocked") return !!u.is_blocked;
        if (filter === "suspicious") return suspiciousIds.has(u.id) || !!u.suspicious;
        if (filter === "players") return !u.is_admin;
        if (filter === "admins") return !!u.is_admin;
        return true;
      });
  }, [users, query, filter, suspiciousIds]);

  if (loading) return <div className="admin-page">Loading admin dashboard...</div>;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <button className="admin-back" onClick={() => navigate("/dashboard")}>
          ⬅ Back
        </button>

        <div>
          <h1 className="admin-title">🛠 Admin Dashboard</h1>
          <p className="admin-subtitle">
            Monitor players, scores, topic progress, and suspicious activity.
          </p>
        </div>

        <button className="admin-refresh" onClick={fetchAll}>
          🔄 Refresh
        </button>
      </header>

      {stats && (
        <div className="admin-cards">
          <div className="admin-card">
            <div className="admin-card-label">Total Users</div>
            <div className="admin-card-value">{stats.total_users}</div>
          </div>

          <div className="admin-card">
            <div className="admin-card-label">Total Scores Saved</div>
            <div className="admin-card-value">{stats.total_scores}</div>
          </div>

          <div className="admin-card">
            <div className="admin-card-label">Players With Scores</div>
            <div className="admin-card-value">{stats.top_players}</div>
          </div>

          {"total_blocked" in stats && (
            <div className="admin-card">
              <div className="admin-card-label">Blocked Users</div>
              <div className="admin-card-value">{stats.total_blocked}</div>
            </div>
          )}
        </div>
      )}

      {/* Optional: suspicious panel */}
      {suspiciousUsers?.length > 0 && (
        <div className="admin-panel" style={{ marginTop: 16 }}>
          <h2 className="admin-panel-title">🚩 Suspicious Users</h2>
          <p style={{ opacity: 0.85, marginTop: -6 }}>
            These users matched your suspicion rules (e.g., many failed logins).
          </p>

          <div className="admin-table">
            <div className="admin-row admin-head">
              <div>ID</div>
              <div>Username</div>
              <div>Email</div>
              <div>Failed Attempts</div>
              <div>Action</div>
            </div>

            {suspiciousUsers.map((u) => (
              <div key={u.id} className="admin-row">
                <div>{u.id}</div>
                <div>
                  {u.username}{" "}
                  <span style={{ marginLeft: 8, fontWeight: 800 }}>🚩</span>
                </div>
                <div className="admin-email">{u.email}</div>
                <div>{u.failed_login_attempts ?? 0}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="admin-btn" onClick={() => fetchProgress(u)}>
                    View Progress
                  </button>

                  {!u.is_blocked ? (
                    <button
                      className="admin-btn"
                      disabled={busyUserId === u.id}
                      onClick={() => blockUser(u)}
                    >
                      {busyUserId === u.id ? "Blocking..." : "⛔ Block"}
                    </button>
                  ) : (
                    <button
                      className="admin-btn"
                      disabled={busyUserId === u.id}
                      onClick={() => unblockUser(u)}
                    >
                      {busyUserId === u.id ? "Unblocking..." : "✅ Unblock"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-grid">
        <section className="admin-panel">
          <h2 className="admin-panel-title">👥 Users</h2>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search id / username / email..."
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                minWidth: 240,
                flex: 1,
              }}
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                fontWeight: 700,
              }}
            >
              <option value="all">All</option>
              <option value="players">Players</option>
              <option value="admins">Admins</option>
              <option value="blocked">Blocked</option>
              <option value="suspicious">Suspicious</option>
            </select>
          </div>

          <div className="admin-table">
            <div className="admin-row admin-head">
              <div>ID</div>
              <div>Username</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div>Action</div>
            </div>

            {filteredUsers.map((u) => {
              const isSusp = suspiciousIds.has(u.id) || !!u.suspicious;
              return (
                <div key={u.id} className="admin-row">
                  <div>{u.id}</div>

                  <div style={{ fontWeight: 800 }}>
                    {u.username}
                    {isSusp && <span style={{ marginLeft: 8 }}>🚩</span>}
                    {u.is_blocked && <span style={{ marginLeft: 8 }}>⛔</span>}
                  </div>

                  <div className="admin-email">{u.email}</div>
                  <div>{u.is_admin ? "Admin" : "Player"}</div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {u.is_blocked ? (
                      <span style={{ fontWeight: 900 }}>Blocked</span>
                    ) : (
                      <span style={{ fontWeight: 900 }}>Active</span>
                    )}
                    {isSusp && <span style={{ fontWeight: 900 }}>Suspicious</span>}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="admin-btn" onClick={() => fetchProgress(u)}>
                      View Progress
                    </button>

                    {!u.is_admin && !u.is_blocked && (
                      <button
                        className="admin-btn"
                        disabled={busyUserId === u.id}
                        onClick={() => blockUser(u)}
                      >
                        {busyUserId === u.id ? "Blocking..." : "⛔ Block"}
                      </button>
                    )}

                    {!u.is_admin && u.is_blocked && (
                      <button
                        className="admin-btn"
                        disabled={busyUserId === u.id}
                        onClick={() => unblockUser(u)}
                      >
                        {busyUserId === u.id ? "Unblocking..." : "✅ Unblock"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel-title">📊 User Progress</h2>

          {!selectedUser && <p>Select a user to view topic progress.</p>}

          {selectedUser && !progress && (
            <p>Loading progress for {selectedUser.username}...</p>
          )}

          {selectedUser && progress && (
            <div className="progress-box">
              <div className="progress-user">
                <div className="progress-name">
                  {selectedUser.username}{" "}
                  {selectedUser.is_blocked && <span>⛔</span>}
                </div>
                <div className="progress-id">User ID: {selectedUser.id}</div>

                {/* Optional: show block reason if present */}
                {selectedUser.is_blocked && selectedUser.blocked_reason && (
                  <div style={{ marginTop: 6, opacity: 0.9 }}>
                    <b>Reason:</b> {selectedUser.blocked_reason}
                  </div>
                )}
              </div>

              <div className="progress-list">
                {[1, 2, 3, 4].map((gid) => {
                  const best = progress.best_scores?.[gid] ?? 0;
                  return (
                    <div key={gid} className="progress-item">
                      <div className="progress-label">{TOPIC_LABELS[gid]}</div>

                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(100, best)}%` }}
                        />
                      </div>

                      <div className="progress-score">{best}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
