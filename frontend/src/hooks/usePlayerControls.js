import { useEffect, useState } from "react";

const KEY_MAP = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

export function usePlayerControls() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const action = KEY_MAP[e.code];
      if (!action) return;
      setKeys((prev) => ({ ...prev, [action]: true }));
    };

    const handleKeyUp = (e) => {
      const action = KEY_MAP[e.code];
      if (!action) return;
      setKeys((prev) => ({ ...prev, [action]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keys;
}
