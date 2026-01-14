import { useEffect, useState } from "react";

export default function useImage(src) {
  const [img, setImg] = useState(null);

  useEffect(() => {
    if (!src) return;
    const image = new Image();
    image.src = src;
    image.onload = () => setImg(image);
  }, [src]);

  return img;
}
