import React, { useEffect, useState } from "react";
import { api } from "../services/api"; // assuming api already attaches baseURL
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
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

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) return <div className="admin-page">Loading admin dashboard...</div>;

  return (
    <div className="admin-page">
      <header className="admin-header">
      <button className="admin-back" onClick={() => navigate("/dashboard")}>
           ⬅ Back
         </button>
        <div>
          <h1 className="admin-title">🛠 Admin Dashboard</h1>
          <p className="admin-subtitle">Monitor players, scores, and topic progress.</p>
        </div>

        <button className="admin-refresh" onClick={fetchAll}>🔄 Refresh</button>
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
        </div>
      )}

      <div className="admin-grid">
        <section className="admin-panel">
          <h2 className="admin-panel-title">👥 Users</h2>

          <div className="admin-table">
            <div className="admin-row admin-head">
              <div>ID</div>
              <div>Username</div>
              <div>Email</div>
              <div>Role</div>
              <div>Action</div>
            </div>

            {users.map((u) => (
              <div key={u.id} className="admin-row">
                <div>{u.id}</div>
                <div>{u.username}</div>
                <div className="admin-email">{u.email}</div>
                <div>{u.is_admin ? "Admin" : "Player"}</div>
                <div>
                  <button className="admin-btn" onClick={() => fetchProgress(u)}>
                    View Progress
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel-title">📊 User Progress</h2>

          {!selectedUser && <p>Select a user to view topic progress.</p>}

          {selectedUser && !progress && <p>Loading progress for {selectedUser.username}...</p>}

          {selectedUser && progress && (
            <div className="progress-box">
              <div className="progress-user">
                <div className="progress-name">{selectedUser.username}</div>
                <div className="progress-id">User ID: {selectedUser.id}</div>
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
