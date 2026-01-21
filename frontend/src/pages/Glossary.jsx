// src/pages/Glossary.jsx
import "../styles/Dashboard.css";
import { useLocation, useNavigate } from "react-router-dom";

export default function Glossary() {
 const navigate = useNavigate();
  return (
    
    <div className="glossary-page">
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
    </div>
      <div className="glossary-hero">
        <div className="glossary-hero-icon">📚</div>
        <div>
          <h1>CyberQuest.TO Glossary</h1>
          <p>
            Quick definitions to help you understand important words from your
            online safety lessons.
          </p>
        </div>
      </div>

      <div className="glossary-grid">
        <div className="glossary-card">
          <h2>Digital Footprint</h2>
          <p>
            The record of everything you do online, including posts, comments,
            likes, searches, and data collected by apps or websites.
          </p>
        </div>

        <div className="glossary-card">
          <h2>Active &amp; Passive Footprints</h2>
          <p>
            <strong>Active:</strong> Information you share on purpose (posts,
            comments).<br />
            <strong>Passive:</strong> Information collected in the background
            (location, cookies, tracking).
          </p>
        </div>

        <div className="glossary-card">
          <h2>Personal Information</h2>
          <p>
            Details that can identify you, such as full name, birthday,
            address, school, phone number, or ID numbers.
          </p>
        </div>

        <div className="glossary-card">
          <h2>Password</h2>
          <p>
            A secret word or string of characters that lets you access an
            account. Strong passwords are long and hard to guess.
          </p>
        </div>

        <div className="glossary-card">
          <h2>Passphrase</h2>
          <p>
            A longer password made from several words, often with numbers and
            symbols added (for example: <em>T1ger!Rainbow!Tree</em>).
          </p>
        </div>

        <div className="glossary-card">
          <h2>Phishing</h2>
          <p>
            A fake message, email, or website that tries to trick you into
            giving personal information or passwords.
          </p>
        </div>

        <div className="glossary-card">
          <h2>Privacy Settings</h2>
          <p>
            Controls on apps and websites that decide who can see your posts,
            profile, or personal information.
          </p>
        </div>

        <div className="glossary-card">
          <h2>Two-Factor Authentication (2FA)</h2>
          <p>
            An extra security step where you need something else besides your
            password, like a code sent to your phone.
          </p>
        </div>  

      </div>
              {/* CYBER SAFETY PLEDGE */}
              <div className="pledge-card">
        <h2>✋ CyberQuest.TO Pledge</h2>
        <p>
          By using this site, I promise to:
        </p>
        <ul>
          <li>Think before I post or share anything online.</li>
          <li>Protect my personal information like a treasure chest.</li>
          <li>Use strong passwords and keep them private.</li>
          <li>Check my privacy settings and keep my accounts secure.</li>
          <li>Ask a trusted adult if I am unsure about something online.</li>
        </ul>
      </div>
    </div>
  );
}
