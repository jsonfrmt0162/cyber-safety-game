import { useEffect, useRef, useState } from "react";

export default function useSprite(src) {
  const imgRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.onerror = () => {
      console.error("Failed to load sprite:", src);
      setReady(false);
    };
  }, [src]);

  return { img: imgRef.current, ready };
}
