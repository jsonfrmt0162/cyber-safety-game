import React, { useEffect, useMemo, useState } from "react";
import { api, adminCreateUser, adminUpdateUser } from "../services/api";
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

  // ✅ Create user modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    birthday: "",
    age: "",
    is_admin: false,
  });

  // Feedback
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackBusyId, setFeedbackBusyId] = useState(null);

  const toggleFeedbackExpand = (id) => {
    setFeedbacks((prev) =>
      prev.map((x) => (x.id === id ? { ...x, __expanded: !x.__expanded } : x))
    );
  };

  // ✅ Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    password: "",
  });

  const openEditModal = (u) => {
    setEditUser(u);
    setEditForm({
      username: u.username || "",
      password: "",
    });
    setShowEdit(true);
  };

  const closeEditModal = () => {
    if (editBusy) return;
    setShowEdit(false);
    setEditUser(null);
  };

  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, suspiciousRes, feedbackRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/users/suspicious").catch(() => ({ data: [] })),
        api.get("/feedback/admin").catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setSuspiciousUsers(suspiciousRes.data || []);
      setFeedbacks(feedbackRes.data || []);
    } finally {
      setLoading(false);
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
    if (reason === null) return;

    setBusyUserId(user.id);
    try {
      await api.post(`/admin/users/${user.id}/block`, { reason });
      await fetchAll();

      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) =>
          prev ? { ...prev, is_blocked: true, blocked_reason: reason } : prev
        );
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

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!createForm.username || !createForm.email || !createForm.password) {
      alert("Please fill up username, email, password.");
      return;
    }
    if (!createForm.birthday) {
      alert("Please select birthday.");
      return;
    }
    const ageNum = Number(createForm.age);
    if (!ageNum || ageNum < 13 || ageNum > 17) {
      alert("Age must be between 13 and 17.");
      return;
    }

    setCreateBusy(true);
    try {
      await adminCreateUser({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        birthday: createForm.birthday,
        age: ageNum,
        is_admin: !!createForm.is_admin,
      });

      setShowCreate(false);
      setCreateForm({
        username: "",
        email: "",
        password: "",
        birthday: "",
        age: "",
        is_admin: false,
      });

      await fetchAll();
      alert("User created ✅");
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to create user");
    } finally {
      setCreateBusy(false);
    }
  };

  const closeCreateModal = () => {
    if (createBusy) return;
    setShowCreate(false);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    const payload = {};
    if (editForm.username !== editUser.username) payload.username = editForm.username;
    if (editForm.password.trim()) payload.password = editForm.password;

    if (Object.keys(payload).length === 0) {
      alert("No changes made");
      return;
    }

    setEditBusy(true);
    try {
      await adminUpdateUser(editUser.id, payload);
      alert("✅ User updated");
      setShowEdit(false);
      await fetchAll();
    } catch (e) {
      const detail = e?.response?.data?.detail;

      if (Array.isArray(detail)) {
        const msg = detail.map((d) => `${d.loc?.join(".")}: ${d.msg}`).join("\n");
        alert(msg);
      } else if (typeof detail === "string") {
        alert(detail);
      } else {
        alert(e?.response?.data?.message || e?.message || "Request failed");
      }
    } finally {
      setEditBusy(false);
    }
  };

  const resolveFeedback = async (feedbackId) => {
    const ok = window.confirm("Mark this feedback as resolved?");
    if (!ok) return;

    setFeedbackBusyId(feedbackId);
    try {
      await api.post(`/feedback/admin/${feedbackId}/resolve`);
      alert("✅ Resolved feedback.");
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to resolve feedback");
    } finally {
      setFeedbackBusyId(null);
    }
  };

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

        <div className="admin-header-actions">
          <button className="admin-refresh" onClick={() => setShowCreate(true)}>
            ➕ Create User
          </button>

          <button className="admin-refresh" onClick={fetchAll}>
            🔄 Refresh
          </button>
        </div>
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

      {/* ✅ Create User Modal */}
      {showCreate && (
        <div className="admin-modal-backdrop" onClick={closeCreateModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-top">
              <h2 className="admin-panel-title" style={{ marginBottom: 6 }}>
                ➕ Create User
              </h2>

              <button
                type="button"
                className="admin-btn ghost"
                onClick={closeCreateModal}
                disabled={createBusy}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="admin-modal-form">
              <input
                placeholder="Username"
                value={createForm.username}
                onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))}
                required
              />

              <input
                placeholder="Email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                required
              />

              <input
                placeholder="Password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                required
              />

              <div className="admin-modal-row">
                <input
                  type="date"
                  value={createForm.birthday}
                  onChange={(e) => setCreateForm((p) => ({ ...p, birthday: e.target.value }))}
                  required
                />

                <input
                  type="number"
                  min="13"
                  placeholder="Age (13-17)"
                  value={createForm.age}
                  onChange={(e) => setCreateForm((p) => ({ ...p, age: e.target.value }))}
                  required
                />
              </div>

              <label className="admin-modal-check">
                <input
                  type="checkbox"
                  checked={createForm.is_admin}
                  onChange={(e) => setCreateForm((p) => ({ ...p, is_admin: e.target.checked }))}
                />
                Create as Admin
              </label>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn ghost"
                  onClick={closeCreateModal}
                  disabled={createBusy}
                >
                  Cancel
                </button>

                <button type="submit" className="admin-btn" disabled={createBusy}>
                  {createBusy ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Edit User Modal */}
      {showEdit && editUser && (
        <div className="admin-modal-backdrop" onClick={closeEditModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-top">
              <h2 className="admin-panel-title" style={{ marginBottom: 6 }}>
                ✏ Edit User (ID: {editUser.id})
              </h2>

              <button
                type="button"
                className="admin-btn ghost"
                onClick={closeEditModal}
                disabled={editBusy}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleEditUser} className="admin-modal-form">
              <input
                placeholder="Username"
                value={editForm.username}
                onChange={(e) => setEditForm((p) => ({ ...p, username: e.target.value }))}
                required
              />

              <input
                placeholder="New Password (leave blank to keep)"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
              />

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-btn ghost"
                  onClick={closeEditModal}
                  disabled={editBusy}
                >
                  Cancel
                </button>

                <button type="submit" className="admin-btn" disabled={editBusy}>
                  {editBusy ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspicious Panel */}
      {suspiciousUsers?.length > 0 && (
        <div className="admin-panel" style={{ marginTop: 16 }}>
          <h2 className="admin-panel-title">🚩 Suspicious Users</h2>
          <p className="admin-muted">
            These users matched your suspicion rules (e.g., many failed logins).
          </p>

          <div className="admin-table table-suspicious">
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
                <div style={{ fontWeight: 900 }}>
                  {u.username} <span style={{ marginLeft: 8 }}>🚩</span>
                </div>
                <div className="admin-email">{u.email}</div>
                <div>{u.failed_login_attempts ?? 0}</div>

                <div className="actions">
                  <button className="admin-btn" onClick={() => fetchProgress(u)}>
                    View Progress
                  </button>

                  {!u.is_blocked ? (
                    <button
                      className="admin-btn danger"
                      disabled={busyUserId === u.id}
                      onClick={() => blockUser(u)}
                    >
                      {busyUserId === u.id ? "Blocking..." : "⛔ Block"}
                    </button>
                  ) : (
                    <button
                      className="admin-btn success"
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
        {/* Users Panel */}
        <section className="admin-panel">
          <h2 className="admin-panel-title">👥 Users</h2>

          <div className="admin-filters">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search id / username / email..."
            />

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="players">Players</option>
              <option value="admins">Admins</option>
              <option value="blocked">Blocked</option>
              <option value="suspicious">Suspicious</option>
            </select>
          </div>

          <div className="admin-table table-users">
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

                  <div style={{ fontWeight: 900 }}>
                    {u.username}
                    {isSusp && <span style={{ marginLeft: 8 }}>🚩</span>}
                    {u.is_blocked && <span style={{ marginLeft: 8 }}>⛔</span>}
                  </div>

                  <div className="admin-email">{u.email}</div>
                  <div>{u.is_admin ? "Admin" : "Player"}</div>

                  <div className="statusline">
                    <span className={`chip ${u.is_blocked ? "chip-danger" : "chip-ok"}`}>
                      {u.is_blocked ? "Blocked" : "Active"}
                    </span>
                    {isSusp && <span className="chip chip-warn">Suspicious</span>}
                  </div>

                  <div className="actions">
                    <button className="admin-btn" onClick={() => fetchProgress(u)}>
                      View Progress
                    </button>

                    <button className="admin-btn subtle" onClick={() => openEditModal(u)}>
                      ✏ Edit
                    </button>

                    {!u.is_admin && !u.is_blocked && (
                      <button
                        className="admin-btn danger"
                        disabled={busyUserId === u.id}
                        onClick={() => blockUser(u)}
                      >
                        {busyUserId === u.id ? "Blocking..." : "⛔ Block"}
                      </button>
                    )}

                    {!u.is_admin && u.is_blocked && (
                      <button
                        className="admin-btn success"
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

        {/* Progress Panel */}
        <section className="admin-panel">
          <h2 className="admin-panel-title">📊 User Progress</h2>

          {!selectedUser && <p className="admin-muted">Select a user to view topic progress.</p>}

          {selectedUser && !progress && (
            <p className="admin-muted">Loading progress for {selectedUser.username}...</p>
          )}

          {selectedUser && progress && (
            <div className="progress-box">
              <div className="progress-user">
                <div className="progress-name">
                  {selectedUser.username} {selectedUser.is_blocked && <span>⛔</span>}
                </div>
                <div className="progress-id">User ID: {selectedUser.id}</div>

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

      {/* Feedback Panel */}
      <section className="admin-panel" style={{ marginTop: 16 }}>
        <h2 className="admin-panel-title">📝 Feedback</h2>

        <div className="admin-table table-feedback">
          <div className="admin-row admin-head">
            <div>ID</div>
            <div>User</div>
            <div>Topic</div>
            <div>Category</div>
            <div>Comment</div>
            <div>Rating</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          {feedbacks.map((f) => {
            const comment = (f.message || "-").trim();
            const canToggle = comment.length > 140;

            return (
              <div key={f.id} className={`admin-row ${f.is_resolved ? "is-done" : ""}`}>
                <div>{f.id}</div>

                <div>
                  <span className="chip chip-user">👤 {f.username || `User #${f.user_id}`}</span>
                </div>

                <div>
                  <span className="chip chip-topic">📘 Topic {f.topic_id}</span>
                </div>

                <div>
                  <span className={`chip chip-cat ${String(f.category || "other").toLowerCase()}`}>
                    🏷️ {f.category || "other"}
                  </span>
                </div>

                <div className="comment">
                  <p className={`comment-text ${f.__expanded ? "expanded" : ""}`}>{comment}</p>
                  {canToggle && (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => toggleFeedbackExpand(f.id)}
                    >
                      {f.__expanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>

                <div>
                  <span className="stars" aria-label={`Rating ${f.rating ?? 0}`}>
                    {"⭐".repeat(Number(f.rating || 0)) || "—"}
                  </span>
                </div>

                <div>
                  <span className={`chip ${f.is_resolved ? "chip-done" : "chip-pending"}`}>
                    {f.is_resolved ? "✅ Resolved" : "⏳ Pending"}
                  </span>
                </div>

                <div className="actions">
                  {!f.is_resolved ? (
                    <button
                      className="admin-btn"
                      disabled={feedbackBusyId === f.id}
                      onClick={() => resolveFeedback(f.id)}
                    >
                      {feedbackBusyId === f.id ? "✨ Fixing..." : "✅ Resolve"}
                    </button>
                  ) : (
                    <button className="admin-btn subtle" disabled>
                      🎉 Resolved
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
