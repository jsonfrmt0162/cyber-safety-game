import { useEffect } from "react";
import "./Toast.css";

export default function Toast({ type = "info", message, open, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        {type === "success" && "✅"}
        {type === "error" && "⚠️"}
        {type === "info" && "💡"}
      </div>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}
