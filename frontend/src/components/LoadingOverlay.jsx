import "./LoadingOverlay.css";

export default function LoadingOverlay({ show, text = "Loading..." }) {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner" />
        <p className="loading-text">{text}</p>
      </div>
    </div>
  );
}
